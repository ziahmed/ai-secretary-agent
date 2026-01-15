/**
 * Test script to check Gmail API send permission and diagnose errors
 */

import { google } from 'googleapis';

async function testGmailSend() {
  console.log('=== Testing Gmail API Send Permission ===\n');
  
  // Check environment variables
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  const accountEmail = process.env.GOOGLE_ACCOUNT_EMAIL;
  
  console.log('Environment Check:');
  console.log('✓ GOOGLE_CLIENT_ID:', clientId ? 'Set' : 'Missing');
  console.log('✓ GOOGLE_CLIENT_SECRET:', clientSecret ? 'Set' : 'Missing');
  console.log('✓ GOOGLE_REFRESH_TOKEN:', refreshToken ? 'Set' : 'Missing');
  console.log('✓ GOOGLE_ACCOUNT_EMAIL:', accountEmail || 'Not set');
  console.log('');
  
  if (!clientId || !clientSecret || !refreshToken) {
    console.error('❌ Missing required credentials');
    return;
  }
  
  try {
    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    
    // Get access token to check scopes
    console.log('Getting access token...');
    const { credentials } = await oauth2Client.refreshAccessToken();
    console.log('✓ Access token obtained');
    console.log('  Scopes:', credentials.scope);
    console.log('');
    
    // Check if gmail.send scope is present
    const hasGmailSend = credentials.scope?.includes('gmail.send');
    console.log('Gmail Send Permission:', hasGmailSend ? '✓ Granted' : '❌ Missing');
    
    if (!hasGmailSend) {
      console.log('\n⚠️  The refresh token does NOT have gmail.send permission!');
      console.log('   You need to re-authorize the app to grant send permission.');
      console.log('   Steps:');
      console.log('   1. Go to Google Sync page');
      console.log('   2. Click "Authorize with Google"');
      console.log('   3. Sign in and grant all permissions');
      console.log('   4. Copy the new refresh token');
      console.log('   5. Update GOOGLE_REFRESH_TOKEN in Settings → Secrets');
      return;
    }
    
    // Try to send a test email
    console.log('\nAttempting to send test email...');
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    
    const testEmail = [
      `From: ${accountEmail}`,
      `To: ${accountEmail}`,
      'Subject: Test Email from AI Secretary',
      'Content-Type: text/plain; charset=UTF-8',
      '',
      'This is a test email to verify Gmail API send permission is working.',
    ].join('\r\n');
    
    const encodedEmail = Buffer.from(testEmail)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    
    const result = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedEmail,
      },
    });
    
    console.log('✓ Test email sent successfully!');
    console.log('  Message ID:', result.data.id);
    console.log('  Thread ID:', result.data.threadId);
    console.log('\n✅ Gmail API send permission is working correctly!');
    
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    if (error.response?.data) {
      console.error('   Details:', JSON.stringify(error.response.data, null, 2));
    }
    
    if (error.message.includes('insufficient')) {
      console.log('\n⚠️  Insufficient permissions - you need to re-authorize with gmail.send scope');
    }
  }
}

testGmailSend();
