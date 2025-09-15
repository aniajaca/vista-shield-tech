import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Code, Download } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  findings: any[];
  riskAssessment: any;
}

export default function ExportModal({ 
  isOpen, 
  onClose, 
  findings, 
  riskAssessment 
}: ExportModalProps) {

  const generateExecutivePDF = () => {
    // Implementation for executive PDF export
    console.log('Generating executive PDF...');
    // This would integrate with a PDF generation library
  };

  const generateTechnicalHTML = () => {
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Security Assessment Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; margin: 40px; }
        .header { border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 30px; }
        .severity-critical { background: #fee2e2; color: #dc2626; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
        .severity-high { background: #fed7aa; color: #ea580c; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
        .severity-medium { background: #fef3c7; color: #d97706; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
        .severity-low { background: #dbeafe; color: #2563eb; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
        .finding { margin: 20px 0; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; }
        .code { background: #f9fafb; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Security Assessment Report</h1>
        <p>Generated on ${new Date().toLocaleDateString()}</p>
        <p>Risk Score: ${riskAssessment.riskScore || 0}/100 (${riskAssessment.riskLevel || 'Unknown'} Risk)</p>
        <p>Total Findings: ${findings.length}</p>
    </div>
    
    ${findings.map((finding, index) => `
        <div class="finding">
            <h3>Finding #${index + 1}: ${finding.title || finding.name || 'Security Issue'}</h3>
            <p><span class="severity-${finding.severity?.toLowerCase() || 'info'}">${finding.severity || 'Unknown'}</span></p>
            <p><strong>Description:</strong> ${finding.description || finding.message || 'No description available'}</p>
            ${finding.remediation ? `<p><strong>Remediation:</strong> ${typeof finding.remediation === 'object' ? finding.remediation.description || finding.remediation.guidance || 'See security guidelines' : finding.remediation}</p>` : ''}
            ${finding.code || finding.snippet ? `<div class="code">${finding.code || finding.snippet}</div>` : ''}
            <p><strong>Location:</strong> ${finding.location?.path || finding.file || 'Unknown'}${finding.location?.line || finding.startLine ? `:${finding.location?.line || finding.startLine}` : ''}</p>
        </div>
    `).join('')}
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security-report-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateJSON = () => {
    const data = {
      metadata: {
        generatedAt: new Date().toISOString(),
        riskAssessment,
        totalFindings: findings.length
      },
      findings: findings.map(finding => ({
        title: finding.title || finding.name || finding.check_id,
        severity: finding.severity,
        adjustedScore: finding.adjustedScore,
        cvssBaseScore: finding.cvss?.baseScore,
        description: finding.description || finding.message,
        location: {
          file: finding.location?.path || finding.file,
          line: finding.location?.line || finding.startLine
        },
        cwe: finding.cwe,
        owasp: finding.owasp,
        remediation: finding.remediation,
        code: finding.code || finding.snippet
      }))
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Export Security Report</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6 text-center">
              <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Executive PDF</h3>
              <p className="text-sm text-muted-foreground mb-4">
                <strong>Management summary</strong> with top 5 issues
              </p>
              <Button onClick={generateExecutivePDF} className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Generate PDF
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Code className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Technical HTML</h3>
              <p className="text-sm text-muted-foreground mb-4">
                <strong>Full findings & remediation details</strong> for developers
              </p>
              <Button onClick={generateTechnicalHTML} className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Generate HTML
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-semibold mb-2">JSON Data</h3>
              <p className="text-sm text-muted-foreground mb-4">
                <strong>Raw structured data</strong> for automation
              </p>
              <Button onClick={generateJSON} className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Generate JSON
              </Button>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}