import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { appRouter } from './routers';
import * as db from './db';

describe('Webhook - Jitsi Recording Processing', () => {
  let testMeetingId: number;
  const testRoomCode = 'test-webhook-room-' + Date.now();

  beforeAll(async () => {
    // Create a test meeting with a Jitsi link
    const meeting = await db.createMeeting({
      title: 'Webhook Test Meeting',
      description: 'Testing automatic recording processing',
      meetingDate: new Date(),
      location: 'Virtual',
      meetLink: `https://meet.jit.si/${testRoomCode}`,
      participants: JSON.stringify(['test@example.com']),
      createdBy: 1,
    });
    testMeetingId = meeting.id;
  });

  afterAll(async () => {
    // Clean up test meeting
    if (testMeetingId) {
      await db.deleteMeeting(testMeetingId);
    }
  });

  it('should find meeting by room code', async () => {
    const meeting = await db.getMeetingByRoomCode(testRoomCode);
    expect(meeting).toBeDefined();
    expect(meeting?.id).toBe(testMeetingId);
    expect(meeting?.title).toBe('Webhook Test Meeting');
  });

  it('should handle webhook with missing meeting', async () => {
    const caller = appRouter.createCaller({ user: null, req: {} as any, res: {} as any });
    
    const result = await caller.webhook.jitsiRecordingComplete({
      roomName: 'nonexistent-room-12345',
      recordingUrl: 'https://example.com/recording.mp3',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Meeting not found');
  });

  it('should validate webhook input schema', async () => {
    const caller = appRouter.createCaller({ user: null, req: {} as any, res: {} as any });
    
    // Test with invalid types (should throw zod validation error)
    await expect(async () => {
      await caller.webhook.jitsiRecordingComplete({
        roomName: 123 as any, // Invalid type
        recordingUrl: null as any, // Invalid type
      });
    }).rejects.toThrow();
  });

  it('should extract room code from full Jitsi URL', async () => {
    const fullUrl = `https://meet.jit.si/${testRoomCode}`;
    const roomCode = fullUrl.split('/').pop();
    expect(roomCode).toBe(testRoomCode);
  });

  it('should handle transcription errors gracefully', async () => {
    // This test would require mocking the transcribeAudio function
    // to simulate a transcription failure
    const caller = appRouter.createCaller({ user: null, req: {} as any, res: {} as any });
    
    // Using an invalid URL should trigger an error in the transcription service
    const result = await caller.webhook.jitsiRecordingComplete({
      roomName: testRoomCode,
      recordingUrl: 'invalid-url',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Transcription failed');
  });
});

describe('Database - Meeting Room Code Query', () => {
  let testMeetingId: number;

  beforeAll(async () => {
    const meeting = await db.createMeeting({
      title: 'Room Code Query Test',
      description: 'Testing room code search',
      meetingDate: new Date(),
      location: 'Virtual',
      meetLink: 'https://meet.jit.si/unique-test-room-789',
      createdBy: 1,
    });
    testMeetingId = meeting.id;
  });

  afterAll(async () => {
    if (testMeetingId) {
      await db.deleteMeeting(testMeetingId);
    }
  });

  it('should find meeting by partial room code', async () => {
    const meeting = await db.getMeetingByRoomCode('unique-test-room-789');
    expect(meeting).toBeDefined();
    expect(meeting?.id).toBe(testMeetingId);
  });

  it('should return undefined for non-existent room code', async () => {
    const meeting = await db.getMeetingByRoomCode('does-not-exist-999');
    expect(meeting).toBeUndefined();
  });

  it('should handle room code with special characters', async () => {
    const specialMeeting = await db.createMeeting({
      title: 'Special Chars Test',
      description: 'Testing special characters in room code',
      meetingDate: new Date(),
      location: 'Virtual',
      meetLink: 'https://meet.jit.si/test-room_with-special.chars',
      createdBy: 1,
    });

    const found = await db.getMeetingByRoomCode('test-room_with-special.chars');
    expect(found).toBeDefined();
    expect(found?.id).toBe(specialMeeting.id);

    // Cleanup
    await db.deleteMeeting(specialMeeting.id);
  });
});
