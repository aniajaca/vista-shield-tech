// lib/api.js or similar
const API_URL = 'https://semgrep-backend-production.up.railway.app';

export async function scanCode(code, language = 'javascript', riskConfig = null, context = null) {
  try {
    const payload = {
      code: code,
      language: language,
      filename: `code.${language}`,
    };

    if (riskConfig) payload.riskConfig = riskConfig;
    if (context) payload.context = context;

    console.log('📦 Sending scan-code request:', payload);

    const response = await fetch(`${API_URL}/scan-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Scan-code response:', data);
    
    // Normalize response to match expected structure
    return {
      findings: data.findings || [],
      score: data.score || { raw: 0, normalized: 0, final: 0 },
      risk: data.risk || { level: 'minimal', priority: {} },
      riskAssessment: data.riskAssessment || {},
      performance: data.performance || {},
      appliedFactors: data.appliedFactors || [],
      fileScore: data.fileScore || data.score
    };
  } catch (error) {
    console.error('Scan failed:', error);
    throw error;
  }
}

export async function scanFile(file, riskConfig = null, context = null) {
  try {
    // Read file content and use scan-code endpoint as specified in the API
    const code = await file.text();
    
    // Determine language from file extension
    const extension = file.name.split('.').pop()?.toLowerCase();
    let language = 'javascript';
    if (extension === 'ts' || extension === 'tsx') {
      language = 'typescript';
    } else if (extension === 'js' || extension === 'jsx') {
      language = 'javascript';
    }

    const payload = {
      code: code,
      language: language,
      filename: file.name,
    };

    if (riskConfig) payload.riskConfig = riskConfig;
    if (context) payload.context = context;

    console.log('📦 Sending file scan request:', payload);

    const response = await fetch(`${API_URL}/scan-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ File scan response:', data);
    
    // Normalize response to match expected structure
    return {
      findings: data.findings || [],
      score: data.score || { raw: 0, normalized: 0, final: 0 },
      risk: data.risk || { level: 'minimal', priority: {} },
      riskAssessment: data.riskAssessment || {},
      performance: data.performance || {},
      appliedFactors: data.appliedFactors || [],
      fileScore: data.fileScore || data.score
    };
  } catch (error) {
    console.error('File scan failed:', error);
    throw error;
  }
}

export async function scanDependencies(packageJson, riskConfig = null, context = null) {
  try {
    const payload = {
      packageJson: packageJson,
      includeDevDependencies: true
    };

    if (riskConfig) payload.riskConfig = riskConfig;
    if (context) payload.context = context;

    console.log('📦 Sending dependencies scan request:', payload);

    const response = await fetch(`${API_URL}/scan-dependencies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Dependencies scan response:', data);
    
    // Normalize response to match expected structure
    return {
      findings: data.findings || data.vulnerabilities || [],
      score: data.score || { raw: 0, normalized: 0, final: 0 },
      risk: data.risk || { level: 'minimal', priority: {} },
      riskAssessment: data.riskAssessment || {},
      performance: data.performance || {},
      appliedFactors: data.appliedFactors || [],
      fileScore: data.fileScore || data.score
    };
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