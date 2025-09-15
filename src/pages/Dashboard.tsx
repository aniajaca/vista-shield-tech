import React, { useState, useEffect } from "react";
import { ScanResult } from "@/entities/ScanResult";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import ScannerInterface from "../components/clean-scanner/ScannerInterface";
import Header from "../components/dashboard/Header";
import SummaryStrip from "../components/dashboard/SummaryStrip";
import FindingsTable from "../components/dashboard/FindingsTable";
import FindingDrawer from "../components/dashboard/FindingDrawer";
import ExportModal from "../components/dashboard/ExportModal";
import { RiskSettingsDrawer } from "@/components/RiskSettingsDrawer";
import { useRiskSettings } from "@/hooks/useRiskSettings";
import { AlertCircle, Settings } from "lucide-react";
import { scanFileUpload, scanCode, testConnection, getHealthStatus } from "@/lib/api";

/**
 * Scan uploaded file using the centralized API
 */
function inferLanguageFromFilename(name = '') {
  const ext = (name.split('.').pop() || '').toLowerCase();
  switch (ext) {
    case 'js': case 'jsx': return 'javascript';
    case 'ts': case 'tsx': return 'typescript';
    case 'py': return 'python';
    case 'java': return 'java';
    case 'go': return 'go';
    case 'rb': return 'ruby';
    case 'php': return 'php';
    case 'cs': return 'csharp';
    default: return 'javascript';
  }
}

