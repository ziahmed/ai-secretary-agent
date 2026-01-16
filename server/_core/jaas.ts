/**
 * JaaS (Jitsi as a Service) JWT token generation
 * 
 * Generates JWT tokens for authenticating with JaaS and enabling premium features
 * like recording, transcription, and outbound calls.
 */

import { ENV } from "./env";

export type JaaSTokenOptions = {
  roomName: string;
  userName?: string;
  userEmail?: string;
  userId?: string;
  moderator?: boolean;
  enableRecording?: boolean;
  enableTranscription?: boolean;
  expiresIn?: number; // in seconds, default 7200 (2 hours)
};

/**
 * Generate a JWT token for JaaS authentication
 * 
 * @param options - Token configuration options
 * @returns JWT token string
 */
export async function generateJaaSToken(options: JaaSTokenOptions): Promise<string> {
  const {
    roomName,
    userName = 'Guest',
    userEmail = '',
    userId = '',
    moderator = true,
    enableRecording = true,
    enableTranscription = false,
    expiresIn = 7200, // 2 hours default
  } = options;

  if (!ENV.jaasAppId) {
    throw new Error('JAAS_APP_ID is not configured');
  }
  if (!ENV.jaasApiKey) {
    throw new Error('JAAS_API_KEY is not configured');
  }
  if (!ENV.jaasPrivateKey) {
    throw new Error('JAAS_PRIVATE_KEY is not configured');
  }

  const now = Math.floor(Date.now() / 1000);
  const exp = now + expiresIn;

  // JWT Header
  const header = {
    kid: `${ENV.jaasAppId}/${ENV.jaasApiKey}`,
    typ: 'JWT',
    alg: 'RS256',
  };

  // JWT Payload
  const payload = {
    aud: 'jitsi',
    iss: 'chat',
    iat: now,
    exp: exp,
    nbf: now - 5, // 5 seconds before to account for clock skew
    sub: ENV.jaasAppId,
    context: {
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
      user: {
        'hidden-from-recorder': false,
        moderator: moderator,
        name: userName,
        id: userId || `user-${now}`,
        avatar: '',
        email: userEmail,
      },
    },
    room: roomName,
  };

  // Use jsonwebtoken library for signing
  const jwt = await import('jsonwebtoken');
  
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

  const token = jwt.sign(payload, privateKey, {
    algorithm: 'RS256',
    header: header,
  });

  return token;
}

/**
 * Get JaaS configuration for frontend
 */
export function getJaaSConfig() {
  return {
    domain: '8x8.vc',
    appId: ENV.jaasAppId,
    scriptUrl: `https://8x8.vc/${ENV.jaasAppId}/external_api.js`,
  };
}
