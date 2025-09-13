// lib/api.js or similar
const API_URL = 'https://semgrep-backend-production.up.railway.app';

export async function scanCode(code, language = 'javascript', riskConfig = null, context = null) {
  try {
    const payload = {
      code: code,
      language: language,
      filename: `code.${language}`
    };

    if (riskConfig) payload.riskConfig = riskConfig;
    if (context) payload.context = context;

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

export async function scanFile(file, riskConfig = null, context = null) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    if (riskConfig) formData.append('riskConfig', JSON.stringify(riskConfig));
    if (context) formData.append('context', JSON.stringify(context));

    const response = await fetch(`${API_URL}/scan-file`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('File scan failed:', error);
    throw error;
  }
}

export async function scanDependencies(packageJson, riskConfig = null, context = null) {
  try {
    const payload = {
      packageJson: packageJson
    };

    if (riskConfig) payload.riskConfig = riskConfig;
    if (context) payload.context = context;

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