import { useState } from 'react';
import { ChevronDown, MapPin } from 'lucide-react';
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

  const getSeverityBadge = (severity: string) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium";
    switch (severity) {
      case 'critical':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'high':
        return `${baseClasses} bg-orange-100 text-orange-800`;
      case 'medium':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'low':
        return `${baseClasses} bg-green-100 text-green-800`;
      default:
        return `${baseClasses} bg-blue-100 text-blue-800`;
    }
  };

  const toggleExpanded = (vulnId: string) => {
    setExpandedVuln(expandedVuln === vulnId ? null : vulnId);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-baseline space-x-2">
              <div className="text-lg font-semibold text-gray-900">NEPERIA</div>
              <div className="text-sm text-gray-500">Code Guardian</div>
            </div>
            <Button 
              variant="ghost" 
              onClick={onScanAnother}
              className="text-gray-600 hover:text-gray-900"
            >
              Scan another file
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-8 py-8">
        <div className="flex space-x-16">
          {/* Left Column - Risk Score */}
          <div className="flex-shrink-0">
            <div className="space-y-2">
              <div className="text-8xl font-light text-gray-900">100</div>
              <div className="text-sm text-gray-500">Critical Risk</div>
            </div>
          </div>

          {/* Right Column - Analysis */}
          <div className="flex-1 space-y-8">
            {/* Analysis Metrics */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-xs font-medium text-gray-500 mb-4 tracking-wide">ANALYSIS METRICS</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Scan Time</span>
                  <span className="text-sm text-gray-900">N/A</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Rules Applied</span>
                  <span className="text-sm text-gray-900">N/A</span>
                </div>
              </div>
            </div>

            {/* Security Findings */}
            <div>
              <h2 className="text-xs font-medium text-gray-500 mb-4 tracking-wide">
                SECURITY FINDINGS ({vulnerabilities.length})
              </h2>
              
              <div className="space-y-2">
                {vulnerabilities.map((vuln) => (
                  <div 
                    key={vuln.id}
                    className={`border rounded-lg transition-all ${
                      expandedVuln === vuln.id ? 'border-blue-300' : 'border-gray-200'
                    }`}
                  >
                    <div 
                      className="p-4 cursor-pointer hover:bg-gray-50"
                      onClick={() => toggleExpanded(vuln.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className={getSeverityBadge(vuln.severity)}>
                            {vuln.severity}
                          </span>
                          <span className="font-medium text-gray-900">{vuln.title}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center text-sm text-gray-500">
                            <MapPin className="w-3 h-3 mr-1" />
                            {vuln.file}:{vuln.line}
                          </div>
                          <ChevronDown 
                            className={`w-4 h-4 text-gray-400 transition-transform ${
                              expandedVuln === vuln.id ? 'rotate-180' : ''
                            }`} 
                          />
                        </div>
                      </div>
                    </div>

                    {expandedVuln === vuln.id && vuln.cwe && (
                      <div className="px-4 pb-4 border-t border-gray-200">
                        <div className="pt-4 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                            <div>
                              <div className="font-medium text-gray-900 mb-1">CWE</div>
                              <div className="text-gray-600">{vuln.cwe}</div>
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 mb-1">DESCRIPTION</div>
                              <div className="text-gray-600">{vuln.description}</div>
                            </div>
                          </div>

                          <div>
                            <div className="font-medium text-gray-900 mb-1">OWASP</div>
                            <div className="text-gray-600">{vuln.owasp}</div>
                          </div>

                          {vuln.vulnerableCode && (
                            <div>
                              <div className="font-medium text-gray-900 mb-2">VULNERABLE CODE</div>
                              <div className="bg-gray-100 rounded-md p-3 font-mono text-sm text-gray-900">
                                {vuln.vulnerableCode}
                              </div>
                            </div>
                          )}

                          <div>
                            <div className="font-medium text-gray-900 mb-1">CVSS SCORE</div>
                            <div className="text-sm text-gray-600">
                              <div>Base: {vuln.cvssBase}</div>
                              <div>Adjusted: {vuln.cvssAdjusted}</div>
                            </div>
                          </div>

                          {vuln.recommendation && (
                            <div>
                              <div className="flex items-center font-medium text-gray-900 mb-2">
                                <span className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></span>
                                RECOMMENDED FIX
                              </div>
                              <div className="text-sm text-gray-600 pl-4">
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
              <h3 className="text-xs font-medium text-gray-500 mb-4 tracking-wide">EXPORT REPORT</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4 cursor-pointer hover:bg-gray-100 transition-colors">
                  <div className="font-medium text-gray-900 mb-1">Executive PDF</div>
                  <div className="text-xs text-gray-500">High-level summary for management.</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 cursor-pointer hover:bg-gray-100 transition-colors">
                  <div className="font-medium text-gray-900 mb-1">Technical HTML</div>
                  <div className="text-xs text-gray-500">Detailed findings for developers.</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 cursor-pointer hover:bg-gray-100 transition-colors">
                  <div className="font-medium text-gray-900 mb-1">JSON Data</div>
                  <div className="text-xs text-gray-500">Raw data for automation and BI.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2">
        <div className="text-sm text-gray-400">
          © 2025 Neperia. All rights reserved.
        </div>
      </div>
    </div>
  );
};