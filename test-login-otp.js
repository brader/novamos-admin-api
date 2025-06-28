// Test script to verify login OTP functionality
const API_URL = 'http://localhost:3001/api/v1';

async function testLoginOTPFlow() {
  console.log('🧪 Testing Login OTP Flow...\n');
  
  const testPhone = '8123456789'; // Use the same phone number we just registered
  
  try {
    // Step 1: Request OTP for login
    console.log('📱 Step 1: Requesting OTP for login...');
    const otpResponse = await fetch(`${API_URL}/users/getotp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: testPhone
      })
    });
    
    const otpResult = await otpResponse.json();
    console.log('OTP Response:', otpResult);
    
    if (!otpResponse.ok) {
      throw new Error(`OTP request failed: ${otpResult.error}`);
    }
    
    const { uniq } = otpResult.data;
    console.log('✅ OTP request successful, uniq:', uniq);
    
    // Step 2: Debug OTP (get actual OTP value for testing)
    console.log('\n🔍 Step 2: Debugging OTP...');
    const debugResponse = await fetch(`${API_URL}/debug/otp?uniq=${uniq}`);
    const debugResult = await debugResponse.json();
    console.log('Debug Response:', debugResult);
    
    if (!debugResponse.ok) {
      throw new Error(`Debug failed: ${debugResult.error}`);
    }
    
    const actualOTP = debugResult.data.otp;
    console.log('✅ Actual OTP:', actualOTP, 'Type:', typeof actualOTP);
    
    // Step 3: Test login with OTP
    console.log('\n🔐 Step 3: Testing login with OTP...');
    const loginResponse = await fetch(`${API_URL}/authentications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        otp: String(actualOTP),
        uniq: uniq,
        phone: testPhone
      })
    });
    
    const loginResult = await loginResponse.json();
    console.log('Login Response:', loginResult);
    
    if (loginResponse.ok) {
      console.log('✅ Login successful!');
      console.log('🎟️ Access Token:', loginResult.data.accessToken ? 'Present' : 'Missing');
      console.log('🔄 Refresh Token:', loginResult.data.refreshToken ? 'Present' : 'Missing');
    } else {
      console.log('❌ Login failed:', loginResult.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testLoginOTPFlow();
