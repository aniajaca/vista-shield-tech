import React from 'react';

interface RiskAssessment {
    riskScore?: number;
    riskLevel?: string;
    findingsBreakdown?: Record<string, number>;
    normalizedScore?: number;
    finalScore?: number;
    multiplier?: number;
    priority?: string;
    confidence?: number;
    appliedFactors?: Array<{
        name: string;
        value: number;
        type: 'multiplier' | 'additive';
        description?: string;
    }>;
}

interface Performance {
    scanTime?: number;
    rulesExecuted?: number;
}

interface RiskOverviewCardProps {
    riskAssessment?: RiskAssessment;
    metadata?: any;
    performance?: Performance;
}

const RiskScoreIndicator = ({ normalizedScore, finalScore, level = 'None', multiplier }) => (
    <div className="text-center">
        {normalizedScore !== undefined && finalScore !== undefined ? (
            <div>
                <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="text-sm text-[#6B7280]">Normalized:</span>
                    <span className="text-2xl font-semibold text-[#374151] tabular-nums">{normalizedScore.toFixed(0)}</span>
                </div>
                {multiplier && multiplier !== 1 && (
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <span className="text-xs text-[#9CA3AF]">×{multiplier.toFixed(1)}</span>
                    </div>
                )}
                <div className="flex items-center justify-center gap-2">
                    <span className="text-sm text-[#6B7280]">Final:</span>
                    <span className="text-[48px] font-semibold tracking-[-0.04em] text-[#374151] tabular-nums">{finalScore.toFixed(0)}</span>
                </div>
            </div>
        ) : (
            <p className="text-[72px] font-semibold tracking-[-0.04em] text-[#374151] tabular-nums">
                {(finalScore || normalizedScore || 0).toFixed(0)}
            </p>
        )}
        <p className="text-sm font-medium text-[#6B7280] mt-2">{level} Risk</p>
    </div>
);

const SeverityPill = ({ severity, count }) => {
    const s = severity?.toLowerCase();
    const styles = {
        critical: 'bg-[#FEE2E2] text-[#DC2626]',
        high: 'bg-[#FED7AA] text-[#EA580C]', 
        medium: 'bg-[#FEF3C7] text-[#D97706]',
        low: 'bg-[#DBEAFE] text-[#2563EB]',
    };
    
    return (
        <div className={`flex items-center justify-between text-sm rounded-full ${styles[s] || 'bg-gray-100 text-gray-600'}`}>
            <span className="px-3 py-1 font-medium text-xs">{severity}</span>
            <span className="tabular-nums font-semibold pr-3">{count}</span>
        </div>
    );
};

const Metric = ({ label, value }) => (
    <div className="flex justify-between items-baseline py-2">
        <span className="text-sm text-[#6B7280]">{label}</span>
        <span className="text-sm font-medium text-[#374151] tabular-nums">{value}</span>
    </div>
);

export default function RiskOverviewCard({ riskAssessment = {}, performance = {} }: RiskOverviewCardProps) {
    const { 
        riskScore, riskLevel, findingsBreakdown = {}, 
        normalizedScore, finalScore, multiplier, priority, confidence, appliedFactors = []
    } = riskAssessment;
    const totalVulns = Object.values(findingsBreakdown).reduce((a, b) => (typeof b === 'number' ? a + b : a), 0);
    
    const { scanTime, rulesExecuted } = performance;
    
    return (
        <div className="bg-white p-6 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                <div className="md:col-span-1 flex items-center justify-center">
                    <RiskScoreIndicator 
                        normalizedScore={normalizedScore} 
                        finalScore={finalScore || riskScore} 
                        level={riskLevel}
                        multiplier={multiplier}
                    />
                </div>
                
                <div className="md:col-span-1 space-y-4">
                     {totalVulns > 0 && (
                         <>
                             <h3 className="text-xs font-medium uppercase text-[#6B7280] tracking-wider">Vulnerability Breakdown</h3>
                             <div className="flex flex-col gap-2">
                                 {Object.entries(findingsBreakdown).map(([sev, count]) => (
                                    count > 0 && <SeverityPill key={sev} severity={sev} count={count} />
                                 ))}
                             </div>
                         </>
                     )}
                </div>
                
                <div className="md:col-span-1 space-y-4">
                    {/* Applied Risk Factors */}
                    {appliedFactors.length > 0 && (
                        <div>
                            <h3 className="text-xs font-medium uppercase text-[#6B7280] tracking-wider mb-2">Risk Factors Applied</h3>
                            <div className="flex flex-wrap gap-1">
                                {appliedFactors.map((factor, index) => (
                                    <div key={index} className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-md">
                                        {factor.name} {factor.type === 'multiplier' ? `×${factor.value.toFixed(1)}` : `+${factor.value.toFixed(1)}`}
                                    </div>
                                ))}
                            </div>
                            {normalizedScore && finalScore && (
                                <p className="text-xs text-[#6B7280] mt-2">
                                    Normalized score × file-level multipliers = final
                                </p>
                            )}
                        </div>
                    )}
                    
                    {/* Analysis Metrics */}
                    <div>
                        <h3 className="text-xs font-medium uppercase text-[#6B7280] tracking-wider mb-2">Analysis Metrics</h3>
                        <div className="space-y-1">
                            <Metric 
                                label="Scan Time" 
                                value={typeof scanTime === 'number' ? `${scanTime.toFixed(2)}s` : 'N/A'}
                            />
                            <Metric 
                                label="Rules Applied" 
                                value={rulesExecuted || 'N/A'}
                            />
                            {priority && (
                                <Metric label="Priority" value={priority} />
                            )}
                            {confidence && (
                                <Metric label="Confidence" value={`${(confidence * 100).toFixed(0)}%`} />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}