// Backend verification tests for Neperia integration
import { getHealthStatus, getCapabilities, getDefaults, scanCode } from '@/lib/api';

// Test JavaScript snippet with known vulnerabilities
const VULNERABLE_CODE = `const { exec } = require('child_process');
require('http').createServer((req,res)=>{
  if (req.url.startsWith('/run')) exec('ping -c 1 ' + (new URL(req.url,'http://x').searchParams.get('host')), ()=>{});
  if (req.url.startsWith('/x')) eval((new URL(req.url,'http://x').searchParams.get('q')));
  res.end('ok');
}).listen(3001);`;

export async function runBackendVerification() {
  console.log('🔍 Starting backend verification...');
  
  try {
    // 1. Health check
    console.log('1. Testing health endpoint...');
    const health = await getHealthStatus();
    console.log('✅ Health:', health);
    
    // 2. Capabilities check
    console.log('2. Testing capabilities endpoint...');
    const capabilities = await getCapabilities();
    console.log('✅ Capabilities:', capabilities);
    
    // 3. Defaults check
    console.log('3. Testing defaults endpoint...');
    const defaults = await getDefaults();
    console.log('✅ Defaults:', defaults);
    
    // 4. Real Semgrep scan test
    console.log('4. Testing real Semgrep scan...');
    const scanResult = await scanCode(VULNERABLE_CODE, 'javascript');
    console.log('✅ Scan Result:', scanResult);
    
    // Verify key elements
    const verificationResults = {
      healthz: health.status === 'healthy',
      semgrepVersion: health.services?.semgrepVersion || 'unknown',
      scanFindings: scanResult.findings?.length || 0,
      hasRiskScore: typeof scanResult.riskScore === 'number',
      hasMetadata: !!scanResult.metadata
    };
    
    console.log('📊 Verification Summary:', verificationResults);
    return verificationResults;
    
  } catch (error) {
    console.error('❌ Backend verification failed:', error);
    throw error;
  }
}

// Auto-run verification when module loads
if (typeof window !== 'undefined') {
  runBackendVerification().catch(console.error);
}