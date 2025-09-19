import React from 'react';

interface RiskAssessment {
    riskScore?: number;
    riskLevel?: string;
    findingsBreakdown?: Record<string, number>;
}

interface Performance {
    scanTime?: number;
    packagesScanned?: number;
    dataSources?: string[];
}

interface DependenciesRiskOverviewCardProps {
    riskAssessment?: RiskAssessment;
    performance?: Performance;
}

const RiskScoreIndicator = ({ score = 0, level = 'None' }) => (
    <div className="text-center">
        <p className="text-[72px] font-semibold tracking-[-0.04em] text-[#374151] tabular-nums">
            {score.toFixed(0)}
        </p>
        <p className="text-sm font-medium text-[#6B7280] mt-2">{level} Dependency Risk</p>
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

export default function DependenciesRiskOverviewCard({ riskAssessment = {}, performance = {} }: DependenciesRiskOverviewCardProps) {
    const { riskScore, riskLevel, findingsBreakdown = {} } = riskAssessment;
    const totalVulns = Object.values(findingsBreakdown).reduce((a, b) => (typeof b === 'number' ? a + b : a), 0);
    
    const { scanTime, packagesScanned, dataSources = [] } = performance;
    
    return (
        <div className="bg-white p-6 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                <div className="md:col-span-1 flex items-center justify-center">
                    <RiskScoreIndicator score={riskScore} level={riskLevel} />
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
                
                <div className="md:col-span-1 space-y-2">
                    <h3 className="text-xs font-medium uppercase text-[#6B7280] tracking-wider mb-2">Analysis Metrics</h3>
                    <Metric 
                        label="Scan Time" 
                        value={typeof scanTime === 'number' ? `${scanTime.toFixed(2)}s` : 'N/A'}
                    />
                    <Metric 
                        label="Packages Scanned" 
                        value={packagesScanned || 'N/A'}
                    />
                    <Metric 
                        label="Data Sources" 
                        value={dataSources.length > 0 ? dataSources.join(', ') : 'N/A'}
                    />
                </div>
            </div>
        </div>
    );
}