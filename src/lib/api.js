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
  try {
    const resp = await postJson('/scan-code', payload);
    return await handleResponse(resp);
  } catch (e1) {
    console.warn('Primary /scan-code failed, retrying /scan ...', e1?.message);
    const resp2 = await postJson('/scan', payload);
    return await handleResponse(resp2);
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