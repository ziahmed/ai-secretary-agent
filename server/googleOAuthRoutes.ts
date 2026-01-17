import { Express } from 'express';
import { getTokensFromCode, getAuthUrl } from './googleApi';

export function registerGoogleOAuthRoutes(app: Express) {
  // Start Google OAuth flow
  app.get('/api/google/auth', (req, res) => {
    try {
      const authUrl = getAuthUrl();
      res.redirect(authUrl);
    } catch (error) {
      console.error('Failed to generate auth URL:', error);
      res.status(500).send('Failed to start OAuth flow');
    }
  });

  // Google OAuth callback endpoint
  app.get('/api/google/callback', async (req, res) => {
    const code = req.query.code as string;
    const error = req.query.error as string;

    if (error) {
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Authorization Failed</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              max-width: 600px;
              margin: 100px auto;
              padding: 20px;
              text-align: center;
            }
            .error {
              color: #dc2626;
              font-size: 18px;
              margin: 20px 0;
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background: #2563eb;
              color: white;
              text-decoration: none;
              border-radius: 6px;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <h1>❌ Authorization Failed</h1>
          <p class="error">Error: ${error}</p>
          <a href="/google-sync" class="button">Try Again</a>
        </body>
        </html>
      `);
    }

    if (!code) {
      return res.status(400).send('Missing authorization code');
    }

    try {
      const tokens = await getTokensFromCode(code);
      const refreshToken = tokens.refresh_token;

      // Display the refresh token to the user
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Authorization Successful</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              max-width: 800px;
              margin: 50px auto;
              padding: 20px;
              line-height: 1.6;
            }
            h1 {
              color: #16a34a;
            }
            .token-box {
              background: #f3f4f6;
              border: 2px solid #d1d5db;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
              word-break: break-all;
              font-family: monospace;
              font-size: 14px;
            }
            .copy-button {
              background: #2563eb;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 6px;
              cursor: pointer;
              font-size: 14px;
              margin-top: 10px;
            }
            .copy-button:hover {
              background: #1d4ed8;
            }
            .instructions {
              background: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 15px;
              margin: 20px 0;
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background: #2563eb;
              color: white;
              text-decoration: none;
              border-radius: 6px;
              margin-top: 20px;
            }
            .success-icon {
              font-size: 48px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="success-icon">✅</div>
          <h1>Authorization Successful!</h1>
          <p>Google has authorized access to Calendar and Gmail for <strong>secretary.omega2@gmail.com</strong></p>
          
          <div class="instructions">
            <h3>📋 Next Steps:</h3>
            <ol>
              <li>Copy the refresh token below</li>
              <li>Go to <strong>Settings → Secrets</strong> in the Management UI</li>
              <li>Add a new secret with key: <code>GOOGLE_REFRESH_TOKEN</code></li>
              <li>Paste the token as the value</li>
              <li>Save and restart the application</li>
            </ol>
          </div>

          <h3>Your Refresh Token:</h3>
          <div class="token-box" id="token">${refreshToken || 'No refresh token received. You may need to revoke access and authorize again with "access_type=offline".'}</div>
          ${refreshToken ? '<button class="copy-button" onclick="copyToken()">📋 Copy Token</button>' : ''}
          
          <div style="margin-top: 30px;">
            <a href="/google-sync" class="button">Return to Google Sync</a>
          </div>

          <script>
            function copyToken() {
              const token = document.getElementById('token').textContent;
              navigator.clipboard.writeText(token).then(() => {
                alert('Token copied to clipboard!');
              }).catch(err => {
                console.error('Failed to copy:', err);
                alert('Failed to copy. Please select and copy manually.');
              });
            }
          </script>
        </body>
        </html>
      `);
    } catch (error) {
      console.error('OAuth callback error:', error);
      res.status(500).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Authorization Error</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              max-width: 600px;
              margin: 100px auto;
              padding: 20px;
              text-align: center;
            }
            .error {
              color: #dc2626;
              font-size: 16px;
              margin: 20px 0;
              padding: 20px;
              background: #fee2e2;
              border-radius: 8px;
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background: #2563eb;
              color: white;
              text-decoration: none;
              border-radius: 6px;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <h1>❌ Authorization Error</h1>
          <div class="error">
            <p>Failed to exchange authorization code for tokens.</p>
            <p><small>${error instanceof Error ? error.message : 'Unknown error'}</small></p>
          </div>
          <a href="/google-sync" class="button">Try Again</a>
        </body>
        </html>
      `);
    }
  });
}
