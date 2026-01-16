import { describe, it, expect } from 'vitest';
import { generateJaaSToken, getJaaSConfig } from './_core/jaas';
import { ENV } from './_core/env';

describe('JaaS Integration', () => {
  it('should have JaaS credentials configured', () => {
    expect(ENV.jaasAppId).toBeTruthy();
    expect(ENV.jaasApiKey).toBeTruthy();
    expect(ENV.jaasPrivateKey).toBeTruthy();
  });

  it('should generate valid JWT token', async () => {
    const token = await generateJaaSToken({
      roomName: 'test-room-123',
      userName: 'Test User',
      userEmail: 'test@example.com',
      userId: 'user-123',
      moderator: true,
      enableRecording: true,
    });

    expect(token).toBeTruthy();
    expect(typeof token).toBe('string');
    
    // JWT should have 3 parts separated by dots
    const parts = token.split('.');
    expect(parts.length).toBe(3);
    
    // Decode header to verify structure
    const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
    expect(header.alg).toBe('RS256');
    expect(header.typ).toBe('JWT');
    expect(header.kid).toContain(ENV.jaasAppId);
    
    // Decode payload to verify claims
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    expect(payload.aud).toBe('jitsi');
    expect(payload.iss).toBe('chat');
    expect(payload.sub).toBe(ENV.jaasAppId);
    expect(payload.room).toBe('test-room-123');
    expect(payload.context.user.name).toBe('Test User');
    expect(payload.context.user.email).toBe('test@example.com');
    expect(payload.context.user.moderator).toBe(true);
    expect(payload.context.features.recording).toBe(true);
  });

  it('should generate token with default values', async () => {
    const token = await generateJaaSToken({
      roomName: 'default-room',
    });

    expect(token).toBeTruthy();
    
    const parts = token.split('.');
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    
    expect(payload.context.user.name).toBe('Guest');
    expect(payload.context.user.moderator).toBe(true);
    expect(payload.context.features.recording).toBe(true);
    expect(payload.context.features.transcription).toBe(false);
  });

  it('should generate token with recording disabled', async () => {
    const token = await generateJaaSToken({
      roomName: 'no-recording-room',
      enableRecording: false,
    });

    const parts = token.split('.');
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    
    expect(payload.context.features.recording).toBe(false);
  });

  it('should return correct JaaS config', () => {
    const config = getJaaSConfig();
    
    expect(config.domain).toBe('8x8.vc');
    expect(config.appId).toBe(ENV.jaasAppId);
    expect(config.scriptUrl).toBe(`https://8x8.vc/${ENV.jaasAppId}/external_api.js`);
  });

  it('should throw error if credentials are missing', async () => {
    // Save original values
    const originalAppId = ENV.jaasAppId;
    const originalApiKey = ENV.jaasApiKey;
    const originalPrivateKey = ENV.jaasPrivateKey;

    try {
      // Test missing app ID
      (ENV as any).jaasAppId = '';
      await expect(generateJaaSToken({ roomName: 'test' })).rejects.toThrow('JAAS_APP_ID is not configured');
      
      // Restore and test missing API key
      (ENV as any).jaasAppId = originalAppId;
      (ENV as any).jaasApiKey = '';
      await expect(generateJaaSToken({ roomName: 'test' })).rejects.toThrow('JAAS_API_KEY is not configured');
      
      // Restore and test missing private key
      (ENV as any).jaasApiKey = originalApiKey;
      (ENV as any).jaasPrivateKey = '';
      await expect(generateJaaSToken({ roomName: 'test' })).rejects.toThrow('JAAS_PRIVATE_KEY is not configured');
    } finally {
      // Restore original values
      (ENV as any).jaasAppId = originalAppId;
      (ENV as any).jaasApiKey = originalApiKey;
      (ENV as any).jaasPrivateKey = originalPrivateKey;
    }
  });

  it('should generate token with custom expiration time', async () => {
    const expiresIn = 3600; // 1 hour
    const beforeGeneration = Math.floor(Date.now() / 1000);
    
    const token = await generateJaaSToken({
      roomName: 'custom-expiry-room',
      expiresIn,
    });

    const parts = token.split('.');
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    
    const afterGeneration = Math.floor(Date.now() / 1000);
    
    // Check that exp is approximately now + expiresIn (within 5 seconds tolerance)
    expect(payload.exp).toBeGreaterThanOrEqual(beforeGeneration + expiresIn);
    expect(payload.exp).toBeLessThanOrEqual(afterGeneration + expiresIn + 5);
    
    // Check that iat is approximately now
    expect(payload.iat).toBeGreaterThanOrEqual(beforeGeneration);
    expect(payload.iat).toBeLessThanOrEqual(afterGeneration);
  });
});
