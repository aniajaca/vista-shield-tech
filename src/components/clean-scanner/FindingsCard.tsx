import React, { useState } from 'react';
import { ChevronDown, MapPin, Lightbulb } from 'lucide-react';

const normalizeText = (value: any): string => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return String(value);
    if (typeof value === 'object') {
        // Known shapes from API
        const { strategy, text, fix, recommendation, prevention, details, example } = value as any;
        const primary = strategy || text || recommendation || fix;
        if (primary) return String(primary);
        const parts = [fix, recommendation, prevention, details, example].filter(Boolean).map(String);
        if (parts.length) return parts.join(' ');
        try { return JSON.stringify(value); } catch { return String(value); }
    }
    return String(value);
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
    
    // Add error boundary and safe data extraction
    try {
        const {
            title: rawTitle, name, check_id, message,
            severity = 'Medium',
            cwe, owasp, cvss,
            description: rawDesc,
            remediation: rawRemediation,
            location: rawLocation, start,
            code, extractedCode, codeSnippet, extra,
            risk
        } = finding || {};

        const title = rawTitle || name || check_id || message || "Security Vulnerability";
        const description = normalizeText(cwe?.description || rawDesc || message) || 'Security vulnerability detected';
        const remediation = normalizeText(rawRemediation) || 'Review and apply security best practices';
        
        const location = rawLocation || start;
        const filePath = location?.path || location?.file || finding?.file || "Unknown file";
        const lineNumber = location?.line || location?.row;
        const locationStr = lineNumber ? `${filePath}:${lineNumber}` : filePath;

        const vulnerableCode = code || extractedCode || codeSnippet || extra?.lines || '';

        const cweDisplayId = cwe?.id ? (String(cwe.id).startsWith('CWE-') ? cwe.id : `CWE-${cwe.id}`) : null;

        // Log finding structure for debugging
        console.log('🔍 Rendering finding:', {
            title,
            severity,
            hasRisk: !!risk,
            riskStructure: risk ? Object.keys(risk) : null,
            hasCvss: !!cvss,
            cvssStructure: cvss ? Object.keys(cvss) : null
        });

        return (
            <div className={`bg-white rounded-xl transition-all duration-150 ${isOpen ? 'shadow-[0_4px_12px_rgba(0,0,0,0.08)]' : 'shadow-[0_1px_3px_rgba(0,0,0,0.05)]'}`}>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full hover:bg-[#F9FAFB] px-6 py-4 transition-colors duration-150 group rounded-t-xl"
                >
                    <div className="flex items-center justify-between w-full text-left">
                        <div className="flex items-center gap-4">
                            <SeverityPill severity={severity} />
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
                                        <p><span className="font-semibold">{cweDisplayId}</span>: {normalizeText(cwe?.name) || 'Security Weakness'}</p>
                                    </InfoBlock>
                                )}
                                {owasp && (
                                    <InfoBlock title="OWASP">
                                        <p><span className="font-semibold">{normalizeText(owasp.category)}</span> – {normalizeText(owasp.title)}</p>
                                    </InfoBlock>
                                )}
                                
                                {/* CVSS Scores - Handle both original and adjusted */}
                                {(cvss && (cvss.baseScore || cvss.adjustedScore || cvss.vector)) || (risk?.original?.cvss || risk?.adjusted?.score) ? (
                                    <InfoBlock title="CVSS Score">
                                        {/* Base CVSS Score */}
                                        {(cvss?.baseScore ?? risk?.original?.cvss) !== undefined && (
                                            <p>Base: <span className="font-semibold tabular-nums">
                                                {Number(cvss?.baseScore ?? risk?.original?.cvss).toFixed(1)}
                                            </span></p>
                                        )}
                                        
                                        {/* Adjusted CVSS Score */}
                                        {(cvss?.adjustedScore ?? risk?.adjusted?.score) !== undefined && (
                                            <p>Adjusted: <span className="font-semibold tabular-nums text-orange-600">
                                                {Number(cvss?.adjustedScore ?? risk?.adjusted?.score).toFixed(1)}
                                            </span></p>
                                        )}
                                        
                                        {/* Vector */}
                                        {(cvss?.vector ?? risk?.original?.vector) && (
                                            <p className="text-xs text-muted-foreground">
                                                Vector: {cvss?.vector ?? risk?.original?.vector}
                                            </p>
                                        )}
                                    </InfoBlock>
                                ) : null}
                                
                                {/* Risk Adjustments */}
                                {risk?.adjusted?.adjustments && Object.keys(risk.adjusted.adjustments).length > 0 && (
                                    <InfoBlock title="Risk Factors Applied">
                                        <div className="flex flex-wrap gap-1">
                                            {Object.entries(risk.adjusted.adjustments).map(([factor, value]) => (
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
                                    <h4 className="text-[11px] font-semibold uppercase text-[#9CA3AF] mb-2 tracking-[0.05em] flex items-center gap-2">
                                        <Lightbulb className="w-4 h-4 text-[#AFCB0E]" strokeWidth={1.5} /> 
                                        Recommended Fix
                                    </h4>
                                    <p className="text-sm text-[#374151]">{remediation}</p>
                                </div>
                           </div>
                       </div>
                    </div>
                )}
            </div>
        );
    } catch (error) {
        console.error('🚨 Error rendering finding:', error, finding);
        return (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-red-600 text-sm">Error displaying vulnerability. Check console for details.</p>
            </div>
        );
    }
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