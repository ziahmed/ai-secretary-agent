import { describe, expect, it } from "vitest";
import { listCalendarEvents, listGmailMessages, parseEmailForMeetingInfo } from "./googleApi";

describe("Google Calendar and Gmail Sync", () => {
  describe("Calendar Sync", () => {
    it("should list calendar events successfully", async () => {
      try {
        const events = await listCalendarEvents(10);
        
        expect(events).toBeDefined();
        expect(Array.isArray(events)).toBe(true);
        expect(events.length).toBeGreaterThanOrEqual(0);
        
        console.log(`✓ Calendar API working: ${events.length} upcoming events found`);
        
        // If there are events, check structure
        if (events.length > 0) {
          const firstEvent = events[0];
          expect(firstEvent).toHaveProperty('summary');
          expect(firstEvent).toHaveProperty('start');
        }
      } catch (error: any) {
        console.error("Calendar API error:", error.message);
        throw error;
      }
    }, 60000); // 60 second timeout for API calls
  });

  describe("Gmail Sync", () => {
    it("should list Gmail messages successfully", async () => {
      try {
        const messages = await listGmailMessages(10);
        
        expect(messages).toBeDefined();
        expect(Array.isArray(messages)).toBe(true);
        expect(messages.length).toBeGreaterThanOrEqual(0);
        
        console.log(`✓ Gmail API working: ${messages.length} messages found`);
        
        // If there are messages, test parsing one
        if (messages.length > 0 && messages[0]?.id) {
          const parsedEmail = await parseEmailForMeetingInfo(messages[0].id);
          expect(parsedEmail).toBeDefined();
          expect(parsedEmail).toHaveProperty('subject');
          expect(parsedEmail).toHaveProperty('from');
          console.log(`✓ Email parsing working: "${parsedEmail.subject.substring(0, 50)}..."`);
        }
      } catch (error: any) {
        console.error("Gmail API error:", error.message);
        throw error;
      }
    }, 60000);
  });

  describe("Integration Test", () => {
    it("should handle both Calendar and Gmail API calls in sequence", async () => {
      // Test that both APIs can be called without conflicts
      const events = await listCalendarEvents(5);
      expect(Array.isArray(events)).toBe(true);
      
      const messages = await listGmailMessages(5);
      expect(Array.isArray(messages)).toBe(true);
      
      console.log("✓ Sequential API test passed");
      console.log(`  - Calendar: ${events.length} events`);
      console.log(`  - Gmail: ${messages.length} messages`);
    }, 120000); // 2 minute timeout for both calls
  });
});
