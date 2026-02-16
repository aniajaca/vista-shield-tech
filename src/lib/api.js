// lib/api.js - Neperia backend integration
const API_URL = import.meta.env.VITE_API_URL || 'https://semgrep-backend-production.up.railway.app';

// ============================================================
// Normalization layer: maps backend response → frontend shape
// ============================================================

const CWE_DATABASE = {
  'CWE-22':  { name: 'Path Traversal', category: 'Input Validation' },
  'CWE-78':  { name: 'OS Command Injection', category: 'Injection' },
  'CWE-79':  { name: 'Cross-site Scripting (XSS)', category: 'Injection' },
  'CWE-89':  { name: 'SQL Injection', category: 'Injection' },
  'CWE-94':  { name: 'Code Injection', category: 'Injection' },
  'CWE-95':  { name: 'Eval Injection', category: 'Injection' },
  'CWE-200': { name: 'Information Exposure', category: 'Information Disclosure' },
  'CWE-259': { name: 'Use of Hard-coded Password', category: 'Credentials Management' },
  'CWE-295': { name: 'Improper Certificate Validation', category: 'Cryptography' },
  'CWE-327': { name: 'Use of Broken Crypto Algorithm', category: 'Cryptography' },
  'CWE-328': { name: 'Reversible One-Way Hash', category: 'Cryptography' },
  'CWE-330': { name: 'Use of Insufficiently Random Values', category: 'Cryptography' },
  'CWE-338': { name: 'Use of Weak PRNG', category: 'Cryptography' },
  'CWE-489': { name: 'Active Debug Code', category: 'Security Misconfiguration' },
  'CWE-502': { name: 'Deserialization of Untrusted Data', category: 'Input Validation' },
  'CWE-601': { name: 'Open Redirect', category: 'Input Validation' },
  'CWE-668': { name: 'Exposure of Resource to Wrong Sphere', category: 'Security Misconfiguration' },
  'CWE-704': { name: 'Incorrect Type Conversion', category: 'Input Validation' },
  'CWE-798': { name: 'Use of Hard-coded Credentials', category: 'Credentials Management' },
  'CWE-915': { name: 'Improperly Controlled Modification of Dynamically-Determined Object Attributes', category: 'Input Validation' },
  'CWE-918': { name: 'Server-Side Request Forgery (SSRF)', category: 'Injection' },
};


function extractTitleFromRuleId(ruleId) {
  if (!ruleId) return null;
  const parts = ruleId.split('.');
  let last = parts[parts.length - 1];
  if (parts.length >= 2 && parts[parts.length - 1] === parts[parts.length - 2]) {
    last = parts[parts.length - 1];
  }
  return last
    .replace(/-/g, ' ')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim();
}

