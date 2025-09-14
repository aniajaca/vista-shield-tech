// lib/api.js - Neperia backend integration
const API_URL = 'https://semgrep-backend-production.up.railway.app';

export async function scanCode(code, language = 'javascript', riskConfig = null, context = null) {
  try {
    const payload = {
      code: code,
      language: language,
      filename: `code.${language}`
    };

    // Add risk configuration if provided
    if (riskConfig) {
      payload.riskConfig = riskConfig;
    }
    if (context) {
      payload.context = context;
    }

    const response = await fetch(`${API_URL}/scan-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Scan failed:', error);
    throw error;
  }
}

export async function scanDependencies(packageJson, packageLockJson, riskConfig = null, context = null) {
  try {
    const payload = {
      packageJson: packageJson,
      packageLockJson: packageLockJson
    };

    if (riskConfig) {
      payload.riskConfig = riskConfig;
    }
    if (context) {
      payload.context = context;
    }

    const response = await fetch(`${API_URL}/scan-dependencies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
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
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Health check failed:', error);
    throw error;
  }
}

export async function getCapabilities() {
  try {
    const response = await fetch(`${API_URL}/capabilities`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Capabilities check failed:', error);
    throw error;
  }
}

export async function getDefaults() {
  try {
    const response = await fetch(`${API_URL}/config/defaults`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Defaults fetch failed:', error);
    throw error;
  }
}