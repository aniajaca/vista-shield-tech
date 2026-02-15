import React, { useState, useEffect } from "react";

import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import ScannerInterface from "../components/clean-scanner/ScannerInterface";
import RiskOverviewCard from "../components/clean-scanner/RiskOverviewCard";
import FindingsCard from "../components/clean-scanner/FindingsCard";
import ExportSection from "../components/clean-scanner/ExportSection";
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
    const language = inferLanguageFromFilename(file.name);
    const data = await scanFileUpload(file, language, riskConfig, context);
    return { success: true, data };
  } catch (error) {
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
      try {
        const isHealthy = await testConnection();
        await getHealthStatus();
        setBackendStatus(isHealthy ? 'online' : 'offline');
      } catch {
        setBackendStatus('offline');
      }
    };
    testBackend();
  }, []);
  const handleScan = async options => {
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

      const riskConfig = getRiskConfig();
      const context = getRiskContext();
      const response = await scanFile(options.file, riskConfig, context);
      if (response.success) {
        setScanResult(response.data);
      } else {
        throw new Error(response.error);
      }
    } catch (err) {
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
                        <img src="/neperia-logo.png" alt="Neperia Logo" className="h-5 w-5 grayscale opacity-30" />
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
                            <ExportSection 
                                findings={scanResult.findings || []} 
                                riskAssessment={scanResult.riskAssessment || {}} 
                                performance={scanResult.performance}
                                metadata={scanResult.metadata}
                            />
                        </div>}
                 </main>

                 <footer className="text-center mt-16">
                   <p className="text-sm text-[#9CA3AF]">© 2025 Neperia. All rights reserved.</p>
                 </footer>
             </div>
        </div>;
}