function cleanFilePath(filePath) {
  if (!filePath) return 'unknown';
  return filePath.replace(/^\/tmp\/neperia-[^/]+\//, '');
}

function normalizeFinding(f) {
  const cweStr = f.cwe || f.cweId || '';
  const cweData = CWE_DATABASE[cweStr] || { name: cweStr.replace('CWE-', 'CWE #'), category: 'Security' };
  const severity = (f.severity || 'MEDIUM').toUpperCase();

  return {
    title: extractTitleFromRuleId(f.ruleId),
    ruleId: f.ruleId,
    engine: f.engine || 'semgrep',

    severity: severity === 'CRITICAL' ? 'Critical' : severity === 'HIGH' ? 'High' : severity === 'MEDIUM' ? 'Medium' : severity === 'LOW' ? 'Low' : severity,
    bts: f.bts,
    crs: f.crs,
    adjustedSeverity: f.adjustedSeverity,

    cwe: {
      id: cweStr,
      name: cweData.name,
      category: cweData.category,
      description: f.message || '',
    },

    owasp: f.owasp || [],

    message: f.message || '',
    description: f.message || '',

    location: {
      file: cleanFilePath(f.file),
      line: f.startLine,
      endLine: f.endLine,
      column: f.startColumn,
      endColumn: f.endColumn,
    },
    file: cleanFilePath(f.file),
    startLine: f.startLine,

    snippet: f.snippet || '',
    code: f.snippet || '',

    confidence: f.confidence,
    impact: f.impact,
    likelihood: f.likelihood,

    priority: f.priority,
    sla: f.sla,

    context: f.context || {},
    contextEvidence: f.contextEvidence || {},
    inferredFactors: f.inferredFactors || [],
    appliedFactors: f.appliedFactors || [],

    remediation: {
      description: f.remediation?.approach || f.remediation?.timeline || 'Review and apply security best practices',
      priority: f.remediation?.priority?.priority || '',
      impact: f.remediation?.risk || '',
      timeline: f.remediation?.timeline || '',
      validation: f.remediation?.validation || '',
      preventionMeasures: f.remediation?.preventionMeasures || [],
      resources: f.remediation?.resources || {},
    },
  };
}

function normalizeBackendResponse(response) {
  if (!response) return response;

  const rawFindings = response.findings || [];
  const findings = rawFindings.map(normalizeFinding);

  const stats = { Critical: 0, High: 0, Medium: 0, Low: 0 };
  findings.forEach(f => {
    const sev = f.severity;
    if (stats[sev] !== undefined) stats[sev]++;
  });

  const SEVERITY_WEIGHTS = { Critical: 25, High: 15, Medium: 8, Low: 3 };
  const rawScore = findings.reduce((sum, f) => sum + (SEVERITY_WEIGHTS[f.severity] || 0), 0);
  const finalScore = Math.min(100, rawScore);
  const riskLevel = finalScore >= 80 ? 'Critical' : finalScore >= 60 ? 'High' : finalScore >= 40 ? 'Medium' : finalScore >= 20 ? 'Low' : 'Minimal';

  const engines = [...new Set(findings.map(f => f.engine).filter(Boolean))];
  const engineDisplay = engines.length > 0 ? engines.join(' + ') : 'semgrep';

  return {
    findings,
    score: {
      final: finalScore,
      raw: rawScore,
      components: {
        btsAvg: findings.length > 0 ? findings.reduce((s, f) => s + (f.bts || 0), 0) / findings.length : 0,
        crsAvg: findings.length > 0 ? findings.reduce((s, f) => s + (f.crs || 0), 0) / findings.length : 0,
      },
    },
    risk: {
      level: riskLevel,
    },
    stats,
    riskAssessment: {
      riskScore: finalScore,
      riskLevel,
      findingsBreakdown: stats,
    },
    metadata: {
      engine: engineDisplay,
      scan_time: response.metadata?.scan_time || response.scan_time || response.scanTime || null,
      total_findings: findings.length,
      timestamp: response.metadata?.timestamp || new Date().toISOString(),
      ...response.metadata,
    },
    performance: response.performance || {
      scanTime: response.metadata?.scan_time ? parseFloat(response.metadata.scan_time) : null,
    },
  };
}

// ============================================================
// HTTP helpers
// ============================================================

async function handleResponse(response) {
  if (response.ok) return response.json();
  let body = '';
  try { body = await response.text(); } catch {}
  const msg = body ? `HTTP ${response.status}: ${body}` : `HTTP ${response.status}`;
  throw new Error(msg);
}

async function postJson(path, payload) {
  return fetch(`${API_URL}${path}`, {
    method: 'POST',
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(payload)
  });
}

// ============================================================
// Public API
// ============================================================

export async function scanCode(code, language = 'javascript', riskConfig = null, context = null, filename = null) {
  const ruleset = (language && language.toLowerCase().startsWith('js')) ? 'p/javascript' : 'auto';
  const payload = {
    code,
    language,
    filename: filename || `code.${language}`,
    mode: 'snippet',
    engine: 'auto',
    semgrep: { ruleset, timeoutSeconds: 60 }
  };
  if (riskConfig) payload.riskConfig = riskConfig;
  if (context) payload.context = context;

  // Try /scan-code first, then fallback to /scan if it fails
  const resp = await postJson('/scan-code', payload);
  if (resp.ok) {
    return normalizeBackendResponse(await resp.json());
  }
  
  // If we get a 500 error (likely taxonomy processing issue), retry with raw results
  if (resp.status === 500) {
    
    const rawPayload = { ...payload, rawResults: true, skipTaxonomy: true };
    const rawResp = await postJson('/scan-code', rawPayload);
    if (rawResp.ok) return normalizeBackendResponse(await rawResp.json());
    
    const minimalPayload = { 
      ...payload, 
      rawResults: true, 
      skipTaxonomy: true,
      skipRiskCalculation: true,
      minimalProcessing: true 
    };
    const minimalResp = await postJson('/scan-code', minimalPayload);
    if (minimalResp.ok) return normalizeBackendResponse(await minimalResp.json());

    try {
      const legacyResp = await postJson('/scan', payload);
      if (legacyResp.ok) return normalizeBackendResponse(await legacyResp.json());
    } catch {}
  }
  
  if (resp.status === 404 || resp.status === 405) {
    const resp2 = await postJson('/scan', payload);
    return normalizeBackendResponse(await handleResponse(resp2));
  }
  return normalizeBackendResponse(await handleResponse(resp));
}

export async function scanFileUpload(file, language = 'javascript', riskConfig = null, context = null) {
  const form = new FormData();
  form.append('file', file, file.name || 'code.' + language);
  form.append('language', language);
  form.append('engine', 'semgrep');
  if (riskConfig) form.append('riskConfig', JSON.stringify(riskConfig));
  if (context) form.append('context', JSON.stringify(context));

  try {
    const resp = await fetch(`${API_URL}/scan-file`, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Accept': 'application/json' },
      body: form
    });
    if (resp.ok) {
      return normalizeBackendResponse(await resp.json());
    }

    if (resp.status === 404 || resp.status === 405) {
      const code = await file.text();
      return await scanCode(code, language, riskConfig, context, file.name);
    }

    return normalizeBackendResponse(await handleResponse(resp));
  } catch {
    const code = await file.text();
    return await scanCode(code, language, riskConfig, context, file.name);
  }
}

export async function scanDependencies(packageJson, packageLockJson, riskConfig = null, context = null) {
  const payload = {
    packageJson,
    packageLockJson,
    semgrep: { ruleset: 'auto', timeoutSeconds: 60 }
  };
  if (riskConfig) payload.riskConfig = riskConfig;
  if (context) payload.context = context;

  const response = await postJson('/scan-dependencies', payload);
  return await handleResponse(response);
}

export async function testConnection() {
  try {
    const response = await fetch(`${API_URL}/health`);
    const data = await response.json();
    return data.status === 'healthy';
  } catch {
    return false;
  }
}

export async function getHealthStatus() {
  const response = await fetch(`${API_URL}/health`);
  return await response.json();
}

export async function getCapabilities() {
  const response = await fetch(`${API_URL}/capabilities`);
  return await response.json();
}

export async function getDefaults() {
  const response = await fetch(`${API_URL}/config/defaults`);
  return await response.json();
}
