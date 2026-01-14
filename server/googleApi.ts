import { google, Auth } from 'googleapis';

type OAuth2Client = Auth.OAuth2Client;

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/gmail.readonly',
];

let oauth2Client: OAuth2Client | null = null;

export function getOAuth2Client() {
  if (!oauth2Client) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/google/callback';

    if (!clientId || !clientSecret) {
      throw new Error('Google OAuth credentials not configured');
    }

    oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

    // Set refresh token if available
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
    if (refreshToken) {
      oauth2Client.setCredentials({
        refresh_token: refreshToken,
      });
    }
  }

  return oauth2Client;
}

export function getAuthUrl() {
  const client = getOAuth2Client();
  return client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });
}

export async function getTokensFromCode(code: string) {
  const client = getOAuth2Client();
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);
  return tokens;
}

export async function listCalendarEvents(maxResults = 50) {
  const client = getOAuth2Client();
  const calendar = google.calendar({ version: 'v3', auth: client });

  const response = await calendar.events.list({
    calendarId: 'primary',
    timeMin: new Date().toISOString(),
    maxResults,
    singleEvents: true,
    orderBy: 'startTime',
  });

  return response.data.items || [];
}

export async function listGmailMessages(maxResults = 50, query?: string) {
  const client = getOAuth2Client();
  const gmail = google.gmail({ version: 'v1', auth: client });

  const response = await gmail.users.messages.list({
    userId: 'me',
    maxResults,
    q: query,
  });

  return response.data.messages || [];
}

export async function getGmailMessage(messageId: string) {
  const client = getOAuth2Client();
  const gmail = google.gmail({ version: 'v1', auth: client });

  const response = await gmail.users.messages.get({
    userId: 'me',
    id: messageId,
    format: 'full',
  });

  return response.data;
}

export async function parseEmailForMeetingInfo(messageId: string) {
  const message = await getGmailMessage(messageId);
  
  const headers = message.payload?.headers || [];
  const subject = headers.find(h => h.name?.toLowerCase() === 'subject')?.value || '';
  const from = headers.find(h => h.name?.toLowerCase() === 'from')?.value || '';
  const date = headers.find(h => h.name?.toLowerCase() === 'date')?.value || '';

  let body = '';
  if (message.payload?.body?.data) {
    body = Buffer.from(message.payload.body.data, 'base64').toString('utf-8');
  } else if (message.payload?.parts) {
    for (const part of message.payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        body += Buffer.from(part.body.data, 'base64').toString('utf-8');
      }
    }
  }

  return {
    subject,
    from,
    date,
    body,
    snippet: message.snippet || '',
  };
}
