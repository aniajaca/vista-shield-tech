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
        <p className="text-[64px] font-semibold tracking-[-0.04em] text-foreground tabular-nums leading-none">
            {score.toFixed(0)}
        </p>
        <p className="text-xs font-medium text-muted-foreground mt-1.5">{level} Risk</p>
    </div>
);

const SeverityPill = ({ severity, count }: { severity: string; count: number }) => {
    const s = severity?.toLowerCase();
    const styles: Record<string, string> = {
        critical: 'bg-[hsl(var(--critical)/0.12)] text-[hsl(var(--critical))]',
        high: 'bg-[hsl(var(--high)/0.12)] text-[hsl(var(--high))]',
        medium: 'bg-[hsl(var(--medium)/0.15)] text-[hsl(43,74%,46%)]',
        low: 'bg-[hsl(var(--low)/0.12)] text-[hsl(var(--low))]',
    };
    return (
        <div className={`flex items-center justify-between text-xs rounded-full ${styles[s] || 'bg-muted text-muted-foreground'}`}>
            <span className="px-2.5 py-0.5 font-medium">{severity}</span>
            <span className="tabular-nums font-semibold pr-2.5">{count}</span>
        </div>
    );
};

const PriorityPill = ({ priority, count }: { priority: string; count: number }) => {
    const styles: Record<string, string> = {
        'P0': 'bg-[hsl(var(--critical)/0.12)] text-[hsl(var(--critical))]',
        'P1': 'bg-[hsl(var(--high)/0.12)] text-[hsl(var(--high))]',
        'P2': 'bg-[hsl(var(--medium)/0.15)] text-[hsl(43,74%,46%)]',
        'P3': 'bg-[hsl(var(--info)/0.12)] text-[hsl(var(--info))]',
    };
    return (
        <div className={`flex items-center justify-between text-xs rounded-full ${styles[priority] || 'bg-muted text-muted-foreground'}`}>
            <span className="px-2.5 py-0.5 font-medium">{priority}</span>
            <span className="tabular-nums font-semibold pr-2.5">{count}</span>
        </div>
    );
};

// Normalize severity using adjustedSeverity with fallback
function normSev(f: any): string {
    const raw = f?.adjustedSeverity || f?.severity || 'Low';
    const s = String(raw).toLowerCase();
    if (['critical', 'crit', 'error', 'severe'].includes(s)) return 'Critical';
    if (['high', 'major'].includes(s)) return 'High';
    if (['medium', 'moderate', 'warn', 'warning'].includes(s)) return 'Medium';
    return 'Low';
}

export default function RiskOverviewCard({ riskAssessment = {}, metadata, performance = {}, findings = [] }: RiskOverviewCardProps) {
    const finalScore = riskAssessment.riskScore || metadata?.risk?.final || metadata?.score?.final || 0;

    // Compute severity breakdown from findings using adjustedSeverity
    const sevCounts: Record<string, number> = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    findings.forEach(f => { sevCounts[normSev(f)]++; });
    const totalVulns = findings.length;

    const severityOrder = ['Critical', 'High', 'Medium', 'Low'];
    const finalLevel = severityOrder.find(s => sevCounts[s] > 0) || 'Low';

    // Priority band counts
    const priorityCounts: Record<string, number> = {};
    findings.forEach(f => {
        const p = f.priority?.priority;
        if (p) priorityCounts[p] = (priorityCounts[p] || 0) + 1;
    });
    const priorityOrder = ['P0', 'P1', 'P2', 'P3'];
    const hasPriorities = Object.keys(priorityCounts).length > 0;

    const engineRaw = metadata?.engine || metadata?.scanner || metadata?.tool;
    const engineStr = typeof engineRaw === 'string' ? engineRaw.toLowerCase() : (engineRaw?.name?.toLowerCase?.());
    const engineDisplay = engineStr?.includes('semgrep') ? 'Semgrep' : engineStr?.includes('ast') ? 'AST Scanner' : (engineRaw || 'Semgrep');
    const rawScanTime = metadata?.scan_time || (typeof performance.scanTime === 'number' && performance.scanTime > 0 ? `${performance.scanTime.toFixed(2)}s` : null);
    const scanTimeDisplay = rawScanTime || '< 1s';

    // Context summary: count unique amplifiers & attenuators across all findings
    const ATTENUATING = ['hasAuthentication', 'testOrDevCode', 'internalNetwork', 'isProtected'];
    const allAmplifiers = new Set<string>();
    const allAttenuators = new Set<string>();
    findings.forEach(f => {
        const factors: string[] = f.inferredFactors || [];
        factors.forEach(factor => {
            if (ATTENUATING.includes(factor)) allAttenuators.add(factor);
            else allAmplifiers.add(factor);
        });
    });
    const hasContext = allAmplifiers.size > 0 || allAttenuators.size > 0;

    return (
        <div className="glass-panel rounded-xl p-5">
            <div className="flex items-center gap-6">
                {/* Risk Score */}
                <div className="flex-shrink-0 flex items-center justify-center w-24">
                    <RiskScoreIndicator score={finalScore} level={finalLevel} />
                </div>

                {/* Priority + Severity breakdowns side by side */}
                <div className="flex gap-6 flex-1 min-w-0">
                    {hasPriorities && (
                        <div className="space-y-1.5 min-w-[120px]">
                            <h3 className="text-[10px] font-medium uppercase text-muted-foreground tracking-wider">Priority</h3>
                            <div className="flex flex-col gap-1">
                                {priorityOrder.map(p => (
                                    (priorityCounts[p] || 0) > 0 && <PriorityPill key={p} priority={p} count={priorityCounts[p]} />
                                ))}
                            </div>
                        </div>
                    )}

                    {totalVulns > 0 && (
                        <div className="space-y-1.5 min-w-[120px]">
                            <h3 className="text-[10px] font-medium uppercase text-muted-foreground tracking-wider">Severity</h3>
                            <div className="flex flex-col gap-1">
                                {severityOrder.map(sev => (
                                    sevCounts[sev] > 0 && <SeverityPill key={sev} severity={sev} count={sevCounts[sev]} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Compact metrics row */}
                <div className="flex-shrink-0 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-muted text-muted-foreground">
                        ⏱ {scanTimeDisplay}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-muted text-muted-foreground">
                        ⚙ {engineDisplay}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-muted text-muted-foreground">
                        Profile: Default
                    </span>
                    {hasContext && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-muted text-muted-foreground">
                            Context: {allAmplifiers.size} amplifier{allAmplifiers.size !== 1 ? 's' : ''}, {allAttenuators.size} attenuator{allAttenuators.size !== 1 ? 's' : ''}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