async function scanFile(file, riskConfig = null, context = null) {
  try {
    console.log('📄 scanFile called! File details:', {
      name: file.name,
      size: file.size,
      type: file.type
    });
    console.log('🔧 Risk config:', riskConfig);
    console.log('🌍 Context:', context);

    const language = inferLanguageFromFilename(file.name);
    console.log('🚀 Preferring /scan-file with language:', language);
    
    const data = await scanFileUpload(file, language, riskConfig, context);
    console.log('✅ Scan API returned:', data);

    // Debug the response structure
    console.log('🔍 API Response Structure:');
    console.log('- Type:', typeof data);
    console.log('- Keys:', Object.keys(data));
    console.log('- findings:', data.findings);
    console.log('- findings type:', typeof data.findings);
    console.log('- findings length:', data.findings?.length);
    if (data.findings && data.findings.length > 0) {
      console.log('- First finding:', data.findings[0]);
      console.log('- First finding keys:', Object.keys(data.findings[0]));
    }
    return {
      success: true,
      data: data
    };
  } catch (error) {
    console.error('❌ Scan failed:', error);
    return {
      success: false,
      error: error.message || 'Code scanning failed',
      details: {
        originalError: error.message,
        timestamp: new Date().toISOString()
      }
    };
  }
}
export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [backendStatus, setBackendStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [activeTab, setActiveTab] = useState<'scanner' | 'dependencies'>('scanner');
  const [selectedFinding, setSelectedFinding] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const {
    getRiskConfig,
    getRiskContext
  } = useRiskSettings();

  // Test backend connection on component mount
  useEffect(() => {
    const testBackend = async () => {
      console.log('🔍 Testing backend connection...');
      try {
        const isHealthy = await testConnection();
        const healthStatus = await getHealthStatus();
        console.log('✅ Backend health status:', healthStatus);
        setBackendStatus(isHealthy ? 'online' : 'offline');
      } catch (error) {
        console.error('❌ Backend connection failed:', error);
        setBackendStatus('offline');
      }
    };
    testBackend();
  }, []);
  const handleScan = async options => {
    console.log('🚀 handleScan called with options:', options);
    console.log('📁 File details:', options.file ? { name: options.file.name, size: options.file.size, type: options.file.type } : 'NO FILE');
    setIsLoading(true);
    setError(null);
    setScanResult(null);
    setProgress(0);
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 5;
      });
    }, 200);
    try {
      if (!options.file) {
        throw new Error("No file selected for scanning.");
      }
      console.log('🔍 Starting scan for file:', options.file.name);
      console.log('📁 File details:', { name: options.file.name, size: options.file.size, type: options.file.type });

      // Get current risk settings
      const riskConfig = getRiskConfig();
      const context = getRiskContext();
      console.log('🎯 Using risk config:', riskConfig);
      console.log('🌍 Using context:', context);
      console.log('🔄 About to call scanFile...');
      const response = await scanFile(options.file, riskConfig, context);
      console.log('📨 scanFile response:', response);
      if (response.success) {
        console.log('📊 Setting scan result:', response.data);
        console.log('📊 Findings count:', response.data?.findings?.length || 0);
        console.log('📊 First finding:', response.data?.findings?.[0]);
        
        // Debug: Log metadata to check engine and scan_time
        console.log('🔧 Scan metadata:', response.data.metadata);
        console.log('⏱️ Scan time from metadata:', response.data.metadata?.scan_time);
        console.log('🔍 Engine from metadata:', response.data.metadata?.engine);

        // Debug: Log findings data structure for verification
        if (response.data.findings && response.data.findings.length > 0) {
          console.log('🔍 First finding structure:', response.data.findings[0]);

          // Check for missing or fallback data
          response.data.findings.forEach((finding, index) => {
            const issues = [];
            if (!finding.title && !finding.name && !finding.check_id) {
              issues.push('Missing specific vulnerability name');
            }
            if (!finding.cwe || !finding.cwe.description) {
              issues.push('Missing CWE details');
            }
            if (!finding.owasp || !finding.owasp.category) {
              issues.push('Missing OWASP classification');
            }
            if (!finding.cvss || !finding.cvss.baseScore && !finding.cvss.adjustedScore) {
              issues.push('Missing CVSS scores');
            }
            if (!finding.businessImpact) {
              issues.push('Missing business impact');
            }
            if (issues.length > 0) {
              console.warn(`🚨 Finding ${index + 1} missing data:`, issues, finding);
            }
          });
        }
        setScanResult(response.data);

        // Save to database
        await ScanResult.create({
          ...response.data,
          fileName: options.file.name
        });
        console.log('💾 Scan result saved to database');
      } else {
        throw new Error(response.error);
      }
    } catch (err) {
      console.error('🚨 Scan process failed:', err);
      setError(`Failed to complete scan: ${err.message}`);
    } finally {
      clearInterval(progressInterval);
      setProgress(100);
      // Remove the delay to prevent white screen
      setIsLoading(false);
    }
  };
  const hasResults = scanResult && !isLoading;

  const handleFindingClick = (finding: any) => {
    setSelectedFinding(finding);
    setIsDrawerOpen(true);
  };

  const handleNewScan = () => {
    setScanResult(null);
    setError(null);
  };

  const handleExport = () => {
    setIsExportModalOpen(true);
  };

  const handleOpenSettings = () => {
    // The drawer manages its own state, we just need to trigger it
    // This will be handled by the Header component clicking the actual trigger
  };

  // Extract data for summary strip
  const getSummaryData = () => {
    if (!scanResult) return null;
    
    const riskScore = scanResult.score?.final || scanResult.riskAssessment?.riskScore || 0;
    const riskLevel = scanResult.risk?.level || scanResult.riskAssessment?.riskLevel || 'None';
    const findings = scanResult.riskAssessment?.findingsBreakdown || scanResult.stats || {};
    const scanTime = scanResult.metadata?.scan_time || (scanResult.performance?.scanTime ? `${scanResult.performance.scanTime.toFixed(2)}s` : 'N/A');
    const engineRaw = scanResult.metadata?.engine || scanResult.metadata?.scanner;
    const engine = typeof engineRaw === 'string' ? 
      (engineRaw.toLowerCase().includes('semgrep') ? 'Semgrep Scanner' : 
       engineRaw.toLowerCase().includes('ast') ? 'AST Scanner' : engineRaw) : 'N/A';
    const rulesExecuted = scanResult.performance?.rulesExecuted || 'N/A';
    const semgrepVersion = scanResult.metadata?.semgrepVersion;

    return { riskScore, riskLevel, findings, scanTime, engine, rulesExecuted, semgrepVersion };
  };

  const summaryData = getSummaryData();

  return (
    <div className="min-h-screen bg-background">
      <style>{`
        .progress-bar {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 3px;
          z-index: 9999;
          background-color: transparent;
        }
        .progress-bar > div {
          background-color: hsl(var(--accent));
        }
      `}</style>

      {isLoading && (
        <div className="progress-bar">
          <Progress value={progress} className="w-full h-full" />
        </div>
      )}

      <Header
        backendStatus={backendStatus}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        hasResults={hasResults}
        onNewScan={handleNewScan}
        onExport={handleExport}
        onOpenSettings={handleOpenSettings}
      />

      {summaryData && (
        <SummaryStrip
          riskScore={summaryData.riskScore}
          riskLevel={summaryData.riskLevel}
          findings={summaryData.findings}
          scanTime={summaryData.scanTime}
          engine={summaryData.engine}
          rulesExecuted={summaryData.rulesExecuted}
          semgrepVersion={summaryData.semgrepVersion}
        />
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!hasResults && !isLoading && <ScannerInterface onScan={handleScan} isLoading={isLoading} />}
        
        {isLoading && !hasResults && (
          <div className="text-center py-12">
            <div className="text-lg font-medium text-foreground mb-2">Scanning in progress...</div>
            <div className="text-sm text-muted-foreground">Analyzing your code for security vulnerabilities</div>
          </div>
        )}

        {error && (
          <div className="bg-destructive/10 text-destructive rounded-lg p-4 flex items-center gap-3 mb-8">
            <AlertCircle className="w-5 h-5" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        {hasResults && (
          <FindingsTable 
            findings={scanResult.findings || []} 
            onFindingClick={handleFindingClick}
          />
        )}
      </main>

      {/* Side Drawer for Finding Details */}
      <FindingDrawer
        finding={selectedFinding}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        findings={scanResult?.findings || []}
        riskAssessment={scanResult?.riskAssessment || {}}
      />

      {/* Risk Settings */}
      <RiskSettingsDrawer>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleOpenSettings}
          style={{ display: 'none' }} // Hidden since we'll trigger it programmatically
        >
          <Settings className="w-4 h-4 mr-2" />
          Risk Settings
        </Button>
      </RiskSettingsDrawer>

      <footer className="bg-white border-t border-border mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
          <p className="text-sm text-muted-foreground">© 2025 Neperia. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}