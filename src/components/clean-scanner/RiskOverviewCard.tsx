import React from 'react';

interface RiskAssessment {
    riskScore?: number;
    riskLevel?: string;
    findingsBreakdown?: Record<string, number>;
}

interface Performance {
    scanTime?: number;
}

interface RiskOverviewCardProps {
    riskAssessment?: RiskAssessment;
    metadata?: any;
    performance?: Performance;
    findings?: any[];
}

const RiskScoreIndicator = ({ score = 0, level = 'None' }) => (
    <div className="text-center">
        <p className="text-[72px] font-semibold tracking-[-0.04em] text-[#374151] tabular-nums">
            {score.toFixed(0)}
        </p>
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

// Fix 4: Priority band pill
const PriorityPill = ({ priority, count }) => {
    const styles = {
        'P0': 'bg-red-100 text-red-700',
        'P1': 'bg-orange-100 text-orange-700',
        'P2': 'bg-yellow-100 text-yellow-700',
        'P3': 'bg-blue-100 text-blue-600',
    };
    
    return (
        <div className={`flex items-center justify-between text-sm rounded-full ${styles[priority] || 'bg-gray-100 text-gray-600'}`}>
            <span className="px-3 py-1 font-medium text-xs">{priority}</span>
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

export default function RiskOverviewCard({ riskAssessment = {}, metadata, performance = {}, findings = [] }: RiskOverviewCardProps) {
    const { riskScore, findingsBreakdown = {} } = riskAssessment;
    
    const finalScore = riskScore || metadata?.risk?.final || metadata?.score?.final || 0;
    
    const severityOrder = ['Critical', 'High', 'Medium', 'Low'];
    const finalLevel = severityOrder.find(s => (findingsBreakdown[s] || 0) > 0) || 'Low';
    
    const totalVulns = Object.values(findingsBreakdown).reduce((a, b) => (typeof b === 'number' ? a + b : a), 0);
    
    // Fix 4: Compute priority band counts from findings
    const priorityCounts: Record<string, number> = {};
    findings.forEach(f => {
        const p = f.priority?.priority;
        if (p) {
            priorityCounts[p] = (priorityCounts[p] || 0) + 1;
        }
    });
    const priorityOrder = ['P0', 'P1', 'P2', 'P3'];
    const hasPriorities = Object.keys(priorityCounts).length > 0;
    
    const { scanTime } = performance;
    
    const engineRaw = metadata?.engine || metadata?.scanner || metadata?.tool;
    const engineStr = typeof engineRaw === 'string' ? engineRaw.toLowerCase() : (engineRaw?.name?.toLowerCase?.());
    const engineDisplay = engineStr?.includes('semgrep') ? 'Semgrep' : engineStr?.includes('ast') ? 'AST Scanner' : (engineRaw || 'Semgrep');
    const rawScanTime = metadata?.scan_time || (typeof scanTime === 'number' && scanTime > 0 ? `${scanTime.toFixed(2)}s` : null);
    const scanTimeDisplay = rawScanTime || '< 1s';
    
    return (
        <div className="glass-panel rounded-xl p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-center">
                <div className="md:col-span-1 flex items-center justify-center">
                    <RiskScoreIndicator score={finalScore} level={finalLevel} />
                </div>
                
                {/* Fix 4: Priority breakdown as primary */}
                {hasPriorities && (
                    <div className="md:col-span-1 space-y-4">
                        <h3 className="text-xs font-medium uppercase text-[#6B7280] tracking-wider">Priority Breakdown</h3>
                        <div className="flex flex-col gap-2">
                            {priorityOrder.map(p => (
                                (priorityCounts[p] || 0) > 0 && <PriorityPill key={p} priority={p} count={priorityCounts[p]} />
                            ))}
                        </div>
                    </div>
                )}
                
                <div className="md:col-span-1 space-y-4">
                     {totalVulns > 0 && (
                         <>
                             <h3 className="text-xs font-medium uppercase text-[#6B7280] tracking-wider">Severity Breakdown</h3>
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
                        value={scanTimeDisplay}
                    />
                    <Metric 
                        label="Engine Used" 
                        value={engineDisplay}
                    />
                    {/* Fix 3: Active profile indicator */}
                    <Metric 
                        label="Risk Profile" 
                        value={
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#F3F4F6] text-[#374151]">
                                Default
                            </span>
                        }
                    />
                </div>
            </div>
        </div>
    );
}
