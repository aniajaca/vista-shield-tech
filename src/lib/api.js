// lib/api.js or similar
const API_URL = 'https://semgrep-backend-production.up.railway.app';

export async function scanCode(code, language = 'javascript') {
  try {
    const response = await fetch(`${API_URL}/scan-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: code,
        language: language,
        filename: `code.${language}`
      })
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