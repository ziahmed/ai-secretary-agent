import { ENV } from './env';
import jwt from 'jsonwebtoken';

interface JaaSTokenOptions {
  roomName: string;
  userName?: string;
  userEmail?: string;
  userId?: string;
  moderator?: boolean;
  enableRecording?: boolean;
  enableTranscription?: boolean;
  expiresIn?: number; // seconds, default 7200 (2 hours)
}

/**
 * Generate a JWT token for JaaS (Jitsi as a Service)
 * @param options Token generation options
 * @returns JWT token string
 */
export async function generateJaaSToken(options: JaaSTokenOptions): Promise<string> {
  const {
    roomName,
    userName = 'Guest',
    userEmail,
    userId,
    moderator = true,
    enableRecording = true,
    enableTranscription = false,
    expiresIn = 7200, // 2 hours default
  } = options;

  // Validate required environment variables
  if (!ENV.jaasAppId) {
    console.error('[JaaS] JAAS_APP_ID is not configured');
    throw new Error('JAAS_APP_ID is not configured');
  }
  if (!ENV.jaasApiKey) {
    console.error('[JaaS] JAAS_API_KEY is not configured');
    throw new Error('JAAS_API_KEY is not configured');
  }
  if (!ENV.jaasPrivateKey) {
    console.error('[JaaS] JAAS_PRIVATE_KEY is not configured');
    throw new Error('JAAS_PRIVATE_KEY is not configured');
  }
  
  console.log('[JaaS] Generating token for room:', roomName);
  console.log('[JaaS] App ID:', ENV.jaasAppId);
  console.log('[JaaS] API Key:', ENV.jaasApiKey);

  const now = Math.floor(Date.now() / 1000);
  const exp = now + expiresIn;

  // JWT header
  const header = {
    alg: 'RS256',
    typ: 'JWT',
    kid: `${ENV.jaasAppId}/${ENV.jaasApiKey}`,
  };

  // JWT payload
  const payload = {
    aud: 'jitsi',
    iss: 'chat',
    iat: now,
    exp: exp,
    nbf: now - 5, // Not before: 5 seconds ago to account for clock skew
    sub: ENV.jaasAppId,
    context: {
      user: {
        'hidden-from-recorder': false,
        moderator: moderator,
        name: userName,
        id: userId || `user-${now}`,
        avatar: '',
        email: userEmail || '',
      },
      features: {
        livestreaming: false,
        'file-upload': false,
        'outbound-call': false,
        'sip-outbound-call': false,
        transcription: enableTranscription,
        'list-visitors': false,
        recording: enableRecording,
        flip: false,
      },
    },
    room: '*', // Wildcard allows access to all rooms
  };

  // Use jsonwebtoken library for signing
  
  // Format private key (handle both single-line and multi-line formats)
  let privateKey = ENV.jaasPrivateKey;
  
  // If key contains \\n as literal characters, replace with actual newlines
  if (privateKey.includes('\\n')) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }
  
  // If key doesn't have newlines, format it properly
  if (!privateKey.includes('\n')) {
    // Extract the key content between headers
    const match = privateKey.match(/-----BEGIN PRIVATE KEY-----(.*?)-----END PRIVATE KEY-----/);
    if (match) {
      const keyContent = match[1];
      // Split into 64-character lines
      const lines = keyContent.match(/.{1,64}/g) || [];
      privateKey = `-----BEGIN PRIVATE KEY-----\n${lines.join('\n')}\n-----END PRIVATE KEY-----`;
    }
  }

  try {
    const token = jwt.sign(payload, privateKey, {
      algorithm: 'RS256',
      header: header,
    });
    
    console.log('[JaaS] Token generated successfully');
    console.log('[JaaS] Token payload:', JSON.stringify(payload, null, 2));
    console.log('[JaaS] Token header:', JSON.stringify(header, null, 2));
    return token;
  } catch (error) {
    console.error('[JaaS] Failed to sign JWT token:', error);
    throw new Error(`Failed to generate JaaS token: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get JaaS configuration
 * @returns JaaS config object
 */
export function getJaaSConfig() {
  return {
    domain: '8x8.vc',
    appId: ENV.jaasAppId,
    scriptUrl: `https://8x8.vc/${ENV.jaasAppId}/external_api.js`,
  };
}
