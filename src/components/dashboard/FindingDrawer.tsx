import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Copy, 
  ExternalLink, 
  CheckCircle, 
  AlertTriangle, 
  Code, 
  Lightbulb,
  MapPin,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Finding {
  title?: string;
  name?: string;
  check_id?: string;
  message?: string;
  severity: string;
  adjustedScore?: number;
  cvss?: { baseScore?: number; vector?: string };
  file?: string;
  location?: { path?: string; line?: number };
  startLine?: number;
  line?: number;
  cwe?: { id?: string | number; name?: string; description?: string };
  owasp?: { category?: string; title?: string };
  description?: string;
  remediation?: any;
  code?: string;
  extractedCode?: string;
  codeSnippet?: string;
  snippet?: string;
  extra?: { lines?: string };
  risk?: { adjusted?: { adjustments?: Record<string, any> } };
  businessImpact?: string;
}

interface FindingDrawerProps {
  finding: Finding | null;
  isOpen: boolean;
  onClose: () => void;
}

const SeverityChip = ({ severity }: { severity: string }) => {
  const severityConfig = {
    critical: 'severity-critical',
    high: 'severity-high', 
    medium: 'severity-medium',
    low: 'severity-low',
    info: 'severity-info'
  };

  const className = severityConfig[severity?.toLowerCase()] || 'severity-info';

  return (
    <span className={className}>
      {severity || 'Unknown'}
    </span>
  );
};

const PriorityBadge = ({ adjustedScore }: { adjustedScore: number }) => {
  let priority = 'P4';
  let className = 'bg-slate-100 text-slate-700';

  if (adjustedScore >= 9) {
    priority = 'P0';
    className = 'bg-red-100 text-red-800 border-red-200';
  } else if (adjustedScore >= 7) {
    priority = 'P1';
    className = 'bg-orange-100 text-orange-800 border-orange-200';
  } else if (adjustedScore >= 5) {
    priority = 'P2';
    className = 'bg-yellow-100 text-yellow-800 border-yellow-200';
  } else if (adjustedScore >= 3) {
    priority = 'P3';
    className = 'bg-blue-100 text-blue-800 border-blue-200';
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${className}`}>
      {priority}
    </span>
  );
};

const CategoryChip = ({ finding }: { finding: Finding }) => {
  // Map CWE/OWASP to common categories
  const getCategoryFromFinding = (finding: Finding) => {
    const cweId = finding.cwe?.id?.toString().replace('CWE-', '');
    const owaspCategory = finding.owasp?.category?.toLowerCase();
    
    // Common XSS CWEs
    if (['79', '80', '83', '85', '87'].includes(cweId)) return 'XSS';
    // SQL Injection CWEs
    if (['89', '564'].includes(cweId)) return 'SQLi';
    // Command Injection
    if (['77', '78', '88'].includes(cweId)) return 'Command Injection';
    // Path Traversal
    if (['22', '23', '36'].includes(cweId)) return 'Path Traversal';
    // Insecure Deserialization
    if (['502'].includes(cweId)) return 'Insecure Deserialization';
    // Authentication issues
    if (['287', '290', '293', '295'].includes(cweId)) return 'Auth Bypass';
    // Authorization issues  
    if (['285', '862', '863'].includes(cweId)) return 'Access Control';
    // Crypto issues
    if (['327', '328', '329', '330'].includes(cweId)) return 'Weak Crypto';
    // CSRF
    if (['352'].includes(cweId)) return 'CSRF';
    
    // OWASP mappings
    if (owaspCategory?.includes('injection')) return 'Injection';
    if (owaspCategory?.includes('xss')) return 'XSS';
    if (owaspCategory?.includes('auth')) return 'Auth Issue';
    if (owaspCategory?.includes('access')) return 'Access Control';
    if (owaspCategory?.includes('crypto')) return 'Weak Crypto';
    
    // Fallback to CWE or general category
    if (finding.cwe?.id) return `CWE-${cweId}`;
    return 'Security Issue';
  };

  const category = getCategoryFromFinding(finding);
  
  // Color coding for categories
  const getCategoryColor = (category: string) => {
    const colorMap: Record<string, string> = {
      'XSS': 'bg-red-100 text-red-700 border-red-200',
      'SQLi': 'bg-purple-100 text-purple-700 border-purple-200', 
      'Command Injection': 'bg-orange-100 text-orange-700 border-orange-200',
      'Path Traversal': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'Insecure Deserialization': 'bg-pink-100 text-pink-700 border-pink-200',
      'Auth Bypass': 'bg-indigo-100 text-indigo-700 border-indigo-200',
      'Access Control': 'bg-blue-100 text-blue-700 border-blue-200',
      'Weak Crypto': 'bg-emerald-100 text-emerald-700 border-emerald-200',
      'CSRF': 'bg-rose-100 text-rose-700 border-rose-200',
      'Injection': 'bg-violet-100 text-violet-700 border-violet-200'
    };
    
    return colorMap[category] || 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${getCategoryColor(category)}`}>
      {category}
    </span>
  );
};

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

