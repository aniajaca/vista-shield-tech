// Test backend connection
import { testConnection } from '@/lib/api';

export async function runConnectionTest() {
  console.log('🔗 Testing backend connection...');
  
  try {
    const isHealthy = await testConnection();
    console.log('✅ Backend connection test result:', isHealthy);
    return isHealthy;
  } catch (error) {
    console.error('❌ Backend connection failed:', error);
    return false;
  }
}

// Auto-run test when module loads (for debugging)
if (typeof window !== 'undefined') {
  runConnectionTest();
}