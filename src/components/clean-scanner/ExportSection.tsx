import React from 'react';

interface RiskAssessment {
    riskScore?: number;
    riskLevel?: string;
}

interface ExportSectionProps {
    findings?: any[];
    riskAssessment?: RiskAssessment;
    performance?: { scanTime?: number };
    metadata?: any;
}

function getCweInfo(cwe: any) {
  const id = typeof cwe === 'string' ? cwe : cwe?.id || 'N/A';
  const rawName = typeof cwe === 'object' ? cwe?.name || '' : '';
  const name = rawName && !/^CWE[\s#-]*\d+$/i.test(rawName) ? rawName : '';
  return { id, name };
}

function getOwaspDisplay(owasp: any): string {
  if (Array.isArray(owasp) && owasp.length > 0) {
    // Fix 7: Show all OWASP entries sorted by year desc
    const sorted = [...owasp].sort((a, b) => {
      const yearA = a.match?.(/:(\d{4})/)?.[1] || '0';
      const yearB = b.match?.(/:(\d{4})/)?.[1] || '0';
      return parseInt(yearB) - parseInt(yearA);
    });
    return sorted.join(', ');
  }
  if (owasp?.category) return owasp.category;
  return '';
}

function escapeHtml(str: string): string {
  return str.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function cleanTitle(raw: string): string {
  if (!raw) return 'Security Vulnerability';
  return raw
    .replace(/^(javascript|python|java|go|ruby|php|csharp|typescript|express|flask|django|lang|security|audit)\./gi, '')
    .replace(/\./g, ' ')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .replace(/\s+/g, ' ')
    .trim() || 'Security Vulnerability';
}

function deriveRiskLevel(findings: any[]): string {
  const normSev = (sev: any) => {
    if (!sev) return 'Low';
    const s = String(sev).toLowerCase();
    if (['critical', 'crit', 'error', 'severe'].includes(s)) return 'Critical';
    if (['high', 'major'].includes(s)) return 'High';
    if (['medium', 'moderate', 'warn', 'warning'].includes(s)) return 'Medium';
    return 'Low';
  };
  const order: Array<'Critical' | 'High' | 'Medium' | 'Low'> = ['Critical', 'High', 'Medium', 'Low'];
  const severities = new Set(findings.map(f => normSev(f?.adjustedSeverity || f?.severity)));
  return order.find(s => severities.has(s)) || 'Low';
}

// Fix 5: Generate SARIF 2.1.0 output
function generateSarif(findings: any[], riskAssessment: any): object {
  const rules: Record<string, any> = {};
  const results: any[] = [];

  findings.forEach((f, i) => {
    const ruleId = f.ruleId || `neperia-finding-${i}`;
    if (!rules[ruleId]) {
      const cweInfo = getCweInfo(f.cwe);
      rules[ruleId] = {
        id: ruleId,
        name: cleanTitle(f.title || f.message || ''),
        shortDescription: { text: cleanTitle(f.title || f.message || '') },
        fullDescription: { text: f.message || f.description || 'Security vulnerability detected' },
        helpUri: f.cwe?.id ? `https://cwe.mitre.org/data/definitions/${f.cwe.id.replace('CWE-', '')}.html` : undefined,
        properties: {
          tags: [
            ...(f.cwe?.id ? [f.cwe.id] : []),
            ...(Array.isArray(f.owasp) ? f.owasp : []),
          ],
          ...(f.bts !== undefined ? { 'neperia/bts': f.bts } : {}),
          ...(f.crs !== undefined ? { 'neperia/crs': f.crs } : {}),
          ...(f.priority?.priority ? { 'neperia/priority': f.priority.priority } : {}),
        }
      };
    }

    const loc = f.location || {};
    results.push({
      ruleId,
      level: (f.adjustedSeverity || f.severity || 'warning').toLowerCase() === 'critical' ? 'error'
        : (f.adjustedSeverity || f.severity || '').toLowerCase() === 'high' ? 'error'
        : (f.adjustedSeverity || f.severity || '').toLowerCase() === 'medium' ? 'warning'
        : 'note',
      message: { text: f.message || f.description || 'Security vulnerability detected' },
      locations: [{
        physicalLocation: {
          artifactLocation: { uri: loc.file || f.file || 'unknown' },
          region: {
            startLine: loc.line || f.startLine || 1,
            ...(loc.endLine ? { endLine: loc.endLine } : {}),
            ...(loc.column ? { startColumn: loc.column } : {}),
            ...(loc.endColumn ? { endColumn: loc.endColumn } : {}),
          }
        }
      }],
      properties: {
        severity: f.adjustedSeverity || f.severity,
        ...(f.bts !== undefined ? { 'neperia/bts': f.bts } : {}),
        ...(f.crs !== undefined ? { 'neperia/crs': f.crs } : {}),
        ...(f.priority ? { 'neperia/priority': f.priority.priority, 'neperia/sla': f.priority.sla } : {}),
        ...(f.confidence ? { confidence: f.confidence } : {}),
        ...(f.impact ? { impact: f.impact } : {}),
        ...(f.likelihood ? { likelihood: f.likelihood } : {}),
      }
    });
  });

  return {
    $schema: 'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json',
    version: '2.1.0',
    runs: [{
      tool: {
        driver: {
          name: 'Neperia Code Guardian',
          version: '1.0.0',
          informationUri: 'https://neperia.com',
          rules: Object.values(rules),
        }
      },
      results,
      properties: {
        'neperia/riskScore': riskAssessment.riskScore || 0,
        'neperia/riskLevel': riskAssessment.riskLevel || 'Low',
      }
    }]
  };
}

function renderFindingHtml(finding: any, index: number): string {
  const { title, message, description, cwe, owasp, location, code, snippet, remediation } = finding;
  // Fix 2: Use adjustedSeverity
  const severity = finding.adjustedSeverity || finding.severity || 'Medium';
  const { file, line } = location || {};
  const vulnCode = code || snippet || '';
  const { id: cweId, name: cweName } = getCweInfo(cwe);
  const owaspText = getOwaspDisplay(owasp);

  let remText = message || '';
  if (!remText) {
    if (typeof remediation === 'object') {
      remText = remediation.approach || remediation.description || 'Review and apply security best practices';
    } else {
      remText = remediation || 'Review and apply security best practices.';
    }
  }

  const displayTitle = cleanTitle(title || message || '');
  const displaySev = severity.charAt(0).toUpperCase() + severity.slice(1).toLowerCase();

  let categoryHtml = '';
  if (remediation?.resources?.category) {
    let cat = remediation.resources.category;
    cat = cat.replace(/^./, (c: string) => c.toUpperCase());
    if (/^unknown$/i.test(cat)) cat = 'Unclassified';
    categoryHtml = `<div><strong>Category:</strong> ${cat}</div>`;
  }

  let html = '<div class="finding">';
  html += '<div style="display:flex; justify-content:space-between; align-items:flex-start;">';
  html += '<h3>' + (index + 1) + '. ' + displayTitle + '</h3>';
  html += '<span class="pill pill-' + displaySev.toLowerCase() + '">' + displaySev + '</span>';
  html += '</div>';
  html += '<div style="font-size: 12px; color: #6B7280; font-family: \'Monaco\', monospace; margin-top: 4px;">' + (file || 'N/A') + ':' + (line || 'N/A') + '</div>';
  html += '<p style="margin-top: 16px;">' + (description || message) + '</p>';

  if (vulnCode) {
    html += '<h4 style="font-size: 12px; color: #6B7280; margin-top: 16px; font-weight: 500;">Vulnerable Code</h4>';
    html += '<div class="code">' + escapeHtml(vulnCode) + '</div>';
  }

  html += '<h4 style="font-size: 12px; color: #6B7280; margin-top: 16px; font-weight: 500;">Remediation</h4>';
  html += '<p>' + remText + '</p>';

  html += '<div style="border-top: 1px solid #E5E7EB; margin-top: 24px; padding-top: 16px; display: flex; gap: 32px; font-size: 14px; flex-wrap: wrap;">';
  if (cweId !== 'N/A') {
    html += '<div><strong>CWE:</strong> ' + cweId + (cweName ? ' - ' + cweName : '') + '</div>';
  }
  if (owaspText) {
    html += '<div><strong>OWASP:</strong> ' + owaspText + '</div>';
  }
  if (finding.bts) {
    html += '<div><strong>BTS:</strong> ' + finding.bts.toFixed(1) + ' / 10</div>';
  }
  if (finding.crs) {
    html += '<div><strong>CRS:</strong> ' + finding.crs + ' / 100</div>';
  }
  if (finding.priority?.priority) {
    html += '<div><strong>Priority:</strong> ' + finding.priority.priority + ' — ' + finding.priority.action + '</div>';
  }
  if (finding.priority?.sla) {
    html += '<div><strong>SLA:</strong> ' + finding.priority.sla + '</div>';
  }
  if (categoryHtml) html += categoryHtml;
  html += '</div></div>';
  return html;
}

export default function ExportSection({ findings = [], riskAssessment = {}, performance = {}, metadata = {} }: ExportSectionProps) {
  const { riskScore = 0 } = riskAssessment;
  const riskLevel = deriveRiskLevel(findings);
  const currentYear = new Date().getFullYear();

  const downloadReport = (format) => {
    const timestamp = new Date().toLocaleDateString();
    
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
    
    const normalizeSeverity = (sev: any) => {
      if (!sev) return 'Low';
      const s = String(sev).toLowerCase();
      if (['critical', 'crit', 'error', 'severe'].includes(s)) return 'Critical';
      if (['high', 'major'].includes(s)) return 'High';
      if (['medium', 'moderate', 'warn', 'warning'].includes(s)) return 'Medium';
      if (['low', 'minor', 'info', 'informational'].includes(s)) return 'Low';
      return s ? s.charAt(0).toUpperCase() + s.slice(1) : 'Low';
    };

    const sevCount = (level: 'Critical' | 'High' | 'Medium' | 'Low') =>
      findings.filter((f) => normalizeSeverity(f?.adjustedSeverity || f?.severity) === level).length;

    // Fix 5: SARIF export
    if (format === 'sarif') {
      const sarif = generateSarif(findings, { riskScore, riskLevel });
      const blob = new Blob([JSON.stringify(sarif, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `neperia-report-${new Date().toISOString().split('T')[0]}.sarif.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return;
    }

    if (format === 'json') {
        const cleanedFindings = findings.map(f => {
          const cleaned = { ...f };
          cleaned.title = cleanTitle(f.title || f.message || '');
          cleaned.sla = f.priority?.sla || undefined;
          if (cleaned.remediation && typeof cleaned.remediation === 'object') {
            const { timeline, ...restRem } = cleaned.remediation;
            if (restRem.resources?.category) {
              let cat = restRem.resources.category;
              cat = cat.replace(/^./, (c: string) => c.toUpperCase());
              if (/^unknown$/i.test(cat)) cat = 'Unclassified';
              restRem.resources = { ...restRem.resources, category: cat };
            }
            if (f.message) restRem.description = f.message;
            cleaned.remediation = restRem;
          }
          if (cleaned.cwe && typeof cleaned.cwe === 'object' && cleaned.cwe.name) {
            if (/^CWE[\s#-]*\d+$/i.test(cleaned.cwe.name)) {
              cleaned.cwe = { ...cleaned.cwe, name: undefined };
            }
          }
          return cleaned;
        });

        const jsonReport = {
          riskAssessment: {
            ...riskAssessment,
            riskLevel,
          },
          findings: cleanedFindings,
          metadata: {
            exportDate: new Date().toISOString(),
            totalFindings: findings.length,
            severityBreakdown: {
              critical: sevCount('Critical'),
              high: sevCount('High'),
              medium: sevCount('Medium'),
              low: sevCount('Low'),
            },
          },
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
    } else if (format === 'html' || format === 'pdf') {
      let reportContent: string;
      if (format === 'html') {
          reportContent = `<h2>Detailed Security Findings</h2>` + findings.map((f, i) => renderFindingHtml(f, i)).join('');
      } else {
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
            
            <h2>Detailed Security Findings</h2>` + findings.map((f, i) => renderFindingHtml(f, i)).join('');
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
            <footer style="margin-top: 48px; border-top: 1px solid #E5E7EB; padding-top: 16px; text-align: center; color: #9CA3AF; font-size: 12px;">
                © ${currentYear} Neperia. All rights reserved.
            </footer>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
            <button onClick={() => downloadReport('pdf')} className="w-full text-left p-4 rounded-xl transition-all duration-150 glass-card glass-card-hover">
                <h4 className="font-semibold text-[#374151]">Executive Report</h4>
                <p className="text-xs text-[#9CA3AF]">High-level summary for management (HTML format).</p>
            </button>
            <button onClick={() => downloadReport('html')} className="w-full text-left p-4 rounded-xl transition-all duration-150 glass-card glass-card-hover">
                <h4 className="font-semibold text-[#374151]">Technical HTML</h4>
                <p className="text-xs text-[#9CA3AF]">Detailed findings for developers.</p>
            </button>
            <button onClick={() => downloadReport('json')} className="w-full text-left p-4 rounded-xl transition-all duration-150 glass-card glass-card-hover">
                <h4 className="font-semibold text-[#374151]">JSON Data</h4>
                <p className="text-xs text-[#9CA3AF]">Raw data for automation and BI.</p>
            </button>
            {/* Fix 5: SARIF export */}
            <button onClick={() => downloadReport('sarif')} className="w-full text-left p-4 rounded-xl transition-all duration-150 glass-card glass-card-hover">
                <h4 className="font-semibold text-[#374151]">SARIF 2.1.0</h4>
                <p className="text-xs text-[#9CA3AF]">Standard format for CI/CD and SIEM integration.</p>
            </button>
        </div>
    </div>
  );
}
