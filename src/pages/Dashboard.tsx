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
import { runConnectionTest } from "@/utils/testConnection";
import ErrorBoundary from "@/components/ErrorBoundary";

const API_BASE_URL = 'https://semgrep-backend-production.up.railway.app';

/**
 * Scan uploaded file using the API function
 */
async function scanFileForDashboard(file, riskConfig = null, context = null) {
  try {
    console.log('📄 Starting file scan:', { name: file.name, size: file.size });
    
    // Import the API function
    const { scanFile } = await import('@/lib/api');
    
    // Call the updated API function
    const response = await scanFile(file, riskConfig, context);
    
    console.log('✅ Scan successful, received data:', response);
    
    return {
      success: true,
      data: response
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
    const { getRiskConfig, getRiskContext } = useRiskSettings();

    // Test backend connection on component mount
    useEffect(() => {
        const testBackend = async () => {
            console.log('🔍 Testing backend connection...');
            const isConnected = await runConnectionTest();
            setBackendStatus(isConnected ? 'connected' : 'disconnected');
        };
        
        testBackend();
    }, []);

    const handleScan = async (options) => {
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
            
            // Get current risk settings
            const riskConfig = getRiskConfig();
            const context = getRiskContext();
            
            console.log('🎯 Using risk config:', riskConfig);
            console.log('🌍 Using context:', context);
            
            const response = await scanFileForDashboard(options.file, riskConfig, context);

            if (response.success) {
                console.log('📊 Setting scan result:', response.data);
                
                // Debug: Log the full response structure
                console.log('🔍 Full API response structure:', {
                    score: response.data.score,
                    risk: response.data.risk,
                    riskAssessment: response.data.riskAssessment,
                    findings: response.data.findings?.length || 0,
                    performance: response.data.performance
                });
                
                // Debug: Log findings data structure for verification
                if (response.data.findings && response.data.findings.length > 0) {
                    console.log('🔍 First finding structure:', response.data.findings[0]);
                    console.log('🔍 Findings sample keys:', Object.keys(response.data.findings[0]));
                }
                
                setScanResult(response.data);
                
                // Save to database
                await ScanResult.create({
                    ...response.data,
                    fileName: options.file.name,
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
                        <span className="text-sm text-[#9CA3AF]">Code Guardian</span>
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
                    <div className="flex items-center gap-2">
                        <RiskSettingsDrawer>
                            <Button variant="outline" size="sm">
                                <Settings className="w-4 h-4 mr-2" />
                                Risk Settings
                            </Button>
                        </RiskSettingsDrawer>
                        {hasResults && (
                            <Button 
                                onClick={() => setScanResult(null)}
                                variant="ghost"
                                className="text-sm font-medium text-[#6B7280] hover:text-[#AFCB0E] hover:bg-[#F9FAFB] transition-colors duration-150">
                                Scan another file
                            </Button>
                        )}
                    </div>
                </div>

                <main className="space-y-8">
                    {!hasResults && (
                        <ScannerInterface onScan={handleScan} isLoading={isLoading} />
                    )}

                    {error && (
                        <div className="bg-red-50 text-red-700 rounded-lg p-4 flex items-center gap-3">
                            <AlertCircle className="w-5 h-5" />
                            <p className="font-medium">{error}</p>
                        </div>
                    )}

                    {hasResults && (
                        <ErrorBoundary>
                            <div className="space-y-8">
                                <ErrorBoundary>
                                    <RiskOverviewCard
                                        riskAssessment={{
                                            riskScore: scanResult.score?.final || scanResult.riskAssessment?.riskScore,
                                            riskLevel: scanResult.risk?.level || scanResult.riskAssessment?.riskLevel,
                                            findingsBreakdown: scanResult.riskAssessment?.severityDistribution || scanResult.riskAssessment?.findingsBreakdown,
                                            
                                            // File-level adjustments
                                            normalizedScore: scanResult.score?.normalized || scanResult.riskAssessment?.normalizedScore,
                                            finalScore: scanResult.score?.final || scanResult.riskAssessment?.finalScore || scanResult.riskAssessment?.riskScore,
                                            multiplier: scanResult.fileScore?.multiplier || scanResult.riskAssessment?.multiplier,
                                            priority: scanResult.risk?.priority?.level || scanResult.riskAssessment?.priority,
                                            confidence: scanResult.riskAssessment?.confidence,
                                            
                                            // Applied factors from file or context
                                            appliedFactors: scanResult.appliedFactors || scanResult.riskAssessment?.appliedFactors || 
                                                (scanResult.context?.factors ? Object.entries(scanResult.context.factors)
                                                    .filter(([_, config]: any) => config.enabled)
                                                    .map(([name, config]: any) => ({
                                                        name,
                                                        value: config.weight || config.value || 1,
                                                        type: config.weight ? 'multiplier' : 'additive',
                                                        description: config.description
                                                    })) : [])
                                        }}
                                        performance={scanResult.performance}
                                    />
                                </ErrorBoundary>
                                <ErrorBoundary>
                                    <FindingsCard
                                        findings={scanResult.findings || []}
                                    />
                                </ErrorBoundary>
                                <ErrorBoundary>
                                    <ExportSection 
                                        findings={scanResult.findings || []}
                                        riskAssessment={scanResult.riskAssessment || {}}
                                    />
                                </ErrorBoundary>
                            </div>
                        </ErrorBoundary>
                    )}
                 </main>

                 <footer className="text-center mt-16">
                   <p className="text-sm text-[#9CA3AF]">© 2025 Neperia. All rights reserved.</p>
                 </footer>
             </div>
        </div>
    );
}