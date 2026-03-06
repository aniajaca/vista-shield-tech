import React, { useState } from 'react';
import { ChevronDown, MapPin, Lightbulb, Tag, Layers } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Safe formatter to render possibly nested objects as readable text
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

// Fix 2: Use adjustedSeverity for badge display
const SeverityPill = ({ severity, adjustedSeverity, rawSeverity }: { severity: string; adjustedSeverity?: string; rawSeverity?: string }) => {
    const displaySev = adjustedSeverity || severity || 'Medium';
    const s = displaySev.toLowerCase();
    const styles = {
        critical: 'bg-[#FEE2E2] text-[#DC2626]',
        high: 'bg-[#FED7AA] text-[#EA580C]',
        medium: 'bg-[#FEF3C7] text-[#D97706]',
        low: 'bg-[#DBEAFE] text-[#2563EB]',
        info: 'bg-[#F3F4F6] text-[#6B7280]'
    };
    const displayLabel = displaySev.charAt(0).toUpperCase() + displaySev.slice(1).toLowerCase();
    // Show "was: X" if adjustedSeverity differs from raw severity
    const rawNorm = (rawSeverity || severity || '').toLowerCase();
    const showWas = adjustedSeverity && rawNorm && rawNorm !== s;
    
    return (
        <div className="flex items-center gap-1.5">
            <div className={`rounded-full px-2.5 py-1 text-xs font-medium ${styles[s] || styles.info}`}>
                {displayLabel}
            </div>
            {showWas && (
                <span className="text-[10px] text-[#9CA3AF] italic">
                    was: {rawSeverity?.charAt(0).toUpperCase()}{rawSeverity?.slice(1).toLowerCase()}
                </span>
            )}
        </div>
    );
};

const InfoBlock = ({ title, children }) => (
    <div>
        <h4 className="text-[11px] font-semibold uppercase text-[#9CA3AF] mb-2 tracking-[0.05em]">{title}</h4>
        <div className="text-sm text-[#374151] space-y-1">
            {children}
        </div>
    </div>
);

// Fix 6: Group findings by ruleId
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

