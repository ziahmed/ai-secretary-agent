import { describe, it, expect, beforeAll } from 'vitest';
import * as db from './db';

describe('Meeting Conflict Detection', () => {
  let testUserId: number;
  let meeting1Id: number;
  let meeting2Id: number;

  beforeAll(async () => {
    // Create a test user
    await db.upsertUser({
      openId: 'test-conflict-user',
      name: 'Test Conflict User',
      email: 'conflict@test.com',
    });
    
    const user = await db.getUserByOpenId('test-conflict-user');
    testUserId = user!.id;
  });

  it('should detect conflict when meetings overlap completely', async () => {
    // Create first meeting: 2PM - 3PM
    const meeting1Date = new Date('2026-02-01T14:00:00Z');
    const meeting1 = await db.createMeeting({
      title: 'Meeting 1',
      meetingDate: meeting1Date,
      duration: 60,
      createdBy: testUserId,
    });
    meeting1Id = meeting1.id;

    // Check for conflicts with same time: 2PM - 3PM
    const conflicts = await db.checkMeetingConflicts(meeting1Date, 60);
    
    expect(conflicts.length).toBeGreaterThan(0);
    expect(conflicts.some(c => c.id === meeting1Id)).toBe(true);
  });

  it('should detect conflict when new meeting starts during existing meeting', async () => {
    // Existing meeting: 2PM - 3PM (from previous test)
    // New meeting: 2:30PM - 3:30PM
    const newMeetingDate = new Date('2026-02-01T14:30:00Z');
    const conflicts = await db.checkMeetingConflicts(newMeetingDate, 60);
    
    expect(conflicts.length).toBeGreaterThan(0);
    expect(conflicts.some(c => c.id === meeting1Id)).toBe(true);
  });

  it('should detect conflict when new meeting ends during existing meeting', async () => {
    // Existing meeting: 2PM - 3PM
    // New meeting: 1:30PM - 2:30PM
    const newMeetingDate = new Date('2026-02-01T13:30:00Z');
    const conflicts = await db.checkMeetingConflicts(newMeetingDate, 60);
    
    expect(conflicts.length).toBeGreaterThan(0);
    expect(conflicts.some(c => c.id === meeting1Id)).toBe(true);
  });

  it('should detect conflict when new meeting completely contains existing meeting', async () => {
    // Existing meeting: 2PM - 3PM
    // New meeting: 1PM - 4PM
    const newMeetingDate = new Date('2026-02-01T13:00:00Z');
    const conflicts = await db.checkMeetingConflicts(newMeetingDate, 180);
    
    expect(conflicts.length).toBeGreaterThan(0);
    expect(conflicts.some(c => c.id === meeting1Id)).toBe(true);
  });

  it('should NOT detect conflict when meetings are back-to-back', async () => {
    // Existing meeting: 2PM - 3PM
    // New meeting: 3PM - 4PM (starts exactly when first ends)
    const newMeetingDate = new Date('2026-02-01T15:00:00Z');
    const conflicts = await db.checkMeetingConflicts(newMeetingDate, 60);
    
    // Should not conflict with meeting1
    const hasConflict = conflicts.some(c => c.id === meeting1Id);
    expect(hasConflict).toBe(false);
  });

  it('should NOT detect conflict when meetings are separated', async () => {
    // Existing meeting: 2PM - 3PM
    // New meeting: 4PM - 5PM
    const newMeetingDate = new Date('2026-02-01T16:00:00Z');
    const conflicts = await db.checkMeetingConflicts(newMeetingDate, 60);
    
    // Should not conflict with meeting1
    const hasConflict = conflicts.some(c => c.id === meeting1Id);
    expect(hasConflict).toBe(false);
  });

  it('should exclude specified meeting ID from conflict check', async () => {
    // Check for conflicts at same time as meeting1, but exclude meeting1
    const meeting1Date = new Date('2026-02-01T14:00:00Z');
    const conflicts = await db.checkMeetingConflicts(meeting1Date, 60, meeting1Id);
    
    // Should not include meeting1 in conflicts
    expect(conflicts.some(c => c.id === meeting1Id)).toBe(false);
  });

  it('should NOT detect conflict with cancelled meetings', async () => {
    // Create a meeting and cancel it
    const meeting2Date = new Date('2026-02-02T10:00:00Z');
    const meeting2 = await db.createMeeting({
      title: 'Meeting 2',
      meetingDate: meeting2Date,
      duration: 60,
      createdBy: testUserId,
    });
    meeting2Id = meeting2.id;

    // Cancel the meeting
    await db.updateMeeting(meeting2Id, { status: 'cancelled' });

    // Check for conflicts at same time
    const conflicts = await db.checkMeetingConflicts(meeting2Date, 60);
    
    // Should not include cancelled meeting
    expect(conflicts.some(c => c.id === meeting2Id)).toBe(false);
  });
});