export default function FindingDrawer({ finding, isOpen, onClose }: FindingDrawerProps) {
  const [showCodeSample, setShowCodeSample] = useState(false);
  const [showEvidence, setShowEvidence] = useState(false);
  const { toast } = useToast();

  if (!finding) return null;

  const title = toText(finding.title || finding.name || finding.check_id || finding.message) || "Security Vulnerability";
  const description = toText(finding.cwe?.description ?? finding.description ?? finding.message) || 'Security vulnerability detected';
  
  // Handle remediation
  let remediation = '';
  let remediationSteps: string[] = [];
  
  if (finding.remediation) {
    if (typeof finding.remediation === 'object') {
      remediation = toText(finding.remediation.description || finding.remediation.guidance || finding.remediation.text || finding.remediation);
    } else {
      remediation = toText(finding.remediation);
    }
  }
  if (!remediation) remediation = 'Review and apply security best practices for this vulnerability type.';
  
  // Extract steps from remediation text
  const sentences = remediation.split(/[.!?]+/).filter(s => s.trim().length > 0);
  remediationSteps = sentences.slice(0, 3).map(s => s.trim());

  // Handle file location
  const location = finding.location;
  const filePath = location?.path || finding.file || "Unknown file";
  const lineNumber = location?.line || finding.startLine || finding.line;
  const locationStr = lineNumber ? `${filePath}:${lineNumber}` : filePath;

  // Handle vulnerable code
  const vulnerableCode = toText(finding.snippet || finding.code || finding.extractedCode || finding.codeSnippet || finding.extra?.lines) || '';

  const cweDisplayId = finding.cwe?.id ? (String(finding.cwe.id).startsWith('CWE-') ? finding.cwe.id : `CWE-${finding.cwe.id}`) : null;
  const adjustedScore = finding.adjustedScore || finding.cvss?.baseScore || 0;

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: `${type} copied successfully`,
    });
  };

  const copyRemediation = () => {
    copyToClipboard(remediation, "Remediation guide");
  };

  const copyTicketSummary = () => {
    const summary = `Security Issue: ${title}

Severity: ${finding.severity}
Score: ${adjustedScore.toFixed(1)}
Location: ${locationStr}

Description:
${description}

Remediation:
${remediation}

Standards:
${cweDisplayId ? `CWE: ${cweDisplayId}` : ''}
${finding.owasp?.category ? `OWASP: ${finding.owasp.category}` : ''}`;
    
    copyToClipboard(summary, "Ticket summary");
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[500px] sm:w-[600px] overflow-y-auto">
        <SheetHeader className="pb-6">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <SheetTitle className="text-lg leading-6 mb-2">{title}</SheetTitle>
              <div className="flex items-center gap-2 mb-3">
                <SeverityChip severity={finding.severity} />
                <PriorityBadge adjustedScore={adjustedScore} />
                <CategoryChip finding={finding} />
                <Badge variant="outline" className="tabular-nums">
                  Score: {adjustedScore.toFixed(1)}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span className="font-mono">{locationStr}</span>
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6">
          {/* Why it matters */}
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Why it matters
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {description}
            </p>
            <p className="text-xs text-muted-foreground/80 italic mt-2">
              Even medium findings can reveal systemic issues.
            </p>
            {finding.businessImpact && (
              <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                <strong>Business Impact:</strong> {finding.businessImpact}
              </p>
            )}
          </div>

          <Separator />

          {/* How to fix */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-green-500" />
              How to fix
            </h3>
            <div className="space-y-2">
              {remediationSteps.map((step, index) => (
                <div key={index} className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center mt-0.5 flex-shrink-0">
                    {index + 1}
                  </span>
                  <p className="text-sm text-muted-foreground">{step}</p>
                </div>
              ))}
            </div>
            
            {vulnerableCode && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCodeSample(!showCodeSample)}
                className="mt-3"
              >
                <Code className="w-4 h-4 mr-2" />
                {showCodeSample ? 'Hide' : 'Show'} code sample
                {showCodeSample ? <ChevronDown className="w-4 h-4 ml-2" /> : <ChevronRight className="w-4 h-4 ml-2" />}
              </Button>
            )}
            
            {showCodeSample && vulnerableCode && (
              <div className="mt-3 bg-muted rounded-md p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">Example Fix</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(vulnerableCode, "Code sample")}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <pre className="text-xs font-mono overflow-x-auto">
                  <code>{vulnerableCode}</code>
                </pre>
              </div>
            )}
          </div>

          <Separator />

          {/* Evidence */}
          {vulnerableCode && (
            <div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEvidence(!showEvidence)}
                className="mb-3"
              >
                <Code className="w-4 h-4 mr-2" />
                Evidence (code snippet)
                {showEvidence ? <ChevronDown className="w-4 h-4 ml-2" /> : <ChevronRight className="w-4 h-4 ml-2" />}
              </Button>
              
              {showEvidence && (
                <div className="bg-muted rounded-md p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-muted-foreground">Vulnerable Code</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(vulnerableCode, "Code evidence")}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <pre className="text-xs font-mono overflow-x-auto">
                    <code>{vulnerableCode}</code>
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Context impact badges */}
          {finding.risk?.adjusted?.adjustments && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-3">Context Impact</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(finding.risk.adjusted.adjustments).map(([factor, value]) => (
                    <Tooltip key={factor}>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className="cursor-help">
                          {factor}: {typeof value === 'number' ? (value > 1 ? `×${value.toFixed(1)}` : `+${value.toFixed(1)}`) : String(value)}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Environmental factor that affected the risk score</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Standards */}
          <div>
            <h3 className="font-semibold mb-3">Standards</h3>
            <div className="space-y-2">
              {cweDisplayId && (
                <div className="flex items-center justify-between">
                  <span className="text-sm">CWE</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono">
                      {cweDisplayId}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(`https://cwe.mitre.org/data/definitions/${finding.cwe?.id?.toString().replace('CWE-', '')}.html`, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
              {finding.owasp?.category && (
                <div className="flex items-center justify-between">
                  <span className="text-sm">OWASP</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {finding.owasp.category}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open('https://owasp.org/www-project-top-ten/', '_blank')}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
              {finding.cvss?.vector && (
                <div className="flex items-center justify-between">
                  <span className="text-sm">CVSS Vector</span>
                  <span className="text-xs font-mono text-muted-foreground">{finding.cvss.vector}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button variant="outline" onClick={copyRemediation}>
              <Copy className="w-4 h-4 mr-2" />
              Copy remediation
            </Button>
            <Button variant="outline" onClick={copyTicketSummary}>
              <Copy className="w-4 h-4 mr-2" />
              Copy ticket summary
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}