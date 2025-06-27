// Test script to verify OTP functionality
const API_URL = 'http://localhost:3001/api/v1';

async function testOTPFlow() {
  console.log('🧪 Testing OTP Flow...\n');
  
  const testPhone = '8123456789';
  
  try {
    // Step 1: Request OTP
    console.log('📱 Step 1: Requesting OTP...');
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
    
    // Step 3: Test OTP validation (simulate registration)
    console.log('\n✅ Step 3: Testing OTP validation...');
    const formData = new FormData();
    formData.append('action', 'register');
    formData.append('otp', String(actualOTP));
    formData.append('uniq', uniq);
    formData.append('phone', testPhone);
    formData.append('name', 'Test User');
    formData.append('email', 'test@example.com');
    
    const registerResponse = await fetch(`${API_URL}/users`, {
      method: 'POST',
      body: formData
    });
    
    const registerResult = await registerResponse.json();
    console.log('Registration Response:', registerResult);
    
    if (registerResponse.ok) {
      console.log('✅ Registration successful!');
    } else {
      console.log('❌ Registration failed:', registerResult.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testOTPFlow();
