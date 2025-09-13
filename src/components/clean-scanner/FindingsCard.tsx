import React, { useState } from 'react';
import { ChevronDown, MapPin, Lightbulb, ExternalLink, Copy, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import { deduplicateFindings, getRiskLevelStyles, getCweLink, getCvssScoreColor, GroupedFinding } from '@/utils/findingUtils';

const CVSSInfoPopover = ({ type }: { type: 'base' | 'adjusted' | 'file' }) => {
  const content = {
    base: {
      title: 'CVSS (Base)',
      text: 'CVSS (Common Vulnerability Scoring System) is a 0.0–10.0 industry standard that rates the intrinsic severity of a vulnerability. The \'Base\' score is unadjusted and does not include your project context.'
    },
    adjusted: {
      title: 'Adjusted',
      text: 'This score applies your Risk Settings to the base CVSS. We add small context-based adjustments (e.g., internet exposure, PII) and optionally multiply for high-impact environments (e.g., production, internet-facing). Adjusted is capped at 10.0.'
    },
    file: {
      title: 'File Score (0–100)',
      text: 'This is a normalized risk index for the file (0–100). It\'s derived from the mix of severities in the file and your file-level multipliers, so you can prioritize where to fix first. It\'s not a CVSS score.'
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-4 w-4 p-0 text-muted-foreground hover:text-foreground">
          <Info className="h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-2">
          <h4 className="font-medium text-sm">{content[type].title}</h4>
          <p className="text-sm text-muted-foreground">{content[type].text}</p>
        </div>
      </PopoverContent>
    </Popover>
  );
};

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

const SeverityPill = ({ severity }: { severity: string }) => {
    const s = severity?.toLowerCase() || 'info';
    const styles = getRiskLevelStyles(s);
    return (
        <Badge variant="outline" className={`${styles.badge} border-0`}>
            {severity}
        </Badge>
    );
};

const InfoBlock = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div>
        <h4 className="text-[11px] font-semibold uppercase text-[#9CA3AF] mb-2 tracking-[0.05em]">{title}</h4>
        <div className="text-sm text-[#374151] space-y-1">
            {children}
        </div>
    </div>
);

const FindingItem = ({ finding }: { finding: GroupedFinding }) => {
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
            risk,
            duplicateLines = [],
            duplicateCount = 0
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
        const cweLink = cweDisplayId ? getCweLink(cweDisplayId) : null;

        // Get base and adjusted CVSS scores from backend structure
        const baseScore = (finding as any).original?.cvss?.baseScore ?? cvss?.baseScore ?? risk?.original?.cvss;
        const adjustedScore = (finding as any).adjusted?.score ?? cvss?.adjustedScore ?? risk?.adjusted?.score;
        const cvssVector = (finding as any).original?.vector ?? cvss?.vector ?? risk?.original?.vector;

        const copyToClipboard = (text: string) => {
            navigator.clipboard.writeText(text);
            toast.success('Copied to clipboard');
        };

        return (
            <div className={`bg-white rounded-xl transition-all duration-150 ${isOpen ? 'shadow-[0_4px_12px_rgba(0,0,0,0.08)]' : 'shadow-[0_1px_3px_rgba(0,0,0,0.05)]'}`}>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full hover:bg-[#F9FAFB] px-6 py-4 transition-colors duration-150 group rounded-t-xl"
                >
                    <div className="flex items-center justify-between w-full text-left">
                        <div className="flex items-center gap-4">
                            <SeverityPill severity={severity} />
                            <div className="flex flex-col items-start">
                                <span className="font-medium text-[#374151]">{title}</span>
                                {duplicateCount > 0 && (
                                    <span className="text-xs text-[#9CA3AF] mt-1">
                                        +{duplicateCount} more at lines {duplicateLines.join(', ')}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-sm text-[#6B7280]">
                                 <MapPin className="w-4 h-4" strokeWidth={1.5} />
                                 <span className="font-mono text-xs">{locationStr}</span>
                            </div>
                            
                            {/* CVSS Base Score */}
                            <div className="flex items-center gap-1">
                                <span className="text-xs text-[#9CA3AF]">CVSS (Base)</span>
                                <CVSSInfoPopover type="base" />
                                <Badge variant="outline" className="text-xs">
                                    {baseScore !== undefined ? Number(baseScore).toFixed(1) : '—'}
                                </Badge>
                                {cvssVector && baseScore !== undefined && (
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-blue-600 hover:text-blue-800">
                                                View
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-80">
                                            <div className="space-y-2">
                                                <h4 className="font-medium text-sm">CVSS Vector</h4>
                                                <code className="text-xs bg-muted p-2 rounded block">{cvssVector}</code>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                )}
                            </div>
                            
                            {/* Adjusted Score */}
                            <div className="flex items-center gap-1">
                                <span className="text-xs text-[#9CA3AF]">Adjusted</span>
                                <CVSSInfoPopover type="adjusted" />
                                {adjustedScore !== undefined ? (
                                    <Badge className={`text-xs px-2 py-1 ${getRiskLevelStyles(severity).badge}`}>
                                        {Number(adjustedScore).toFixed(1)}
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="text-xs">—</Badge>
                                )}
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
                                    <InfoBlock title="CWE Classification">
                                        <div className="flex items-center justify-between">
                                            <p><span className="font-semibold">{cweDisplayId}</span>: {normalizeText(cwe?.name) || 'Security Weakness'}</p>
                                            {cweLink && (
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm"
                                                    onClick={() => window.open(cweLink, '_blank')}
                                                >
                                                    <ExternalLink className="w-3 h-3" />
                                                </Button>
                                            )}
                                        </div>
                                    </InfoBlock>
                                )}
                                {owasp && (
                                    <InfoBlock title="OWASP Category">
                                        <p><span className="font-semibold">{normalizeText(owasp.category)}</span> – {normalizeText(owasp.title)}</p>
                                    </InfoBlock>
                                )}
                                
                                {/* Enhanced CVSS Scores with Calculation Details */}
                                {(baseScore !== undefined || adjustedScore !== undefined) && (
                                    <InfoBlock title="CVSS Calculation">
                                        <div className="space-y-3 bg-slate-50 p-3 rounded-md">
                                            {baseScore !== undefined && (
                                                <div className="flex justify-between items-center">
                                                    <span>Base Score:</span>
                                                    <span className={`font-semibold tabular-nums ${getCvssScoreColor(baseScore)}`}>
                                                        {Number(baseScore).toFixed(1)}
                                                    </span>
                                                </div>
                                            )}
                                            
                                            {cvssVector && (
                                                <div className="text-xs text-muted-foreground">
                                                    <div className="flex items-center gap-2">
                                                        <span>Vector:</span>
                                                        <code className="bg-white px-1 rounded text-xs">{cvssVector}</code>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => copyToClipboard(cvssVector)}
                                                        >
                                                            <Copy className="w-3 h-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {adjustedScore !== undefined && (
                                                <>
                                                    <div className="border-t pt-2">
                                                        <div className="text-xs text-muted-foreground mb-1">Adjustments:</div>
                                                        <div className="ml-2 space-y-1 text-xs">
                                                            <div className="flex justify-between">
                                                                <span>Additive:</span>
                                                                <span className="font-mono">{(risk?.adjusted?.adjustments?.additive || 0) > 0 ? `+${(risk?.adjusted?.adjustments?.additive || 0).toFixed(1)}` : (risk?.adjusted?.adjustments?.additive || 0).toFixed(1)}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span>Multiplier:</span>
                                                                <span className="font-mono">×{(risk?.adjusted?.adjustments?.multiplier || 1).toFixed(1)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="border-t pt-2">
                                                        <div className="text-xs text-muted-foreground mb-1">Formula:</div>
                                                        <code className="text-xs bg-white p-1 rounded block">
                                                            Adjusted = min(10.0, ({baseScore ? Number(baseScore).toFixed(1) : '0.0'} + {(risk?.adjusted?.adjustments?.additive || 0).toFixed(1)}) × {(risk?.adjusted?.adjustments?.multiplier || 1).toFixed(1)})
                                                        </code>
                                                        <div className="flex items-center justify-between mt-2 font-medium">
                                                            <span>Result:</span>
                                                            <span className={`font-mono tabular-nums ${getCvssScoreColor(adjustedScore)}`}>{Number(adjustedScore).toFixed(1)}</span>
                                                        </div>
                                                    </div>
                                                    
                                                    {baseScore && adjustedScore && Math.abs(baseScore - adjustedScore) < 0.1 && (
                                                        <div className="text-xs text-muted-foreground italic">
                                                            (no adjustments applied)
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </InfoBlock>
                                )}
                                
                                {/* Applied Factors */}
                                {((finding as any).factors?.applied?.length > 0 || (risk?.adjusted?.adjustments && Object.keys(risk.adjusted.adjustments).length > 0)) && (
                                    <InfoBlock title="Applied Factors">
                                        <div className="space-y-1">
                                            {(finding as any).factors?.applied?.map((factor, idx) => (
                                                <div key={idx} className="text-xs bg-orange-50 text-orange-800 px-2 py-1 rounded-md">
                                                    <span className="font-medium">{factor.name}</span>
                                                    {factor.impact && <span className="ml-1">— {factor.impact}</span>}
                                                </div>
                                            ))}
                                            {!(finding as any).factors?.applied?.length && risk?.adjusted?.adjustments && Object.entries(risk.adjusted.adjustments).map(([factor, value]) => (
                                                <div key={factor} className="text-xs bg-orange-50 text-orange-800 px-2 py-1 rounded-md">
                                                    <span className="font-medium">{factor}</span>: {typeof value === 'number' ? (value > 1 ? `×${value.toFixed(1)}` : `+${value.toFixed(1)}`) : String(value)}
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
                                        <div className="bg-[#F9FAFB] rounded-md p-3 relative">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="absolute top-2 right-2"
                                                onClick={() => copyToClipboard(vulnerableCode)}
                                            >
                                                <Copy className="w-3 h-3" />
                                            </Button>
                                            <pre className="text-xs font-mono text-[#374151] overflow-x-auto pr-8">
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
                                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                                        <p className="text-sm text-blue-900">{remediation}</p>
                                    </div>
                                </div>

                                {/* Enhanced Why it matters section */}
                                <div>
                                    <h4 className="text-[11px] font-semibold uppercase text-[#9CA3AF] mb-2 tracking-[0.05em]">Why This Matters</h4>
                                    <div className="bg-amber-50 border border-amber-200 rounded-md p-3 space-y-2">
                                        <p className="text-sm text-amber-900">
                                            This {severity.toLowerCase()} severity vulnerability could be exploited to compromise application security. 
                                            {baseScore && baseScore >= 7.0 && " With a high CVSS score, this should be prioritized for immediate remediation."}
                                            {duplicateCount > 0 && ` This pattern appears in ${duplicateCount + 1} locations, indicating a systematic issue that needs attention.`}
                                        </p>
                                        <div className="flex flex-wrap gap-2 pt-2">
                                            {cweDisplayId && cweLink && (
                                                <a
                                                    href={cweLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                                                >
                                                    Learn more about {cweDisplayId}
                                                    <ExternalLink className="h-3 w-3" />
                                                </a>
                                            )}
                                            {owasp && (
                                                <span className="text-xs text-muted-foreground">
                                                    OWASP Category: {normalizeText(owasp.category)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
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

export default function FindingsCard({ findings = [] }: { findings: any[] }) {
    if (!findings || findings.length === 0) {
        return (
             <div className="bg-white p-12 text-center rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h3 className="text-lg font-medium text-[#374151] mb-2">No Vulnerabilities Found</h3>
                <p className="text-[#6B7280]">Great! Your code appears to be secure. Keep following secure coding practices.</p>
            </div>
        );
    }

    const deduplicated = deduplicateFindings(findings);

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-medium uppercase tracking-wider text-[#6B7280]">Security Findings</h3>
                <div className="flex items-center gap-4 text-xs text-[#9CA3AF]">
                    <span>{deduplicated.length} unique issues</span>
                    {findings.length !== deduplicated.length && (
                        <span className="text-amber-600">({findings.length - deduplicated.length} duplicates collapsed)</span>
                    )}
                </div>
            </div>
            <div className="space-y-2 max-w-4xl">
                {deduplicated.map((finding, index) => (
                    <FindingItem finding={finding} key={finding.id || index} />
                ))}
            </div>
        </div>
    );
}