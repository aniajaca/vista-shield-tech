import React, { useState } from 'react';
import { ChevronDown, MapPin, Lightbulb } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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
        cwe, owasp, cvss,
        description: rawDesc,
        remediation: rawRemediation,
        location: rawLocation, start,
        code, extractedCode, codeSnippet, snippet, extra,
        file, startLine, line,
        adjustedScore, adjustedSeverity
    } = finding;

    const title = toText(rawTitle || name || check_id || message) || "Security Vulnerability";
    const description = toText(cwe?.description ?? rawDesc ?? message) || 'Security vulnerability detected';
    
    // Handle remediation - extract from object if needed and format cleanly
    let remediation = '';
    let remediationPriority = '';
    let remediationImpact = '';
    
    if (rawRemediation) {
        if (typeof rawRemediation === 'object') {
            remediation = toText(rawRemediation.description || rawRemediation.guidance || rawRemediation.text || rawRemediation);
            remediationPriority = toText(rawRemediation.priority) || '';
            remediationImpact = toText(rawRemediation.impact) || '';
        } else {
            remediation = toText(rawRemediation);
        }
    }
    if (!remediation) {
        // Provide shell-specific remediation for command injection
        if (title.toLowerCase().includes('command injection') || title.toLowerCase().includes('os command')) {
            remediation = 'Use parameterized commands or shell escape functions. Avoid direct shell execution with user input. Implement input validation and use safe system call alternatives like execve() with proper argument arrays.';
        } else {
            remediation = 'Review and apply security best practices';
        }
    }
    
    // Handle file location - check multiple possible fields
    const location = rawLocation || start;
    const filePath = location?.path || location?.file || file || finding.file || "Code scan";
    const lineNumber = location?.line || location?.row || startLine || line || finding.startLine;
    const locationStr = lineNumber ? `${filePath}:${lineNumber}` : filePath;

    // Handle vulnerable code - check multiple possible fields including snippet
    const vulnerableCode = toText(snippet || code || extractedCode || codeSnippet || extra?.lines) || '';

    const cweDisplayId = cwe?.id ? (String(cwe.id).startsWith('CWE-') ? cwe.id : `CWE-${cwe.id}`) : null;

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
                                    <p><span className="font-semibold">{cweDisplayId}</span>: {cwe.name}</p>
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
                            {((cvss && (cvss.baseScore || cvss.adjustedScore)) || adjustedScore) && (
                                <InfoBlock title="CVSS Score">
                                    {typeof cvss?.baseScore === 'number' && (
                                        <p>Base: <span className="font-semibold tabular-nums">{cvss.baseScore.toFixed(1)}</span></p>
                                    )}
                                    {typeof cvss?.baseScore !== 'number' && cvss?.baseScore && (
                                        <p>Base: <span className="font-semibold tabular-nums">{String(cvss.baseScore)}</span></p>
                                    )}
                                    {typeof cvss?.adjustedScore === 'number' && cvss.adjustedScore !== cvss.baseScore && (
                                        <p>Base CVSS: <span className="font-semibold tabular-nums text-orange-600">{cvss.adjustedScore.toFixed(1)}</span></p>
                                    )}
                                    {typeof cvss?.adjustedScore !== 'number' && cvss?.adjustedScore && cvss.adjustedScore !== cvss.baseScore && (
                                        <p>Base CVSS: <span className="font-semibold tabular-nums text-orange-600">{String(cvss.adjustedScore)}</span></p>
                                    )}
                                    {typeof adjustedScore === 'number' && !cvss?.adjustedScore && (
                                        <p>Base CVSS: <span className="font-semibold tabular-nums text-orange-600">{adjustedScore.toFixed(1)}</span></p>
                                    )}
                                    {adjustedSeverity && (
                                        <p>Severity: <span className="font-semibold">{adjustedSeverity}</span></p>
                                    )}
                                    {cvss?.vector && <p className="text-xs text-muted-foreground">Vector: {String(cvss.vector)}</p>}
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
                                    <p className="text-sm text-[#374151] leading-relaxed">{remediation}</p>
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