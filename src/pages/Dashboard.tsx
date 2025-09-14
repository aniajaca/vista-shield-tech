import React, { useState, useEffect } from "react";
import { ScanResult } from "@/entities/ScanResult";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import ScannerInterface from "../components/clean-scanner/ScannerInterface";
import RiskOverviewCard from "../components/clean-scanner/RiskOverviewCard";
import FindingsCard from "../components/clean-scanner/FindingsCard";
import ExportSection from "../components/clean-scanner/ExportSection";
import { RiskSettingsDrawer } from "@/components/RiskSettingsDrawer";
import { useRiskSettings } from "@/hooks/useRiskSettings";
import { AlertCircle, Settings } from "lucide-react";
import { scanCode, testConnection, getHealthStatus } from "@/lib/api";

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

    // Read file content as text
    const code = await file.text();
    console.log('📖 File content read, length:', code.length);
    console.log('📝 First 100 chars:', code.substring(0, 100));
    
    const language = inferLanguageFromFilename(file.name);
    console.log('🚀 About to call scanCode API with:', { language, filename: file.name });
    
    const data = await scanCode(code, language, riskConfig, context, file.name);
    console.log('✅ scanCode API returned:', data);

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
  const [backendStatus, setBackendStatus] = useState('checking');
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
      setTimeout(() => setIsLoading(false), 500);
    }
  };
  const hasResults = scanResult && !isLoading;
  return <div className="text-[#374151]">
            <style>{`
                @import url('https://rsms.me/inter/inter.css');
                html { font-family: 'Inter', sans-serif; }
                .tabular-nums { font-variant-numeric: tabular-nums; }
                .progress-bar {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 2px;
                    z-index: 9999;
                    background-color: transparent;
                    transition: opacity 0.3s ease;
                }
                .progress-bar > div {
                    background-color: #AFCB0E;
                }
            `}</style>

            {isLoading && <div className="progress-bar">
                    <Progress value={progress} className="w-full h-full" />
                </div>}
            
            <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-12 py-12">
            
                <div className="flex items-center justify-between mb-12">
                    <div className="flex items-baseline gap-2">
                        <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/fc56c3a44_image.png" alt="Neperia Logo" className="h-5 w-5 grayscale opacity-30" />
                        <h1 className="text-lg font-semibold text-[#374151]">NEPERIA</h1>
                        <span className="text-sm text-[#9CA3AF]">Code Scanner
          </span>
                            <div className={`ml-4 px-2 py-1 rounded-full text-xs font-medium ${backendStatus === 'online' ? 'bg-green-100 text-green-700' : backendStatus === 'offline' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                {backendStatus === 'online' ? '● Backend Online' : backendStatus === 'offline' ? '● Backend Offline' : '● Checking...'}
                            </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <RiskSettingsDrawer>
                            <Button variant="outline" size="sm">
                                <Settings className="w-4 h-4 mr-2" />
                                Risk Settings
                            </Button>
                        </RiskSettingsDrawer>
                        {hasResults && <Button onClick={() => setScanResult(null)} variant="ghost" className="text-sm font-medium text-[#6B7280] hover:text-[#AFCB0E] hover:bg-[#F9FAFB] transition-colors duration-150">
                                Scan another file
                            </Button>}
                    </div>
                </div>

                <main className="space-y-8">
                    {!hasResults && <ScannerInterface onScan={handleScan} isLoading={isLoading} />}

                    {error && <div className="bg-red-50 text-red-700 rounded-lg p-4 flex items-center gap-3">
                            <AlertCircle className="w-5 h-5" />
                            <p className="font-medium">{error}</p>
                        </div>}

                    {hasResults && <div className="space-y-8">
                            <RiskOverviewCard 
                                riskAssessment={{
                                    riskScore: scanResult.score?.final,
                                    riskLevel: scanResult.risk?.level,
                                    findingsBreakdown: scanResult.riskAssessment?.findingsBreakdown || scanResult.stats
                                }} 
                                performance={scanResult.performance} 
                                metadata={scanResult.metadata} 
                            />
                            <FindingsCard findings={scanResult.findings || []} />
                            <ExportSection findings={scanResult.findings || []} riskAssessment={scanResult.riskAssessment || {}} />
                        </div>}
                 </main>

                 <footer className="text-center mt-16">
                   <p className="text-sm text-[#9CA3AF]">© 2025 Neperia. All rights reserved.</p>
                 </footer>
             </div>
        </div>;
}