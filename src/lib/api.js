// lib/api.js - Neperia backend integration
const API_URL = 'https://semgrep-backend-production.up.railway.app';

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

export async function scanCode(code, language = 'javascript', riskConfig = null, context = null, filename = null) {
  const ruleset = (language && language.toLowerCase().startsWith('js')) ? 'p/javascript' : 'auto';
  const payload = {
    code,
    language,
    filename: filename || `code.${language}`,
    mode: 'snippet',
    semgrep: { ruleset, timeoutSeconds: 60 }
  };
  if (riskConfig) payload.riskConfig = riskConfig;
  if (context) payload.context = context;

  // Try /scan-code first, then fallback to /scan if it fails
  // Try /scan-code; only fallback to /scan when endpoint is missing
  const resp = await postJson('/scan-code', payload);
  if (resp.ok) return await resp.json();
  
  // If we get a 500 error (likely taxonomy processing issue), retry with raw results
  if (resp.status === 500) {
    console.warn('Server error detected, retrying with raw results...');
    try {
      const errorBody = await resp.text();
      console.warn('Original error:', errorBody);
    } catch (e) {
      console.warn('Could not parse error body');
    }
    
    const rawPayload = { ...payload, rawResults: true, skipTaxonomy: true };
    const rawResp = await postJson('/scan-code', rawPayload);
    if (rawResp.ok) return await rawResp.json();
    
    // If raw results also fail, try with minimal processing
    const minimalPayload = { 
      ...payload, 
      rawResults: true, 
      skipTaxonomy: true,
      skipRiskCalculation: true,
      minimalProcessing: true 
    };
    const minimalResp = await postJson('/scan-code', minimalPayload);
    if (minimalResp.ok) return await minimalResp.json();
  }
  
  if (resp.status === 404 || resp.status === 405) {
    const resp2 = await postJson('/scan', payload);
    return await handleResponse(resp2);
  }
  // Surface the original error from /scan-code (avoid incorrect fallback to project scan)
  return await handleResponse(resp);
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
  } catch (error) {
    console.error('Connection test failed:', error);
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