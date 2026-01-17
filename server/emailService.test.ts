import { describe, expect, it } from "vitest";
import { sendMeetingInvite, sendMeetingUpdate } from "./emailService";

describe("emailService", () => {
  describe("sendMeetingInvite", () => {
    it("should successfully send meeting invite with all details", async () => {
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

    it("should handle meeting invite without optional fields", async () => {
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

    it("should handle multiple participants", async () => {
      const participants = [
        "user1@example.com",
        "user2@example.com",
        "user3@example.com",
        "user4@example.com",
      ];

      const invite = {
        to: participants,
        meetingTitle: "All Hands Meeting",
        meetingDate: new Date("2026-03-01T09:00:00Z"),
        location: "Main Hall",
        description: "Quarterly all hands meeting",
        organizerEmail: "ceo@example.com",
        organizerName: "CEO",
      };

      const result = await sendMeetingInvite(invite);

      expect(result).toBe(true);
    });
  });

  describe("sendMeetingUpdate", () => {
    it("should successfully send meeting update notification", async () => {
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

    it("should handle location change notification", async () => {
      const invite = {
        to: ["team@example.com"],
        meetingTitle: "Project Review",
        meetingDate: new Date("2026-03-10T11:00:00Z"),
        location: "Virtual - Zoom",
        organizerEmail: "pm@example.com",
        organizerName: "Project Manager",
      };

      const changes = "Location changed from Conference Room B to Virtual - Zoom";

      const result = await sendMeetingUpdate(invite, changes);

      expect(result).toBe(true);
    });
  });
});
