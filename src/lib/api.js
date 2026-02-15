// lib/api.js - Neperia backend integration
const API_URL = import.meta.env.VITE_API_URL || 'https://semgrep-backend-production.up.railway.app';

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
  console.log('🔧 scanCode called with:', { language, filename, ruleset });
  
  const payload = {
    code,
    language,
    filename: filename || `code.${language}`,
    mode: 'snippet',
    engine: 'auto', // Let backend choose appropriate engine
    semgrep: { ruleset, timeoutSeconds: 60 }
  };
  if (riskConfig) payload.riskConfig = riskConfig;
  if (context) payload.context = context;

  console.log('📤 Sending payload to /scan-code:', JSON.stringify(payload, null, 2));

  // Try /scan-code first, then fallback to /scan if it fails
  // Try /scan-code; only fallback to /scan when endpoint is missing
  const resp = await postJson('/scan-code', payload);
  if (resp.ok) {
    const result = await resp.json();
    console.log('✅ /scan-code success, metadata:', result.metadata);
    return result;
  }
  
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

    // Final fallback: try legacy /scan even if status is 500
    try {
      console.warn('Trying legacy /scan fallback after /scan-code 500...');
      const legacyResp = await postJson('/scan', payload);
      if (legacyResp.ok) return await legacyResp.json();
      console.warn('Legacy /scan also failed with status', legacyResp.status);
    } catch (e) {
      console.warn('Legacy /scan fallback threw:', e);
    }
  }
  
  if (resp.status === 404 || resp.status === 405) {
    const resp2 = await postJson('/scan', payload);
    return await handleResponse(resp2);
  }
  return await handleResponse(resp);
}

export async function scanFileUpload(file, language = 'javascript', riskConfig = null, context = null) {
  console.log('📦 scanFileUpload -> /scan-file', { name: file?.name, size: file?.size, type: file?.type, language });
  const form = new FormData();
  form.append('file', file, file.name || 'code.' + language);
  form.append('language', language);
  form.append('engine', 'semgrep'); // ensure Semgrep engine for real file scanning
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
      const result = await resp.json();
      console.log('✅ /scan-file success, metadata:', result.metadata);
      return result;
    }

    // If /scan-file is missing or not allowed, fall back to code snippet path
    if (resp.status === 404 || resp.status === 405) {
      console.warn('ℹ️ /scan-file not available, falling back to /scan-code');
      const code = await file.text();
      return await scanCode(code, language, riskConfig, context, file.name);
    }

    // Otherwise throw using our handler to surface details
    return await handleResponse(resp);
  } catch (e) {
    console.warn('⚠️ /scan-file failed, falling back to /scan-code. Reason:', e);
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