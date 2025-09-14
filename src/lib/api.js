// lib/api.js - Neperia backend integration
const API_URL = 'https://semgrep-backend-production.up.railway.app';

async function handleResponse(response) {
  if (response.ok) return response.json();
  let message = `HTTP ${response.status}`;
  try {
    const text = await response.text();
    message += text ? `: ${text}` : '';
  } catch {}
  throw new Error(message);
}

export async function scanCode(code, language = 'javascript', riskConfig = null, context = null, filename = null) {
  try {
    const payload = {
      code,
      language,
      filename: filename || `code.${language}`,
      mode: 'snippet',
      semgrep: {
        ruleset: 'auto',
        timeoutSeconds: 60
      }
    };

    if (riskConfig) payload.riskConfig = riskConfig;
    if (context) payload.context = context;

    const response = await fetch(`${API_URL}/scan-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Scan failed:', error);
    throw error;
  }
}

export async function scanDependencies(packageJson, packageLockJson, riskConfig = null, context = null) {
  try {
    const payload = {
      packageJson,
      packageLockJson,
      semgrep: { ruleset: 'auto', timeoutSeconds: 60 }
    };

    if (riskConfig) payload.riskConfig = riskConfig;
    if (context) payload.context = context;

    const response = await fetch(`${API_URL}/scan-dependencies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Dependencies scan failed:', error);
    throw error;
  }
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
  try {
    const response = await fetch(`${API_URL}/health`);
    return await response.json();
  } catch (error) {
    console.error('Health check failed:', error);
    throw error;
  }
}

export async function getCapabilities() {
  try {
    const response = await fetch(`${API_URL}/capabilities`);
    return await response.json();
  } catch (error) {
    console.error('Capabilities check failed:', error);
    throw error;
  }
}

export async function getDefaults() {
  try {
    const response = await fetch(`${API_URL}/config/defaults`);
    return await response.json();
  } catch (error) {
    console.error('Defaults fetch failed:', error);
    throw error;
  }
}