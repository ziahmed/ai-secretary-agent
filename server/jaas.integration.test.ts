import { describe, it, expect } from 'vitest';
import { generateJaaSToken, getJaaSConfig } from './_core/jaas';

describe('JaaS Integration', () => {
  it('should generate valid JWT token with correct kid format', () => {
    const token = generateJaaSToken({
      roomName: 'test-room',
      userName: 'Test User',
      userEmail: 'test@example.com',
    });

    expect(token).toBeTruthy();
    expect(typeof token).toBe('string');
    
    // Decode JWT header to check kid format
    const [headerB64] = token.split('.');
    const header = JSON.parse(Buffer.from(headerB64, 'base64').toString());
    
    expect(header.kid).toBeTruthy();
    expect(header.kid).toMatch(/^vpaas-magic-cookie-[a-f0-9]+\/[a-zA-Z0-9]+$/);
    expect(header.alg).toBe('RS256');
    expect(header.typ).toBe('JWT');
    
    console.log('Generated JWT header:', header);
  });

  it('should have correct payload structure', () => {
    const token = generateJaaSToken({
      roomName: 'test-room',
      userName: 'Test User',
    });

    // Decode JWT payload
    const [, payloadB64] = token.split('.');
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString());
    
    expect(payload.aud).toBe('jitsi');
    expect(payload.iss).toBe('chat');
    expect(payload.sub).toMatch(/^vpaas-magic-cookie-/);
    expect(payload.room).toBe('*');
    expect(payload.context.user.name).toBe('Test User');
    expect(payload.context.features.recording).toBe(true);
    
    console.log('Generated JWT payload:', JSON.stringify(payload, null, 2));
  });

  it('should return correct JaaS config', () => {
    const config = getJaaSConfig();
    
    expect(config.domain).toBe('8x8.vc');
    expect(config.appId).toMatch(/^vpaas-magic-cookie-/);
    expect(config.scriptUrl).toContain('8x8.vc');
    expect(config.scriptUrl).toContain('/external_api.js');
  });
});
