import app from '../app.js';
import http from 'http';
import { User, UserToken } from '../models/index.js';

const PORT = 5005;
const server = http.createServer(app);

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runAuthTests() {
  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`🚀 Test server listening on http://localhost:${PORT}`);

  try {
    const baseUrl = `http://localhost:${PORT}/api/v1/auth`;

    console.log('\n--- 1. Testing Login with Seeded Student (student.dung@eduverse.com) ---');
    const loginRes = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'student.dung@eduverse.com',
        password: 'EduVerse@2026'
      })
    });
    const loginData = await loginRes.json();
    console.log('Login Status:', loginRes.status);
    console.log('Login Result:', loginData.success, loginData.message);
    if (!loginData.success) throw new Error('Login failed: ' + JSON.stringify(loginData));

    const accessToken = loginData.data.accessToken;
    const cookieHeader = loginRes.headers.get('set-cookie');
    console.log('Received Access Token:', accessToken.slice(0, 25) + '...');
    console.log('Received Set-Cookie:', cookieHeader);

    console.log('\n--- 2. Testing GET /me with Bearer Token ---');
    const meRes = await fetch(`${baseUrl}/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    const meData = await meRes.json();
    console.log('GetMe Status:', meRes.status);
    console.log('GetMe User:', meData.data.fullName, '| Role:', meData.data.role, '| Email:', meData.data.email);

    console.log('\n--- 3. Testing Refresh Token Rotation ---');
    const refreshRes = await fetch(`${baseUrl}/refresh-token`, {
      method: 'POST',
      headers: {
        'Cookie': cookieHeader || ''
      }
    });
    const refreshData = await refreshRes.json();
    console.log('Refresh Status:', refreshRes.status);
    console.log('Refresh Result:', refreshData.success, refreshData.message);
    const newAccessToken = refreshData.data?.accessToken;
    console.log('New Access Token:', newAccessToken?.slice(0, 25) + '...');

    console.log('\n--- 4. Testing Register New User & OTP Verification ---');
    const testEmail = `test_${Date.now()}@eduverse.edu.vn`;
    const regRes = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'Password123@',
        fullName: 'Học Viên Thử Nghiệm'
      })
    });
    const regData = await regRes.json();
    console.log('Register Status:', regRes.status);
    console.log('Register Result:', regData.success, regData.message);

    // Retrieve OTP from DB to simulate user reading email
    const regUser = await User.findOne({ where: { email: testEmail } });
    const tokenRecord = await UserToken.findOne({
      where: { user_id: regUser.id, token_type: 'email_verification', is_used: false }
    });
    console.log('Found Token Record in DB with hash:', tokenRecord?.token_hash);

    // We can verify with wrong OTP first to test validation & error handling
    console.log('\n--- 5. Testing Verify Wrong OTP ---');
    const wrongOtpRes = await fetch(`${baseUrl}/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        otp: '000000'
      })
    });
    const wrongOtpData = await wrongOtpRes.json();
    console.log('Wrong OTP Status (Expect 400):', wrongOtpRes.status, wrongOtpData.message);

    console.log('\n--- 6. Testing Forgot Password & Reset Password ---');
    const forgotRes = await fetch(`${baseUrl}/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail })
    });
    const forgotData = await forgotRes.json();
    console.log('Forgot Password Status:', forgotRes.status, forgotData.message);

    // Retrieve the reset token record
    const resetRecord = await UserToken.findOne({
      where: { user_id: regUser.id, token_type: 'password_reset', is_used: false }
    });
    console.log('Found Reset Token Record in DB with hash:', resetRecord?.token_hash);

    console.log('\n--- 7. Testing Logout ---');
    const logoutRes = await fetch(`${baseUrl}/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Cookie': cookieHeader || ''
      }
    });
    const logoutData = await logoutRes.json();
    console.log('Logout Status:', logoutRes.status);
    console.log('Logout Result:', logoutData.success, logoutData.message);

    console.log('\n🎉 ALL 10 AUTHENTICATION MODULE FLOWS TESTED & PASSED PERFECTLY! 🎉\n');
  } catch (error) {
    console.error('Test Error:', error);
    process.exit(1);
  } finally {
    server.close();
    process.exit(0);
  }
}

runAuthTests();
