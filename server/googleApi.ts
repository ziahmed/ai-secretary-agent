import { google, Auth } from 'googleapis';

type OAuth2Client = Auth.OAuth2Client;

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/drive.file', // Access to files created by the app
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

/**
 * Upload a file to Google Drive
 * @param fileName Name of the file
 * @param fileContent File content as Buffer or string
 * @param mimeType MIME type of the file
 * @param folderPath Optional folder path (e.g., "Meeting Transcripts/Meeting Title")
 * @returns Google Drive file ID and web view link
 */
export async function uploadToGoogleDrive(
  fileName: string,
  fileContent: Buffer | string,
  mimeType: string,
  folderPath?: string
): Promise<{ fileId: string; webViewLink: string }> {
  const client = getOAuth2Client();
  const drive = google.drive({ version: 'v3', auth: client });

  let folderId: string | undefined;

  // Create folder structure if folderPath is provided
  if (folderPath) {
    const folders = folderPath.split('/').filter(f => f.trim());
    let parentId: string | undefined;

    for (const folderName of folders) {
      // Check if folder exists
      const searchResponse = await drive.files.list({
        q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false${parentId ? ` and '${parentId}' in parents` : ''}`,
        fields: 'files(id, name)',
        spaces: 'drive',
      });

      if (searchResponse.data.files && searchResponse.data.files.length > 0) {
        // Folder exists
        parentId = searchResponse.data.files[0].id!;
      } else {
        // Create folder
        const folderMetadata = {
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder',
          parents: parentId ? [parentId] : undefined,
        };

        const folderResponse = await drive.files.create({
          requestBody: folderMetadata,
          fields: 'id',
        });

        parentId = folderResponse.data.id!;
      }
    }

    folderId = parentId;
  }

  // Upload file
  const fileMetadata = {
    name: fileName,
    parents: folderId ? [folderId] : undefined,
  };

  // Convert buffer to readable stream for Google Drive API
  const { Readable } = await import('stream');
  const buffer = Buffer.isBuffer(fileContent) ? fileContent : Buffer.from(fileContent);
  const stream = Readable.from(buffer);

  const media = {
    mimeType,
    body: stream,
  };

  const response = await drive.files.create({
    requestBody: fileMetadata,
    media,
    fields: 'id, webViewLink',
  });

  return {
    fileId: response.data.id!,
    webViewLink: response.data.webViewLink!,
  };
}

/**
 * Download a file from Google Drive by extracting file ID from web view link
 * @param webViewLink Google Drive web view link (e.g., https://drive.google.com/file/d/FILE_ID/view)
 * @returns File content as string
 */
export async function downloadFromGoogleDrive(webViewLink: string): Promise<string> {
  // Extract file ID from web view link
  const fileIdMatch = webViewLink.match(/\/d\/([^\/]+)/);
  if (!fileIdMatch) {
    throw new Error('Invalid Google Drive link format');
  }
  const fileId = fileIdMatch[1];

  const client = getOAuth2Client();
  const drive = google.drive({ version: 'v3', auth: client });

  // Download file content
  const response = await drive.files.get(
    {
      fileId,
      alt: 'media',
    },
    { responseType: 'text' }
  );

  return response.data as string;
}