const FindingItem = ({ group }: { group: FindingGroup }) => {
    const [isOpen, setIsOpen] = useState(false);
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
        adjustedScore, adjustedSeverity,
        bts, crs, priority: findingPriority, sla,
        context, contextEvidence, inferredFactors, appliedFactors,
        confidence, impact, likelihood, ruleId
    } = finding;

    const rawTitleStr = toText(rawTitle || name || check_id || message) || "Security Vulnerability";
    const title = rawTitleStr
        .replace(/^(javascript|python|java|go|ruby|php|csharp|typescript|express|flask|django|lang|security|audit)\./gi, '')
        .replace(/\./g, ' ')
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase())
        .replace(/\s+/g, ' ')
        .trim();
    const description = toText(cwe?.description ?? rawDesc ?? message) || 'Security vulnerability detected';
    
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
    if (!remediationApproach) {
        remediationApproach = 'Review and apply security best practices';
    }
    
    const location = rawLocation || start;
    const filePath = location?.path || location?.file || file || finding.file || "Code scan";
    const lineNumber = location?.line || location?.row || startLine || line || finding.startLine;
    const locationStr = lineNumber ? `${filePath}:${lineNumber}` : filePath;
    const ruleIdShort = ruleId ? ruleId.split('.').slice(-2).join('.') : '';

    const vulnerableCode = toText(snippet || code || extractedCode || codeSnippet || extra?.lines) || '';

    const cweDisplayId = typeof cwe === 'string'
        ? (cwe.startsWith('CWE-') ? cwe : `CWE-${cwe}`)
        : cwe?.id
            ? (String(cwe.id).startsWith('CWE-') ? cwe.id : `CWE-${cwe.id}`)
            : null;
    const cweName = typeof cwe === 'object' ? cwe?.name : null;

    // Fix 7: Sort OWASP refs by year descending, show all
    const owaspEntries: string[] = Array.isArray(owasp) ? [...owasp] : owasp ? [String(owasp)] : [];
    const sortedOwasp = owaspEntries.sort((a, b) => {
        const yearA = a.match(/:(\d{4})/)?.[1] || '0';
        const yearB = b.match(/:(\d{4})/)?.[1] || '0';
        return parseInt(yearB) - parseInt(yearA);
    });

    return (
        <div className={`glass-card rounded-xl transition-all duration-150 ${isOpen ? 'shadow-[0_4px_12px_rgba(0,0,0,0.08)]' : ''}`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full hover:bg-white/40 px-6 py-4 transition-colors duration-150 group rounded-t-xl"
            >
                <div className="flex items-center justify-between w-full text-left">
                    <div className="flex items-center gap-4">
                        {/* Fix 2: adjustedSeverity badge */}
                        <SeverityPill severity={severity} adjustedSeverity={adjustedSeverity} rawSeverity={severity} />
                        {cweDisplayId && (
                            <Badge variant="outline" className="text-xs font-mono">
                                {cweDisplayId}
                            </Badge>
                        )}
                        <span className="font-medium text-[#374151]">{title}</span>
                        {/* Fix 6: occurrence count badge */}
                        {group.count > 1 && (
                            <Badge variant="secondary" className="text-[10px] bg-[#F3F4F6] text-[#6B7280]">
                                <Layers className="w-3 h-3 mr-1" />
                                {group.count} occurrences
                            </Badge>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-sm text-[#6B7280]">
                             <MapPin className="w-4 h-4" strokeWidth={1.5} />
                             <span className="font-mono text-xs">{locationStr}</span>
                        </div>
                        {ruleIdShort && (
                            <span className="font-mono text-xs text-[#9CA3AF] hidden lg:inline">{ruleIdShort}</span>
                        )}
                        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} strokeWidth={1.5} />
                    </div>
                </div>
            </button>
            {isOpen && (
                <div className="px-6 pb-6 border-t border-[#F3F4F6]">
                   <div className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="md:col-span-1 space-y-6">
                            {cweDisplayId && (
                                <InfoBlock title="CWE">
                                    <p><span className="font-semibold">{cweDisplayId}</span>{cweName && !/^CWE[\s#-]*\d+$/i.test(cweName) ? `: ${cweName}` : ''}</p>
                                </InfoBlock>
                            )}
                            {/* Fix 7: Show all OWASP refs sorted by year */}
                            {sortedOwasp.length > 0 && (
                                <InfoBlock title="OWASP">
                                    <div className="flex flex-wrap gap-1">
                                        {sortedOwasp.map((entry, i) => (
                                            <Badge key={i} variant="outline" className="text-[11px] font-mono bg-white/50">
                                                {entry}
                                            </Badge>
                                        ))}
                                    </div>
                                </InfoBlock>
                            )}
                            
                            {/* Risk Adjustments */}
                            {finding.risk?.adjusted?.adjustments && (
                                <InfoBlock title="Risk Factors Applied">
                                    <div className="flex flex-wrap gap-1">
                                        {Object.entries(finding.risk.adjusted.adjustments).map(([factor, value]) => (
                                            <div key={factor} className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded">
                                                {factor}: {typeof value === 'number' ? (value > 1 ? `×${value.toFixed(1)}` : `+${value.toFixed(1)}`) : String(value)}
                                            </div>
                                        ))}
                                    </div>
                                </InfoBlock>
                            )}

                            {/* Neperia Risk Scores */}
                            {(typeof bts === 'number' || typeof crs === 'number') && (
                                <InfoBlock title="Neperia Risk Score">
                                    {typeof bts === 'number' && (
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs text-[#6B7280]">BTS</span>
                                            <span className="font-semibold tabular-nums">{bts.toFixed(1)}</span>
                                            <span className="text-xs text-[#9CA3AF]">/ 10</span>
                                        </div>
                                    )}
                                    {typeof crs === 'number' && (
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs text-[#6B7280]">CRS</span>
                                            <span className={`font-semibold tabular-nums ${
                                                crs >= 80 ? 'text-red-600' : crs >= 65 ? 'text-orange-600' : crs >= 50 ? 'text-yellow-600' : 'text-green-600'
                                            }`}>{crs}</span>
                                            <span className="text-xs text-[#9CA3AF]">/ 100</span>
                                        </div>
                                    )}
                                    {findingPriority?.priority && (
                                        <div className="mt-2">
                                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                                                findingPriority.priority === 'P0' ? 'bg-red-100 text-red-700' :
                                                findingPriority.priority === 'P1' ? 'bg-orange-100 text-orange-700' :
                                                findingPriority.priority === 'P2' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-blue-100 text-blue-600'
                                            }`}>
                                                {findingPriority.priority} — {findingPriority.action}
                                            </span>
                                        </div>
                                    )}
                                    {findingPriority?.sla && (
                                        <p className="text-xs text-[#6B7280] mt-1">Remediation SLA: {findingPriority.sla}</p>
                                    )}
                                </InfoBlock>
                            )}

                            {/* Fix 8: Engine confidence, impact, likelihood */}
                            {(confidence || impact || likelihood) && (
                                <InfoBlock title="Engine Assessment">
                                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                                        {confidence && (
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[11px] text-[#9CA3AF]">Confidence:</span>
                                                <span className="text-xs font-medium text-[#374151]">{typeof confidence === 'string' ? confidence.charAt(0).toUpperCase() + confidence.slice(1).toLowerCase() : confidence}</span>
                                            </div>
                                        )}
                                        {impact && (
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[11px] text-[#9CA3AF]">Impact:</span>
                                                <span className="text-xs font-medium text-[#374151]">{typeof impact === 'string' ? impact.charAt(0).toUpperCase() + impact.slice(1).toLowerCase() : impact}</span>
                                            </div>
                                        )}
                                        {likelihood && (
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[11px] text-[#9CA3AF]">Likelihood:</span>
                                                <span className="text-xs font-medium text-[#374151]">{typeof likelihood === 'string' ? likelihood.charAt(0).toUpperCase() + likelihood.slice(1).toLowerCase() : likelihood}</span>
                                            </div>
                                        )}
                                    </div>
                                </InfoBlock>
                            )}

                            {/* Fix 1: Context badges — applied (green) vs detected-only (gray) */}
                            {inferredFactors && inferredFactors.length > 0 && (
                                <InfoBlock title="Context Detected">
                                    <TooltipProvider delayDuration={200}>
                                        <div className="flex flex-wrap gap-1.5">
                                            {inferredFactors.map((factor: string) => {
                                                const isApplied = appliedFactors?.includes(factor);
                                                const evidence = contextEvidence?.[factor];
                                                const conf = evidence?.confidence;
                                                const evidenceList: string[] = evidence?.evidence || [];
                                                const label = factor.replace(/([A-Z])/g, ' $1').trim().replace(/^./, c => c.toUpperCase());
                                                const confidenceStr = typeof conf === 'number' ? ` (${Math.round(conf * 100)}%)` : '';

                                                const badge = (
                                                    <Badge
                                                        key={factor}
                                                        variant={isApplied ? 'default' : 'outline'}
                                                        className={isApplied
                                                            ? 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200 cursor-default'
                                                            : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100 cursor-default line-through decoration-gray-300'
                                                        }
                                                    >
                                                        {label}{confidenceStr}
                                                        {isApplied ? ' ✓ Applied' : ''}
                                                    </Badge>
                                                );

                                                const tooltipText = isApplied 
                                                    ? 'This factor was applied to the risk score'
                                                    : 'Detected but not applied (below confidence threshold)';

                                                return (
                                                    <Tooltip key={factor}>
                                                        <TooltipTrigger asChild>{badge}</TooltipTrigger>
                                                        <TooltipContent side="top" className="max-w-xs">
                                                            <p className="font-medium text-xs mb-1">{tooltipText}</p>
                                                            {evidenceList.length > 0 && (
                                                                <>
                                                                    <p className="font-medium text-xs mb-1 mt-2">Evidence:</p>
                                                                    <ul className="text-xs space-y-0.5 list-disc pl-3">
                                                                        {evidenceList.map((e, i) => (
                                                                            <li key={i} className="font-mono text-[11px]">{e}</li>
                                                                        ))}
                                                                    </ul>
                                                                </>
                                                            )}
                                                        </TooltipContent>
                                                    </Tooltip>
                                                );
                                            })}
                                        </div>
                                    </TooltipProvider>
                                </InfoBlock>
                            )}
                        </div>
                       
                       <div className="md:col-span-2 space-y-6">
                            <InfoBlock title="Description">
                                <p>{description}</p>
                            </InfoBlock>

                            {vulnerableCode && (
                                <div>
                                     <h4 className="text-[11px] font-semibold uppercase text-[#9CA3AF] mb-2 tracking-[0.05em]">Vulnerable Code</h4>
                                    <div className="bg-[#F9FAFB] rounded-md p-3">
                                        <pre className="text-xs font-mono text-[#374151] overflow-x-auto">
                                            <code>{vulnerableCode}</code>
                                        </pre>
                                    </div>
                                </div>
                            )}

                            {/* Fix 6: Grouped occurrences */}
                            {group.count > 1 && (
                                <div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setShowOccurrences(!showOccurrences); }}
                                        className="text-[11px] font-semibold uppercase text-[#9CA3AF] mb-2 tracking-[0.05em] flex items-center gap-2 hover:text-[#6B7280] transition-colors"
                                    >
                                        <Layers className="w-3.5 h-3.5" />
                                        {group.count} Occurrences in this file
                                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showOccurrences ? 'rotate-180' : ''}`} />
                                    </button>
                                    {showOccurrences && (
                                        <div className="space-y-2 mt-2">
                                            {group.occurrences.slice(1).map((occ, i) => {
                                                const occLocation = occ.location || occ.start;
                                                const occFile = occLocation?.file || occ.file || filePath;
                                                const occLine = occLocation?.line || occ.startLine || occ.line;
                                                const occSnippet = toText(occ.snippet || occ.code || '') || '';
                                                return (
                                                    <div key={i} className="border border-[#F3F4F6] rounded-lg p-3">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <MapPin className="w-3 h-3 text-[#9CA3AF]" />
                                                            <span className="font-mono text-xs text-[#6B7280]">{occFile}:{occLine}</span>
                                                        </div>
                                                        {occSnippet && (
                                                            <div className="bg-[#F9FAFB] rounded p-2 mt-1">
                                                                <pre className="text-[11px] font-mono text-[#374151] overflow-x-auto"><code>{occSnippet}</code></pre>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div>
                                <h4 className="text-[11px] font-semibold uppercase text-[#9CA3AF] mb-3 tracking-[0.05em] flex items-center gap-2">
                                    <Lightbulb className="w-4 h-4 text-[#AFCB0E]" strokeWidth={1.5} /> 
                                    Recommended Fix
                                </h4>
                                <div className="space-y-3">
                                    <p className="text-sm text-[#374151] leading-relaxed">{remediationApproach}</p>
                                    {remediationValidation && (
                                        <div className="flex items-start gap-2">
                                            <span className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">Validation:</span>
                                            <span className="text-xs text-[#374151]">{remediationValidation}</span>
                                        </div>
                                    )}
                                    {remediationRisk && (
                                        <div className="flex items-start gap-2">
                                            <span className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">Risk:</span>
                                            <span className="text-xs text-[#374151]">{remediationRisk}</span>
                                        </div>
                                    )}
                                    {remediationCategory && (
                                        <div className="flex items-center gap-2 mt-1">
                                            <Tag className="w-3.5 h-3.5 text-[#9CA3AF]" strokeWidth={1.5} />
                                            <span className="text-xs text-[#6B7280]">{remediationCategory.replace(/^./, c => c.toUpperCase())}</span>
                                        </div>
                                    )}
                                    {remediationPriority && (
                                        <div className="flex items-start gap-2">
                                            <span className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">Priority:</span>
                                            <span className="text-xs text-[#374151]">{remediationPriority}</span>
                                        </div>
                                    )}
                                    {remediationImpact && (
                                        <div className="flex items-start gap-2">
                                            <span className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">Impact:</span>
                                            <span className="text-xs text-[#374151]">{remediationImpact}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                       </div>
                   </div>
                </div>
            )}
        </div>
    );
};


export default function FindingsCard({ findings = [] }) {
    if (!findings || findings.length === 0) {
        return (
             <div className="bg-white p-12 text-center rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                <h3 className="text-lg font-medium text-[#374151]">No Vulnerabilities Found</h3>
                <p className="mt-2 text-[#6B7280]">Great! Your code appears to be secure.</p>
            </div>
        );
    }

    // Fix 6: Group findings by ruleId + file
    const groups = groupFindingsByRuleId(findings);
    const totalUnique = groups.length;
    const totalAll = findings.length;

    return (
        <div>
            <h3 className="text-sm font-medium uppercase tracking-wider text-[#6B7280] mb-4">
                Security Findings ({totalUnique} unique{totalAll !== totalUnique ? `, ${totalAll} total` : ''})
            </h3>
            <div className="space-y-2">
                {groups.map((group, index) => (
                    <FindingItem group={group} key={index} />
                ))}
            </div>
        </div>
    );
}
