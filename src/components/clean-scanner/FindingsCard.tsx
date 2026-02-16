import React, { useState } from 'react';
import { ChevronDown, MapPin, Lightbulb, Tag } from 'lucide-react';
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
    // Fallback: concatenate string-like fields
    const parts = Object.values(val).map(toText).filter(Boolean);
    if (parts.length) return parts.join(' ');
    try { return JSON.stringify(val); } catch { return ''; }
  }
  return '';
};

const SeverityPill = ({ severity }) => {
    const s = severity?.toLowerCase() || 'info';
    const styles = {
        critical: 'bg-[#FEE2E2] text-[#DC2626]',
        high: 'bg-[#FED7AA] text-[#EA580C]',
        medium: 'bg-[#FEF3C7] text-[#D97706]',
        low: 'bg-[#DBEAFE] text-[#2563EB]',
        info: 'bg-[#F3F4F6] text-[#6B7280]'
    };
    return (
        <div className={`rounded-full px-2.5 py-1 text-xs font-medium ${styles[s]}`}>
            {severity}
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

const FindingItem = ({ finding }) => {
    const [isOpen, setIsOpen] = useState(false);
    
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
        // NEW: backend-specific fields
        bts, crs, priority: findingPriority, sla,
        context, contextEvidence, inferredFactors, appliedFactors,
        confidence, impact, likelihood, ruleId
    } = finding;

    const title = toText(rawTitle || name || check_id || message) || "Security Vulnerability";
    const description = toText(cwe?.description ?? rawDesc ?? message) || 'Security vulnerability detected';
    
    // Handle remediation - prefer structured fields from backend
    let remediationApproach = '';
    let remediationValidation = '';
    let remediationRisk = '';
    let remediationTimeline = '';
    let remediationCategory = '';
    let remediationPriority = '';
    let remediationImpact = '';
    
    if (rawRemediation) {
        if (typeof rawRemediation === 'object') {
            // Prefer .approach for vulnerability-specific guidance
            remediationApproach = toText(rawRemediation.approach) || '';
            remediationValidation = toText(rawRemediation.validation) || '';
            remediationRisk = toText(rawRemediation.risk) || '';
            remediationTimeline = toText(rawRemediation.timeline) || '';
            remediationCategory = rawRemediation.resources?.category || '';
            remediationPriority = toText(rawRemediation.priority) || '';
            remediationImpact = toText(rawRemediation.impact) || '';
            // Fallback to description/guidance if approach is empty
            if (!remediationApproach) {
                remediationApproach = toText(rawRemediation.description || rawRemediation.guidance || rawRemediation.text || rawRemediation);
            }
        } else {
            remediationApproach = toText(rawRemediation);
        }
    }
    if (!remediationApproach) {
        remediationApproach = 'Review and apply security best practices';
    }
    
    // Handle file location - check multiple possible fields
    const location = rawLocation || start;
    const filePath = location?.path || location?.file || file || finding.file || "Code scan";
    const lineNumber = location?.line || location?.row || startLine || line || finding.startLine;
    const locationStr = lineNumber ? `${filePath}:${lineNumber}` : filePath;
    const ruleIdShort = ruleId ? ruleId.split('.').slice(-2).join('.') : '';

    // Handle vulnerable code - check multiple possible fields including snippet
    const vulnerableCode = toText(snippet || code || extractedCode || codeSnippet || extra?.lines) || '';

    const cweDisplayId = typeof cwe === 'string'
        ? (cwe.startsWith('CWE-') ? cwe : `CWE-${cwe}`)
        : cwe?.id
            ? (String(cwe.id).startsWith('CWE-') ? cwe.id : `CWE-${cwe.id}`)
            : null;
    const cweName = typeof cwe === 'object' ? cwe?.name : null;

    return (
        <div className={`bg-white rounded-xl transition-all duration-150 ${isOpen ? 'shadow-[0_4px_12px_rgba(0,0,0,0.08)]' : 'shadow-[0_1px_3px_rgba(0,0,0,0.05)]'}`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full hover:bg-[#F9FAFB] px-6 py-4 transition-colors duration-150 group rounded-t-xl"
            >
                <div className="flex items-center justify-between w-full text-left">
                    <div className="flex items-center gap-4">
                        <SeverityPill severity={severity} />
                        {cweDisplayId && (
                            <Badge variant="outline" className="text-xs font-mono">
                                {cweDisplayId}
                            </Badge>
                        )}
                        <span className="font-medium text-[#374151]">{title}</span>
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
                                    <p><span className="font-semibold">{cweDisplayId}</span>{cweName ? `: ${cweName}` : ''}</p>
                                </InfoBlock>
                            )}
                            {owasp && (
                                <InfoBlock title="OWASP">
                                    {Array.isArray(owasp) ? (
                                        <p><span className="font-semibold">{owasp[0] || owasp.join(', ')}</span></p>
                                    ) : owasp.category ? (
                                        <p><span className="font-semibold">{owasp.category}</span> – {owasp.title}</p>
                                    ) : (
                                        <p><span className="font-semibold">{String(owasp)}</span></p>
                                    )}
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

                            {/* Neperia Risk Scores — the core innovation */}
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
                                                'bg-gray-100 text-gray-600'
                                            }`}>
                                                {findingPriority.priority} — {findingPriority.action}
                                            </span>
                                        </div>
                                    )}
                                    {typeof sla === 'number' && (
                                        <p className="text-xs text-[#6B7280] mt-1">Remediation SLA: {sla} days</p>
                                    )}
                                </InfoBlock>
                            )}

                            {/* Context Inference */}
                            {inferredFactors && inferredFactors.length > 0 && (
                                <InfoBlock title="Context Detected">
                                    <TooltipProvider delayDuration={200}>
                                        <div className="flex flex-wrap gap-1.5">
                                            {inferredFactors.map((factor: string) => {
                                                const isApplied = appliedFactors?.includes(factor);
                                                const evidence = contextEvidence?.[factor];
                                                const confidence = evidence?.confidence;
                                                const evidenceList: string[] = evidence?.evidence || [];
                                                const label = factor.replace(/([A-Z])/g, ' $1').trim();
                                                const confidenceStr = typeof confidence === 'number' ? ` (${Math.round(confidence * 100)}%)` : '';

                                                const badge = (
                                                    <Badge
                                                        key={factor}
                                                        variant={isApplied ? 'default' : 'outline'}
                                                        className={isApplied
                                                            ? 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200 cursor-default'
                                                            : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100 cursor-default'
                                                        }
                                                    >
                                                        {label}{confidenceStr}{isApplied ? ' ✓' : ''}
                                                    </Badge>
                                                );

                                                if (evidenceList.length > 0) {
                                                    return (
                                                        <Tooltip key={factor}>
                                                            <TooltipTrigger asChild>{badge}</TooltipTrigger>
                                                            <TooltipContent side="top" className="max-w-xs">
                                                                <p className="font-medium text-xs mb-1">Evidence:</p>
                                                                <ul className="text-xs space-y-0.5 list-disc pl-3">
                                                                    {evidenceList.map((e, i) => (
                                                                        <li key={i} className="font-mono text-[11px]">{e}</li>
                                                                    ))}
                                                                </ul>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    );
                                                }
                                                return badge;
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
                                    {remediationTimeline && (
                                        <div className="flex items-start gap-2">
                                            <span className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">Timeline:</span>
                                            <span className="text-xs text-[#374151]">{remediationTimeline}</span>
                                        </div>
                                    )}
                                    {remediationCategory && (
                                        <div className="flex items-center gap-2 mt-1">
                                            <Tag className="w-3.5 h-3.5 text-[#9CA3AF]" strokeWidth={1.5} />
                                            <span className="text-xs text-[#6B7280]">{remediationCategory}</span>
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

    return (
        <div>
            <h3 className="text-sm font-medium uppercase tracking-wider text-[#6B7280] mb-4">Security Findings ({findings.length})</h3>
            <div className="space-y-2">
                {findings.map((finding, index) => (
                    <FindingItem finding={finding} key={index} />
                ))}
            </div>
        </div>
    );
}