// Test script to verify invalid OTP handling
const API_URL = 'http://localhost:3001/api/v1';

async function testInvalidOTP() {
  console.log('🧪 Testing Invalid OTP Handling...\n');
  
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
    const { uniq } = otpResult.data;
    console.log('✅ OTP request successful, uniq:', uniq);
    
    // Step 2: Test with invalid OTP
    console.log('\n❌ Step 2: Testing with invalid OTP (1234)...');
    const loginResponse = await fetch(`${API_URL}/authentications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        otp: '1234', // Wrong OTP
        uniq: uniq,
        phone: testPhone
      })
    });
    
    const loginResult = await loginResponse.json();
    console.log('Login Response:', loginResult);
    
    if (!loginResponse.ok && loginResult.error === 'Invalid OTP') {
      console.log('✅ Invalid OTP properly rejected!');
    } else {
      console.log('❌ Invalid OTP should have been rejected');
    }
    
    // Step 3: Test with expired uniq
    console.log('\n⏰ Step 3: Testing with non-existent uniq...');
    const expiredResponse = await fetch(`${API_URL}/authentications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        otp: '1234',
        uniq: 'FAKE_UNIQ_ID_123',
        phone: testPhone
      })
    });
    
    const expiredResult = await expiredResponse.json();
    console.log('Expired Response:', expiredResult);
    
    if (!expiredResponse.ok && expiredResult.error === 'Invalid or expired OTP') {
      console.log('✅ Non-existent OTP properly rejected!');
    } else {
      console.log('❌ Non-existent OTP should have been rejected');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testInvalidOTP();
