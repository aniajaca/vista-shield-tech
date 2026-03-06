import React, { useState } from 'react';
import { ChevronDown, MapPin, Lightbulb, Tag, Layers, Shield, Wrench } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const toText = (val: any): string => {
  if (val == null) return '';
  const t = typeof val;
  if (t === 'string' || t === 'number' || t === 'boolean') return String(val);
  if (Array.isArray(val)) return val.map(toText).filter(Boolean).join('; ');
  if (t === 'object') {
    const preferred = ['description', 'text', 'guidance', 'strategy', 'fix', 'recommendation', 'message', 'summary', 'details', 'explanation', 'reason'];
    for (const k of preferred) {
      if (k in val && (val as any)[k] != null) return toText((val as any)[k]);
    }
    const parts = Object.values(val).map(toText).filter(Boolean);
    if (parts.length) return parts.join(' ');
    try { return JSON.stringify(val); } catch { return ''; }
  }
  return '';
};

const SeverityPill = ({ severity, adjustedSeverity, rawSeverity }: { severity: string; adjustedSeverity?: string; rawSeverity?: string }) => {
    const displaySev = adjustedSeverity || severity || 'Medium';
    const s = displaySev.toLowerCase();
    const styles: Record<string, string> = {
        critical: 'bg-[hsl(var(--critical)/0.12)] text-[hsl(var(--critical))]',
        high: 'bg-[hsl(var(--high)/0.12)] text-[hsl(var(--high))]',
        medium: 'bg-[hsl(var(--medium)/0.15)] text-[hsl(43,74%,46%)]',
        low: 'bg-[hsl(var(--low)/0.12)] text-[hsl(var(--low))]',
        info: 'bg-muted text-muted-foreground'
    };
    const displayLabel = displaySev.charAt(0).toUpperCase() + displaySev.slice(1).toLowerCase();
    const rawNorm = (rawSeverity || severity || '').toLowerCase();
    const showWas = adjustedSeverity && rawNorm && rawNorm !== s;
    
    return (
        <div className="flex items-center gap-1.5">
            <div className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${styles[s] || styles.info}`}>
                {displayLabel}
            </div>
            {showWas && (
                <span className="text-[10px] text-muted-foreground italic">
                    was: {rawSeverity?.charAt(0).toUpperCase()}{rawSeverity?.slice(1).toLowerCase()}
                </span>
            )}
        </div>
    );
};

interface FindingGroup {
    primary: any;
    occurrences: any[];
    count: number;
}

function groupFindingsByRuleId(findings: any[]): FindingGroup[] {
    const groups: Record<string, FindingGroup> = {};
    const order: string[] = [];
    for (const f of findings) {
        const key = f.ruleId && f.file ? `${f.ruleId}::${f.file}` : `__unique_${Math.random()}`;
        if (!groups[key]) {
            groups[key] = { primary: f, occurrences: [f], count: 1 };
            order.push(key);
        } else {
            groups[key].occurrences.push(f);
            groups[key].count++;
        }
    }
    return order.map(k => groups[k]);
}

const PriorityBadge = ({ priority }: { priority: string }) => {
    const styles: Record<string, string> = {
        'P0': 'bg-[hsl(var(--critical)/0.12)] text-[hsl(var(--critical))] font-bold',
        'P1': 'bg-[hsl(var(--high)/0.12)] text-[hsl(var(--high))] font-bold',
        'P2': 'bg-[hsl(var(--medium)/0.15)] text-[hsl(43,74%,46%)] font-bold',
        'P3': 'bg-[hsl(var(--info)/0.12)] text-[hsl(var(--info))] font-bold',
    };
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] ${styles[priority] || 'bg-muted text-muted-foreground'}`}>
            {priority}
        </span>
    );
};

