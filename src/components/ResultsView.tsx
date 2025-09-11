import { useState } from 'react';
import { ChevronDown, MapPin, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Vulnerability {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  file: string;
  line: number;
  cwe?: string;
  owasp?: string;
  cvssBase?: number;
  cvssAdjusted?: number;
  description?: string;
  vulnerableCode?: string;
  recommendation?: string;
}

interface ResultsViewProps {
  onScanAnother: () => void;
}

export const ResultsView = ({ onScanAnother }: ResultsViewProps) => {
  const [expandedVuln, setExpandedVuln] = useState<string | null>('vuln-001');

  const vulnerabilities: Vulnerability[] = [
    {
      id: 'vuln-001',
      title: 'Use of Hard-coded Credentials',
      severity: 'critical',
      file: 'code.js',
      line: 7,
      cwe: 'CWE-798: Use of Hard-coded Credentials',
      owasp: 'A07:2021 – Identification and Authentication Failures',
      cvssBase: 9.8,
      cvssAdjusted: 10.0,
      description: 'The software contains hard-coded credentials, such as a password or cryptographic key, which it uses for its own inbound authentication, outbound communication to external components, or encryption of internal data.',
      vulnerableCode: 'password = "supersecret"  # Hardcoded password (CWE-798)',
      recommendation: 'Store credentials in environment variables or secure configuration files outside the codebase. Use secure credential management systems like AWS Secrets Manager or HashiCorp Vault.'
    },
    {
      id: 'vuln-002',
      title: 'SQL Injection',
      severity: 'high',
      file: 'code.js',
      line: 11
    },
    {
      id: 'vuln-003',
      title: 'SQL Injection',
      severity: 'high',
      file: 'code.js',
      line: 11
    },
    {
      id: 'vuln-004',
      title: 'SQL Injection',
      severity: 'high',
      file: 'code.js',
      line: 11
    },
    {
      id: 'vuln-005',
      title: 'OS Command Injection',
      severity: 'critical',
      file: 'code.js',
      line: 21
    },
    {
      id: 'vuln-006',
      title: 'Code Injection',
      severity: 'critical',
      file: 'code.js',
      line: 23
    },
    {
      id: 'vuln-007',
      title: 'Code Injection',
      severity: 'critical',
      file: 'code.js',
      line: 25
    },
    {
      id: 'vuln-008',
      title: 'Use of Broken or Risky Cryptographic Algorithm',
      severity: 'high',
      file: 'code.js',
      line: 29
    },
    {
      id: 'vuln-009',
      title: 'Use of Cryptographically Weak Pseudo-Random Number Generator',
      severity: 'medium',
      file: 'code.js',
      line: 33
    }
  ];

  const getSeverityClass = (severity: string) => {
    return `severity-${severity}`;
  };

  const toggleExpanded = (vulnId: string) => {
    setExpandedVuln(expandedVuln === vulnId ? null : vulnId);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-2xl font-bold text-foreground">NEPERIA</div>
              <div className="text-sm text-muted-foreground">Code Guardian</div>
            </div>
            <Button 
              variant="ghost" 
              onClick={onScanAnother}
              className="text-muted-foreground hover:text-foreground"
            >
              Scan another file
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Risk Score */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              <div>
                <div className="text-8xl font-light text-foreground mb-2">100</div>
                <div className="text-sm text-muted-foreground">Critical Risk</div>
              </div>
            </div>
          </div>

          {/* Right Column - Analysis */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {/* Analysis Metrics */}
              <div className="bg-muted/30 rounded-lg p-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-4">ANALYSIS METRICS</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Scan Time</span>
                    <span className="text-sm text-foreground">N/A</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Rules Applied</span>
                    <span className="text-sm text-foreground">N/A</span>
                  </div>
                </div>
              </div>

              {/* Security Findings */}
              <div>
                <h2 className="text-sm font-medium text-muted-foreground mb-4">
                  SECURITY FINDINGS ({vulnerabilities.length})
                </h2>
                
                <div className="space-y-3">
                  {vulnerabilities.map((vuln) => (
                    <div 
                      key={vuln.id}
                      className={`border rounded-lg transition-all ${
                        expandedVuln === vuln.id ? 'border-ring' : 'border-border'
                      }`}
                    >
                      <div 
                        className="p-4 cursor-pointer"
                        onClick={() => toggleExpanded(vuln.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className={getSeverityClass(vuln.severity)}>
                              {vuln.severity}
                            </span>
                            <span className="font-medium text-foreground">{vuln.title}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="flex items-center text-sm text-muted-foreground">
                              <MapPin className="w-3 h-3 mr-1" />
                              {vuln.file}:{vuln.line}
                            </div>
                            <ChevronDown 
                              className={`w-4 h-4 text-muted-foreground transition-transform ${
                                expandedVuln === vuln.id ? 'rotate-180' : ''
                              }`} 
                            />
                          </div>
                        </div>
                      </div>

                      {expandedVuln === vuln.id && vuln.cwe && (
                        <div className="px-4 pb-4 border-t border-border">
                          <div className="pt-4 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <div className="font-medium text-foreground mb-1">CWE</div>
                                <div className="text-muted-foreground">{vuln.cwe}</div>
                              </div>
                              <div>
                                <div className="font-medium text-foreground mb-1">DESCRIPTION</div>
                                <div className="text-muted-foreground">{vuln.description}</div>
                              </div>
                            </div>

                            <div>
                              <div className="font-medium text-foreground mb-1">OWASP</div>
                              <div className="text-muted-foreground">{vuln.owasp}</div>
                            </div>

                            {vuln.vulnerableCode && (
                              <div>
                                <div className="font-medium text-foreground mb-2">VULNERABLE CODE</div>
                                <div className="bg-muted/50 rounded-md p-3 font-mono text-sm text-foreground">
                                  {vuln.vulnerableCode}
                                </div>
                              </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <div className="font-medium text-foreground mb-1">CVSS SCORE</div>
                                <div className="text-sm text-muted-foreground">
                                  <div>Base: {vuln.cvssBase}</div>
                                  <div>Adjusted: {vuln.cvssAdjusted}</div>
                                </div>
                              </div>
                            </div>

                            {vuln.recommendation && (
                              <div>
                                <div className="flex items-center font-medium text-foreground mb-2">
                                  <span className="w-2 h-2 bg-accent rounded-full mr-2"></span>
                                  RECOMMENDED FIX
                                </div>
                                <div className="text-sm text-muted-foreground pl-4">
                                  {vuln.recommendation}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Export Report */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-4">EXPORT REPORT</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-muted/30 rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="font-medium text-foreground mb-1">Executive PDF</div>
                    <div className="text-xs text-muted-foreground">High-level summary for management.</div>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="font-medium text-foreground mb-1">Technical HTML</div>
                    <div className="text-xs text-muted-foreground">Detailed findings for developers.</div>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="font-medium text-foreground mb-1">JSON Data</div>
                    <div className="text-xs text-muted-foreground">Raw data for automation and BI.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2">
        <div className="text-sm text-muted-foreground">
          © 2025 Neperia. All rights reserved.
        </div>
      </div>
    </div>
  );
};