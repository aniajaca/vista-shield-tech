import React, { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import DependenciesScannerInterface from "../components/dependencies/DependenciesScannerInterface";
import DependenciesRiskOverviewCard from "../components/dependencies/DependenciesRiskOverviewCard";
import DependenciesFindingsCard from "../components/dependencies/DependenciesFindingsCard";
import DependenciesExportSection from "../components/dependencies/DependenciesExportSection";
import { AlertCircle } from "lucide-react";
import { runConnectionTest } from "@/utils/testConnection";

const API_BASE_URL = 'https://semgrep-backend-production.up.railway.app';

async function scanDependencies(packageJsonContent: string, packageLockContent?: string) {
  try {
    console.log('📦 Scanning dependencies...');
    
    // Parse JSON strings into objects as expected by backend
    let packageJsonObj;
    let packageLockObj = null;
    
    try {
      packageJsonObj = JSON.parse(packageJsonContent);
    } catch (error) {
      throw new Error('Invalid package.json format: ' + error.message);
    }
    
    if (packageLockContent) {
      try {
        packageLockObj = JSON.parse(packageLockContent);
      } catch (error) {
        throw new Error('Invalid package-lock.json format: ' + error.message);
      }
    }
    
    // Debug before sending to backend
    console.log('➡️ About to send packageJson:', packageJsonObj);
    console.log('➡️ Dependencies:', packageJsonObj?.dependencies);
    console.log('➡️ DevDependencies:', packageJsonObj?.devDependencies);
    try {
      const sampleDeps = Object.entries(packageJsonObj?.dependencies || {}).slice(0, 3);
      console.log('➡️ Dependencies sample:', sampleDeps);
    } catch (e) {
      console.warn('⚠️ Could not iterate dependencies:', e);
    }
    const response = await fetch(`${API_BASE_URL}/scan-dependencies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      mode: 'cors',
      body: JSON.stringify({
        packageJson: packageJsonObj,
        packageLockJson: packageLockObj
      })
    });

    console.log('📨 Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Dependencies scan successful:', data);
    
    return {
      success: true,
      data: data
    };
  } catch (error) {
    console.error('❌ Dependencies scan failed:', error);
    
    return {
      success: false,
      error: error.message || 'Dependencies scanning failed',
      details: {
        originalError: error.message,
        timestamp: new Date().toISOString()
      }
    };
  }
}

export default function Dependencies() {
    const [isLoading, setIsLoading] = useState(false);
    const [scanResult, setScanResult] = useState(null);
    const [error, setError] = useState(null);
    const [progress, setProgress] = useState(0);
    const [backendStatus, setBackendStatus] = useState('checking');

    // Test backend connection on component mount
    useEffect(() => {
        const testBackend = async () => {
            console.log('🔍 Testing backend connection...');
            const isConnected = await runConnectionTest();
            setBackendStatus(isConnected ? 'connected' : 'disconnected');
        };
        
        testBackend();
    }, []);

    const handleScan = async (options: { packageJson: string; packageLock?: string }) => {
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
            if (!options.packageJson) {
                throw new Error("No package.json content provided for scanning.");
            }

            console.log('🔍 Starting dependencies scan');
            
            const resp = await scanDependencies(options.packageJson, options.packageLock);

            if (resp.success) {
                console.log('📊 Setting dependencies scan result (raw):', resp.data);
                setScanResult(resp.data);
            } else {
                throw new Error(resp.error);
            }

        } catch (err) {
            console.error('🚨 Dependencies scan process failed:', err);
            setError(`Failed to complete dependencies scan: ${err.message}`);
        } finally {
            clearInterval(progressInterval);
            setProgress(100);
            setTimeout(() => setIsLoading(false), 500);
        }
    };

    const hasResults = scanResult && !isLoading;

    return (
        <div className="text-[#374151]">
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

            {isLoading && (
                <div className="progress-bar">
                    <Progress value={progress} className="w-full h-full" />
                </div>
            )}
            
            <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-12 py-12">
                <div className="flex items-center justify-between mb-12">
                    <div className="flex items-baseline gap-2">
                        <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/fc56c3a44_image.png" alt="Neperia Logo" className="h-5 w-5 grayscale opacity-30" />
                        <h1 className="text-lg font-semibold text-[#374151]">NEPERIA</h1>
                        <span className="text-sm text-[#9CA3AF]">Dependencies Scanner</span>
                        <div className={`ml-4 px-2 py-1 rounded-full text-xs font-medium ${
                            backendStatus === 'connected' ? 'bg-green-100 text-green-700' :
                            backendStatus === 'disconnected' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                        }`}>
                            {backendStatus === 'connected' ? '● Backend Online' : 
                             backendStatus === 'disconnected' ? '● Backend Offline' : 
                             '● Checking...'}
                        </div>
                    </div>
                     {hasResults && (
                        <Button 
                            onClick={() => setScanResult(null)}
                            variant="ghost"
                            className="text-sm font-medium text-[#6B7280] hover:text-[#AFCB0E] hover:bg-[#F9FAFB] transition-colors duration-150">
                            Scan other dependencies
                        </Button>
                     )}
                </div>

                <main className="space-y-8">
                    {!hasResults && (
                        <DependenciesScannerInterface onScan={handleScan} isLoading={isLoading} />
                    )}

                    {error && (
                        <div className="bg-red-50 text-red-700 rounded-lg p-4 flex items-center gap-3">
                            <AlertCircle className="w-5 h-5" />
                            <p className="font-medium">{error}</p>
                        </div>
                    )}

                    {hasResults && (
                        <div className="space-y-8">
                            <DependenciesRiskOverviewCard
                                riskAssessment={{
                                    riskScore: scanResult.risk_score || 0,
                                    riskLevel: scanResult.risk_level || 'Low',
                                    findingsBreakdown: scanResult.stats || {}
                                }}
                                performance={{
                                    scanTime: scanResult.scan_time,
                                    packagesScanned: scanResult.packages_scanned,
                                    dataSources: scanResult.data_sources,
                                    rulesExecuted: scanResult.rules_applied
                                }}
                            />
                            <DependenciesFindingsCard
                                vulnerabilities={scanResult.vulnerabilities || []}
                            />
                            <DependenciesExportSection 
                                vulnerabilities={scanResult.vulnerabilities || []}
                                riskAssessment={{
                                    riskScore: scanResult.risk_score || 0,
                                    riskLevel: scanResult.risk_level || 'Low'
                                }}
                                performance={{
                                    scanTime: scanResult.scan_time,
                                    packagesScanned: scanResult.packages_scanned,
                                    dataSources: scanResult.data_sources
                                }}
                            />
                        </div>
                    )}
                </main>

                <footer className="text-center mt-16">
                  <p className="text-sm text-[#9CA3AF]">© 2025 Neperia. All rights reserved.</p>
                </footer>
            </div>
        </div>
    );
}