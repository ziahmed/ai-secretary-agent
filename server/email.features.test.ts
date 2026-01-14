import { describe, expect, it } from "vitest";
import { sendMeetingInvite, sendMeetingUpdate, sendMeetingCancellation } from "./emailService";

describe("Email Features", () => {
  describe("sendMeetingInvite with Gmail API", () => {
    it("should handle meeting invite creation", async () => {
      const invite = {
        to: ["participant1@example.com", "participant2@example.com"],
        meetingTitle: "Team Sync Meeting",
        meetingDate: new Date("2026-02-15T10:00:00Z"),
        location: "Conference Room A",
        description: "Weekly team synchronization meeting",
        organizerEmail: "organizer@example.com",
        organizerName: "John Doe",
      };

      const result = await sendMeetingInvite(invite);
      expect(result).toBe(true);
    });

    it("should handle meeting invite without Gmail API credentials", async () => {
      // This test verifies graceful fallback when Gmail API is not configured
      const invite = {
        to: ["participant@example.com"],
        meetingTitle: "Quick Meeting",
        meetingDate: new Date("2026-02-20T14:00:00Z"),
        organizerEmail: "organizer@example.com",
        organizerName: "Jane Smith",
      };

      const result = await sendMeetingInvite(invite);
      expect(result).toBe(true);
    });
  });

  describe("sendMeetingUpdate", () => {
    it("should send meeting update notification", async () => {
      const invite = {
        to: ["participant@example.com"],
        meetingTitle: "Updated Meeting",
        meetingDate: new Date("2026-02-25T15:00:00Z"),
        location: "New Location",
        organizerEmail: "organizer@example.com",
        organizerName: "Organizer",
      };

      const changes = "Meeting time changed from 2:00 PM to 3:00 PM";
      const result = await sendMeetingUpdate(invite, changes);

      expect(result).toBe(true);
    });
  });

  describe("sendMeetingCancellation", () => {
    it("should send meeting cancellation notification", async () => {
      const invite = {
        to: ["participant@example.com"],
        meetingTitle: "Cancelled Meeting",
        meetingDate: new Date("2026-03-01T10:00:00Z"),
        location: "Conference Room B",
        organizerEmail: "organizer@example.com",
        organizerName: "Organizer",
      };

      const reason = "Project delayed, will reschedule next week";
      const result = await sendMeetingCancellation(invite, reason);

      expect(result).toBe(true);
    });

    it("should handle cancellation without reason", async () => {
      const invite = {
        to: ["team@example.com"],
        meetingTitle: "Cancelled Meeting",
        meetingDate: new Date("2026-03-10T14:00:00Z"),
        organizerEmail: "pm@example.com",
        organizerName: "Project Manager",
      };

      const result = await sendMeetingCancellation(invite);

      expect(result).toBe(true);
    });
  });

  describe("Email formatting", () => {
    it("should handle multiple participants", async () => {
      const participants = [
        "user1@example.com",
        "user2@example.com",
        "user3@example.com",
        "user4@example.com",
        "user5@example.com",
      ];

      const invite = {
        to: participants,
        meetingTitle: "All Hands Meeting",
        meetingDate: new Date("2026-03-15T09:00:00Z"),
        location: "Main Hall",
        description: "Quarterly all hands meeting",
        organizerEmail: "ceo@example.com",
        organizerName: "CEO",
      };

      const result = await sendMeetingInvite(invite);
      expect(result).toBe(true);
    });

    it("should handle special characters in meeting details", async () => {
      const invite = {
        to: ["participant@example.com"],
        meetingTitle: "Q&A Session: \"Innovation & Growth\"",
        meetingDate: new Date("2026-04-01T11:00:00Z"),
        location: "Room #42 (Building A)",
        description: "Discussion on company's innovation strategy & growth plans",
        organizerEmail: "hr@example.com",
        organizerName: "HR Team",
      };

      const result = await sendMeetingInvite(invite);
      expect(result).toBe(true);
    });
  });
});
