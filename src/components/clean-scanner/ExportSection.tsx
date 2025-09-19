import React from 'react';

interface RiskAssessment {
    riskScore?: number;
    riskLevel?: string;
}

interface ExportSectionProps {
    findings?: any[];
    riskAssessment?: RiskAssessment;
    performance?: { scanTime?: number; rulesExecuted?: number };
    metadata?: any;
}

export default function ExportSection({ findings = [], riskAssessment = {}, performance = {}, metadata = {} }: ExportSectionProps) {
  const { riskScore = 0, riskLevel = 'N/A' } = riskAssessment;

  const downloadReport = (format) => {
    const timestamp = new Date().toLocaleDateString();
    
    // FIX: Re-style HTML and PDF exports to match minimal UI
    const minimalStyles = `
        body { font-family: 'Inter', sans-serif; line-height: 1.6; color: #374151; background-color: #FFFFFF; max-width: 1200px; margin: 0 auto; padding: 48px; }
        h1, h2, h3 { color: #374151; font-weight: 600; }
        h1 { font-size: 24px; }
        h2 { font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #6B7280; border-bottom: 1px solid #E5E7EB; padding-bottom: 8px; margin-top: 48px; }
        .header { margin-bottom: 48px; }
        .section { margin-top: 32px; }
        .finding { border: 1px solid #E5E7EB; border-radius: 8px; padding: 24px; margin-top: 16px; }
        .pill { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 500; }
        .pill-critical { background: #FEE2E2; color: #DC2626; }
        .pill-high { background: #FED7AA; color: #EA580C; }
        .pill-medium { background: #FEF3C7; color: #D97706; }
        .pill-low { background: #DBEAFE; color: #2563EB; }
        .code { background: #F9FAFB; padding: 12px; border-radius: 6px; font-family: 'Monaco', 'Consolas', monospace; font-size: 12px; overflow-x: auto; margin: 12px 0; border: 1px solid #E5E7EB; }
        .meta { display: flex; gap: 24px; margin-bottom: 16px; }
        .meta-item { display: flex; flex-direction: column; }
        .meta-label { font-size: 12px; color: #6B7280; }
        .meta-value { font-size: 18px; font-weight: 600; }
    `;
    
    // Helpers
    const normalizeSeverity = (sev: any) => {
      if (!sev) return 'Low';
      const s = String(sev).toLowerCase();
      if (['critical', 'crit', 'error', 'severe'].includes(s)) return 'Critical';
      if (['high', 'major'].includes(s)) return 'High';
      if (['medium', 'moderate', 'warn', 'warning'].includes(s)) return 'Medium';
      if (['low', 'minor', 'info', 'informational'].includes(s)) return 'Low';
      // Fallback: capitalize first letter
      return s ? s.charAt(0).toUpperCase() + s.slice(1) : 'Low';
    };

    const sevCount = (level: 'Critical' | 'High' | 'Medium' | 'Low') =>
      findings.filter((f) => normalizeSeverity(f?.severity) === level).length;

    const escapeHTML = (str: any) =>
      typeof str === 'string' ? str.replace(/</g, '&lt;').replace(/>/g, '&gt;') : str;

    if (format === 'json') {
        const jsonReport = {
          riskAssessment,
          findings,
          metadata: {
            exportDate: new Date().toISOString()
          }
        };
        const blob = new Blob([JSON.stringify(jsonReport, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `neperia-security-report-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } else if (format === 'html' || format === 'pdf') { // Combine for styling
      let reportContent;
      if (format === 'html') {
          // TECHNICAL HTML REPORT
          reportContent = `
            <h2>Detailed Security Findings</h2>
            ${findings.map((finding, index) => {
              const { severity = 'Medium', title, message, description, cwe, owasp, cvss, location, code, remediation } = finding;
              const { file, line } = location || {};
              // FIX: CWE-CWE- issue
              const cweDisplayId = cwe?.id ? (String(cwe.id).startsWith('CWE-') ? cwe.id : `CWE-${cwe.id}`) : 'N/A';
              
              return `
                <div class="finding">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                        <h3>${index + 1}. ${title || message}</h3>
                        <span class="pill pill-${severity.toLowerCase()}">${severity}</span>
                    </div>
                    <div style="font-size: 12px; color: #6B7280; font-family: 'Monaco', monospace; margin-top: 4px;">${file || 'N/A'}:${line || 'N/A'}</div>
                    <p style="margin-top: 16px;">${description || message}</p>
                    
                    ${code ? `
                    <h4 style="font-size: 12px; color: #6B7280; margin-top: 16px; font-weight: 500;">Vulnerable Code</h4>
                    <div class="code">${code.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
                    ` : ''}

                    <h4 style="font-size: 12px; color: #6B7280; margin-top: 16px; font-weight: 500;">Remediation</h4>
                    <p>${remediation?.strategy || remediation || (title?.toLowerCase().includes('command injection') || title?.toLowerCase().includes('os command') ? 'Use parameterized commands or shell escape functions. Avoid direct shell execution with user input. Implement input validation and use safe system call alternatives like execve() with proper argument arrays.' : 'Review and apply security best practices.')}</p>
                    
                    <div style="border-top: 1px solid #E5E7EB; margin-top: 24px; padding-top: 16px; display: flex; gap: 32px; font-size: 14px;">
                        ${cweDisplayId !== 'N/A' ? `<div><strong>CWE:</strong> ${cweDisplayId} - ${cwe.name}</div>` : ''}
                        ${owasp ? `<div><strong>OWASP:</strong> ${owasp.category}</div>` : ''}
                        ${cvss?.baseScore ? `<div><strong>CVSS:</strong> ${cvss.baseScore.toFixed(1)}</div>` : ''}
                    </div>
                </div>
              `;
            }).join('')}
          `;
      } else {
          // COMPREHENSIVE PDF REPORT WITH ALL SCAN INFORMATION
          reportContent = `
            <h2>Executive Summary</h2>
            <div class="meta">
                <div class="meta-item"><span class="meta-label">Risk Level</span><span class="meta-value">${riskLevel}</span></div>
                <div class="meta-item"><span class="meta-label">Risk Score</span><span class="meta-value">${riskScore.toFixed(0)}/100</span></div>
                <div class="meta-item"><span class="meta-label">Total Findings</span><span class="meta-value">${findings.length}</span></div>
            </div>
            <div style="margin-top: 32px;">
                <p>Security assessment completed on ${timestamp}. The overall risk level has been determined as <strong>${riskLevel}</strong>. Prioritize remediation for Critical and High severity findings.</p>
            </div>
            
            <h2>Findings by Severity</h2>
            <div style="display: flex; gap: 16px; margin-bottom: 32px;">
                <div class="meta-item"><span class="meta-label">Critical</span><span class="meta-value">${sevCount('Critical')}</span></div>
                <div class="meta-item"><span class="meta-label">High</span><span class="meta-value">${sevCount('High')}</span></div>
                <div class="meta-item"><span class="meta-label">Medium</span><span class="meta-value">${sevCount('Medium')}</span></div>
                <div class="meta-item"><span class="meta-label">Low</span><span class="meta-value">${sevCount('Low')}</span></div>
            </div>
            
            <h2>Detailed Security Findings</h2>
            ${findings.map((finding, index) => {
              const { severity = 'Medium', title, message, description, cwe, owasp, cvss, location, code, extractedCode, codeSnippet: cs, extra, remediation } = finding;
              const vulnCode = code || extractedCode || cs || (extra && extra.lines);
              const { file, line } = location || {};
              const cweDisplayId = cwe?.id ? (String(cwe.id).startsWith('CWE-') ? cwe.id : `CWE-${cwe.id}`) : 'N/A';
              
              return `
                <div class="finding">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                        <h3>${index + 1}. ${title || message}</h3>
                        <span class="pill pill-${severity.toLowerCase()}">${severity}</span>
                    </div>
                    <div style="font-size: 12px; color: #6B7280; font-family: 'Monaco', monospace; margin-top: 4px;">${file || 'N/A'}:${line || 'N/A'}</div>
                    <p style="margin-top: 16px;">${description || message}</p>
                    
                    ${code ? `
                    <h4 style="font-size: 12px; color: #6B7280; margin-top: 16px; font-weight: 500;">Vulnerable Code</h4>
                    <div class="code">${code.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
                    ` : ''}

                    <h4 style="font-size: 12px; color: #6B7280; margin-top: 16px; font-weight: 500;">Remediation</h4>
                    <p>${remediation?.strategy || remediation || (title?.toLowerCase().includes('command injection') || title?.toLowerCase().includes('os command') ? 'Use parameterized commands or shell escape functions. Avoid direct shell execution with user input. Implement input validation and use safe system call alternatives like execve() with proper argument arrays.' : 'Review and apply security best practices.')}</p>
                    
                    <div style="border-top: 1px solid #E5E7EB; margin-top: 24px; padding-top: 16px; display: flex; gap: 32px; font-size: 14px; flex-wrap: wrap;">
                        ${cweDisplayId !== 'N/A' ? `<div><strong>CWE:</strong> ${cweDisplayId}${cwe?.name ? ` - ${cwe.name}` : ''}</div>` : ''}
                        ${owasp ? `<div><strong>OWASP:</strong> ${owasp.category}</div>` : ''}
                        ${cvss?.baseScore ? `<div><strong>CVSS:</strong> ${cvss.baseScore.toFixed(1)}</div>` : ''}
                    </div>
                </div>
              `;
            }).join('')}
          `;
      }
      
      const fullHtml = `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>Neperia Security Report</title>
            <link rel="stylesheet" href="https://rsms.me/inter/inter.css">
            <style>${minimalStyles}</style>
        </head>
        <body>
            <div class="header">
                <h1 style="font-weight: 600;">NEPERIA Code Guardian</h1>
                <p style="color: #6B7280;">Security Report - Generated ${timestamp}</p>
            </div>
            ${reportContent}
        </body>
        </html>`;

      const blob = new Blob([fullHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `neperia-${format}-report-${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  if (!findings.length) return null;

  return (
    <div>
      <h3 className="text-sm font-medium uppercase tracking-wider text-[#6B7280] mb-4">Export Report</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <button onClick={() => downloadReport('pdf')} className="w-full text-left p-4 rounded-xl transition-all duration-150 bg-white hover:bg-[#F9FAFB] shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                <h4 className="font-semibold text-[#374151]">Executive PDF</h4>
                <p className="text-xs text-[#9CA3AF]">High-level summary for management.</p>
            </button>
            <button onClick={() => downloadReport('html')} className="w-full text-left p-4 rounded-xl transition-all duration-150 bg-white hover:bg-[#F9FAFB] shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                <h4 className="font-semibold text-[#374151]">Technical HTML</h4>
                <p className="text-xs text-[#9CA3AF]">Detailed findings for developers.</p>
            </button>
            <button onClick={() => downloadReport('json')} className="w-full text-left p-4 rounded-xl transition-all duration-150 bg-white hover:bg-[#F9FAFB] shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                <h4 className="font-semibold text-[#374151]">JSON Data</h4>
                <p className="text-xs text-[#9CA3AF]">Raw data for automation and BI.</p>
            </button>
        </div>
    </div>
  );
}