// Tab button component
const TabBtn = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            active ? 'bg-white/70 text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-white/30'
        }`}
    >
        {children}
    </button>
);

const FindingItem = ({ group, isEven }: { group: FindingGroup; isEven: boolean }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'details' | 'risk' | 'remediation'>('details');
    const [showOccurrences, setShowOccurrences] = useState(false);
    const finding = group.primary;
    
    const {
        title: rawTitle, name, check_id, message,
        severity = 'Medium',
        cwe, owasp,
        description: rawDesc,
        remediation: rawRemediation,
        location: rawLocation, start,
        code, extractedCode, codeSnippet, snippet, extra,
        file, startLine, line,
        adjustedSeverity,
        bts, crs, priority: findingPriority,
        context, contextEvidence, inferredFactors, appliedFactors,
        confidence, impact, likelihood, ruleId
    } = finding;

    const rawTitleStr = toText(rawTitle || name || check_id || message) || "Security Vulnerability";
    const title = rawTitleStr
        .replace(/^(javascript|python|java|go|ruby|php|csharp|typescript|express|flask|django|lang|security|audit)\./gi, '')
        .replace(/\./g, ' ').replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).replace(/\s+/g, ' ').trim();
    
    const description = toText(cwe?.description ?? rawDesc ?? message) || 'Security vulnerability detected';
    const truncatedDesc = description.length > 100 ? description.slice(0, 100) + '…' : description;

    let remediationApproach = '';
    let remediationValidation = '';
    let remediationRisk = '';
    let remediationCategory = '';
    let remediationPriority = '';
    let remediationImpact = '';
    
    if (rawRemediation) {
        if (typeof rawRemediation === 'object') {
            remediationValidation = toText(rawRemediation.validation) || '';
            remediationRisk = toText(rawRemediation.risk) || '';
            remediationCategory = rawRemediation.resources?.category || '';
            remediationPriority = toText(rawRemediation.priority) || '';
            remediationImpact = toText(rawRemediation.impact) || '';
        }
    }
    remediationApproach = toText(message) || '';
    if (!remediationApproach && rawRemediation) {
        remediationApproach = typeof rawRemediation === 'object' 
            ? toText(rawRemediation.approach || rawRemediation.description || rawRemediation) 
            : toText(rawRemediation);
    }
    if (!remediationApproach) remediationApproach = 'Review and apply security best practices';

    // Check if remediation is same as description to avoid duplication
    const remediationIsDuplicate = remediationApproach.trim() === description.trim();
    
    const location = rawLocation || start;
    const filePath = location?.path || location?.file || file || finding.file || "Code scan";
    const lineNumber = location?.line || location?.row || startLine || line || finding.startLine;
    const locationStr = lineNumber ? `${filePath}:${lineNumber}` : filePath;

    const vulnerableCode = toText(snippet || code || extractedCode || codeSnippet || extra?.lines) || '';

    const cweDisplayId = typeof cwe === 'string'
        ? (cwe.startsWith('CWE-') ? cwe : `CWE-${cwe}`)
        : cwe?.id ? (String(cwe.id).startsWith('CWE-') ? cwe.id : `CWE-${cwe.id}`) : null;
    const cweName = typeof cwe === 'object' ? cwe?.name : null;

    const owaspEntries: string[] = Array.isArray(owasp) ? [...owasp] : owasp ? [String(owasp)] : [];
    const sortedOwasp = owaspEntries.sort((a, b) => {
        const yearA = a.match(/:(\d{4})/)?.[1] || '0';
        const yearB = b.match(/:(\d{4})/)?.[1] || '0';
        return parseInt(yearB) - parseInt(yearA);
    });

    return (
        <div className={`rounded-lg transition-all duration-150 ${isOpen ? 'glass-card shadow-[0_4px_12px_rgba(0,0,0,0.06)]' : ''} ${isEven && !isOpen ? 'bg-white/20' : ''}`}>
            {/* Collapsed row — scannable single line */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full px-4 py-2.5 transition-colors duration-100 group ${!isOpen ? 'hover:bg-white/40' : ''}`}
            >
                <div className="flex items-center gap-3 w-full">
                    {/* Left: Priority badge (most prominent) */}
                    {findingPriority?.priority && (
                        <PriorityBadge priority={findingPriority.priority} />
                    )}
                    
                    {/* Severity pill */}
                    <SeverityPill severity={severity} adjustedSeverity={adjustedSeverity} rawSeverity={severity} />
                    
                    {/* CWE */}
                    {cweDisplayId && (
                        <span className="text-[10px] font-mono text-muted-foreground flex-shrink-0">{cweDisplayId}</span>
                    )}
                    
                    {/* Title + truncated description */}
                    <div className="flex-1 min-w-0 text-left">
                        <span className="text-sm font-medium text-foreground">{title}</span>
                        <span className="text-xs text-muted-foreground ml-2 hidden md:inline">{truncatedDesc}</span>
                    </div>
                    
                    {/* Right side: CRS + occurrence count + chevron */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                        {typeof crs === 'number' && (
                            <span className={`text-sm font-bold tabular-nums ${
                                crs >= 80 ? 'text-[hsl(var(--critical))]' : crs >= 65 ? 'text-[hsl(var(--high))]' : crs >= 50 ? 'text-[hsl(43,74%,46%)]' : 'text-[hsl(var(--low))]'
                            }`}>{crs}</span>
                        )}
                        {group.count > 1 && (
                            <span className="text-[10px] font-medium text-muted-foreground bg-muted rounded-full px-1.5 py-0.5">×{group.count}</span>
                        )}
                        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} strokeWidth={1.5} />
                    </div>
                </div>
            </button>

            {/* Expanded state with tabs */}
            {isOpen && (
                <div className="px-4 pb-4 border-t border-border/40">
                    {/* Tab bar */}
                    <div className="flex gap-1 py-2 border-b border-border/30 mb-4">
                        <TabBtn active={activeTab === 'details'} onClick={() => setActiveTab('details')}>Details</TabBtn>
                        <TabBtn active={activeTab === 'risk'} onClick={() => setActiveTab('risk')}>Risk Assessment</TabBtn>
                        <TabBtn active={activeTab === 'remediation'} onClick={() => setActiveTab('remediation')}>Remediation</TabBtn>
                    </div>

                    {/* Tab: Details */}
                    {activeTab === 'details' && (
                        <div className="space-y-4">
                            {/* CWE + OWASP row */}
                            <div className="flex flex-wrap items-start gap-4">
                                {cweDisplayId && (
                                    <div>
                                        <span className="text-[10px] uppercase text-muted-foreground tracking-wider">CWE</span>
                                        <p className="text-sm font-medium text-foreground">{cweDisplayId}{cweName && !/^CWE[\s#-]*\d+$/i.test(cweName) ? `: ${cweName}` : ''}</p>
                                    </div>
                                )}
                                {sortedOwasp.length > 0 && (
                                    <div>
                                        <span className="text-[10px] uppercase text-muted-foreground tracking-wider">OWASP</span>
                                        <div className="flex flex-wrap gap-1 mt-0.5">
                                            {sortedOwasp.map((entry, i) => (
                                                <Badge key={i} variant="outline" className="text-[10px] font-mono bg-white/50 py-0">{entry}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Description */}
                            <p className="text-sm text-foreground leading-relaxed">{description}</p>

                            {/* Code snippet */}
                            {vulnerableCode && (
                                <div>
                                    <span className="text-[10px] uppercase text-muted-foreground tracking-wider">Vulnerable Code</span>
                                    <div className="bg-[hsl(var(--secondary))] rounded-md p-3 mt-1">
                                        <pre className="text-xs font-mono text-foreground overflow-x-auto"><code>{vulnerableCode}</code></pre>
                                    </div>
                                    <p className="text-[11px] font-mono text-muted-foreground mt-1 flex items-center gap-1">
                                        <MapPin className="w-3 h-3" /> {locationStr}
                                    </p>
                                </div>
                            )}

                            {/* Grouped occurrences */}
                            {group.count > 1 && (
                                <div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setShowOccurrences(!showOccurrences); }}
                                        className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5 hover:text-foreground transition-colors"
                                    >
                                        <Layers className="w-3.5 h-3.5" />
                                        {group.count} occurrences
                                        <ChevronDown className={`w-3 h-3 transition-transform ${showOccurrences ? 'rotate-180' : ''}`} />
                                    </button>
                                    {showOccurrences && (
                                        <div className="space-y-1.5 mt-2">
                                            {group.occurrences.slice(1).map((occ, i) => {
                                                const occLoc = occ.location || occ.start;
                                                const occFile = occLoc?.file || occ.file || filePath;
                                                const occLine = occLoc?.line || occ.startLine || occ.line;
                                                const occSnippet = toText(occ.snippet || occ.code || '') || '';
                                                return (
                                                    <div key={i} className="border border-border/40 rounded p-2">
                                                        <span className="font-mono text-[11px] text-muted-foreground">{occFile}:{occLine}</span>
                                                        {occSnippet && (
                                                            <pre className="text-[11px] font-mono text-foreground mt-1 bg-[hsl(var(--secondary))] rounded p-1.5 overflow-x-auto"><code>{occSnippet}</code></pre>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Tab: Risk Assessment */}
                    {activeTab === 'risk' && (
                        <div className="space-y-4">
                            {/* BTS / CRS */}
                            {(typeof bts === 'number' || typeof crs === 'number') && (
                                <div className="flex gap-6">
                                    {typeof bts === 'number' && (
                                        <div>
                                            <span className="text-[10px] uppercase text-muted-foreground tracking-wider">BTS</span>
                                            <p className="text-lg font-semibold tabular-nums text-foreground">{bts.toFixed(1)} <span className="text-xs text-muted-foreground font-normal">/ 10</span></p>
                                        </div>
                                    )}
                                    {typeof crs === 'number' && (
                                        <div>
                                            <span className="text-[10px] uppercase text-muted-foreground tracking-wider">CRS</span>
                                            <p className={`text-lg font-semibold tabular-nums ${
                                                crs >= 80 ? 'text-[hsl(var(--critical))]' : crs >= 65 ? 'text-[hsl(var(--high))]' : crs >= 50 ? 'text-[hsl(43,74%,46%)]' : 'text-[hsl(var(--low))]'
                                            }`}>{crs} <span className="text-xs text-muted-foreground font-normal">/ 100</span></p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Priority + SLA */}
                            {findingPriority?.priority && (
                                <div className="flex items-center gap-3">
                                    <PriorityBadge priority={findingPriority.priority} />
                                    <span className="text-sm text-foreground">{findingPriority.action}</span>
                                    {findingPriority.sla && (
                                        <span className="text-xs text-muted-foreground">SLA: {findingPriority.sla}</span>
                                    )}
                                </div>
                            )}

                            {/* Context detected */}
                            {inferredFactors && inferredFactors.length > 0 && (
                                <div>
                                    <span className="text-[10px] uppercase text-muted-foreground tracking-wider">Context Detected</span>
                                    <TooltipProvider delayDuration={200}>
                                        <div className="flex flex-wrap gap-1.5 mt-1">
                                            {inferredFactors.map((factor: string) => {
                                                const isApplied = appliedFactors?.includes(factor);
                                                const evidence = contextEvidence?.[factor];
                                                const conf = evidence?.confidence;
                                                const evidenceList: string[] = evidence?.evidence || [];
                                                const label = factor.replace(/([A-Z])/g, ' $1').trim().replace(/^./, c => c.toUpperCase());
                                                const confidenceStr = typeof conf === 'number' ? ` (${Math.round(conf * 100)}%)` : '';

                                                return (
                                                    <Tooltip key={factor}>
                                                        <TooltipTrigger asChild>
                                                            <Badge
                                                                variant={isApplied ? 'default' : 'outline'}
                                                                className={isApplied
                                                                    ? 'bg-[hsl(var(--low)/0.15)] text-[hsl(var(--low))] border-[hsl(var(--low)/0.3)] cursor-default text-[11px]'
                                                                    : 'bg-muted text-muted-foreground border-border cursor-default line-through decoration-muted-foreground/40 text-[11px]'
                                                                }
                                                            >
                                                                {label}{confidenceStr}{isApplied ? ' ✓' : ''}
                                                            </Badge>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="top" className="max-w-xs">
                                                            <p className="font-medium text-xs mb-1">{isApplied ? 'Applied to risk score' : 'Detected but not applied (below threshold)'}</p>
                                                            {evidenceList.length > 0 && (
                                                                <ul className="text-xs space-y-0.5 list-disc pl-3 mt-1">
                                                                    {evidenceList.map((e, i) => <li key={i} className="font-mono text-[11px]">{e}</li>)}
                                                                </ul>
                                                            )}
                                                        </TooltipContent>
                                                    </Tooltip>
                                                );
                                            })}
                                        </div>
                                    </TooltipProvider>
                                </div>
                            )}

                            {/* Risk factor adjustments */}
                            {finding.risk?.adjusted?.adjustments && (
                                <div>
                                    <span className="text-[10px] uppercase text-muted-foreground tracking-wider">Risk Adjustments</span>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {Object.entries(finding.risk.adjusted.adjustments).map(([factor, value]) => (
                                            <span key={factor} className="bg-[hsl(var(--high)/0.1)] text-[hsl(var(--high))] text-[11px] px-2 py-0.5 rounded">
                                                {factor}: {typeof value === 'number' ? (value > 1 ? `×${value.toFixed(1)}` : `+${value.toFixed(1)}`) : String(value)}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Engine assessment */}
                            {(confidence || impact || likelihood) && (
                                <div>
                                    <span className="text-[10px] uppercase text-muted-foreground tracking-wider">Engine Assessment</span>
                                    <div className="flex gap-4 mt-1">
                                        {confidence && <span className="text-xs text-foreground"><span className="text-muted-foreground">Confidence:</span> {String(confidence).charAt(0).toUpperCase() + String(confidence).slice(1).toLowerCase()}</span>}
                                        {impact && <span className="text-xs text-foreground"><span className="text-muted-foreground">Impact:</span> {String(impact).charAt(0).toUpperCase() + String(impact).slice(1).toLowerCase()}</span>}
                                        {likelihood && <span className="text-xs text-foreground"><span className="text-muted-foreground">Likelihood:</span> {String(likelihood).charAt(0).toUpperCase() + String(likelihood).slice(1).toLowerCase()}</span>}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Tab: Remediation */}
                    {activeTab === 'remediation' && (
                        <div className="space-y-3">
                            <div className="flex items-start gap-2">
                                <Lightbulb className="w-4 h-4 text-[hsl(var(--accent))] mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                                <p className="text-sm text-foreground leading-relaxed">{remediationApproach}</p>
                            </div>
                            
                            {/* Only show description here if it's different from remediation */}
                            {!remediationIsDuplicate && description !== remediationApproach && (
                                <p className="text-xs text-muted-foreground">{description}</p>
                            )}

                            {remediationValidation && (
                                <div className="flex items-start gap-2">
                                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide min-w-[70px]">Validation</span>
                                    <span className="text-xs text-foreground">{remediationValidation}</span>
                                </div>
                            )}
                            {remediationRisk && (
                                <div className="flex items-start gap-2">
                                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide min-w-[70px]">Risk</span>
                                    <span className="text-xs text-foreground">{remediationRisk}</span>
                                </div>
                            )}
                            {remediationImpact && (
                                <div className="flex items-start gap-2">
                                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide min-w-[70px]">Impact</span>
                                    <span className="text-xs text-foreground">{remediationImpact}</span>
                                </div>
                            )}
                            {remediationCategory && (
                                <div className="flex items-center gap-1.5 mt-1">
                                    <Tag className="w-3 h-3 text-muted-foreground" strokeWidth={1.5} />
                                    <span className="text-xs text-muted-foreground">{remediationCategory.replace(/^./, c => c.toUpperCase())}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default function FindingsCard({ findings = [] }) {
    if (!findings || findings.length === 0) {
        return (
            <div className="glass-panel p-12 text-center rounded-xl">
                <h3 className="text-lg font-medium text-foreground">No Vulnerabilities Found</h3>
                <p className="mt-2 text-muted-foreground">Great! Your code appears to be secure.</p>
            </div>
        );
    }

    const groups = groupFindingsByRuleId(findings);
    const totalUnique = groups.length;
    const totalAll = findings.length;

    return (
        <div>
            <h3 className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-3">
                Security Findings ({totalUnique} unique{totalAll !== totalUnique ? `, ${totalAll} total` : ''})
            </h3>
            <div className="glass-panel rounded-xl overflow-hidden divide-y divide-border/30">
                {groups.map((group, index) => (
                    <FindingItem group={group} key={index} isEven={index % 2 === 0} />
                ))}
            </div>
        </div>
    );
}
