import { describe, expect, it } from "vitest";
import { getOAuth2Client } from "./googleApi";
import { google } from "googleapis";

describe("Google Refresh Token Validation", () => {
  it("should have GOOGLE_REFRESH_TOKEN environment variable set", () => {
    expect(process.env.GOOGLE_REFRESH_TOKEN).toBeDefined();
    expect(process.env.GOOGLE_REFRESH_TOKEN).toBeTruthy();
  });

  it("should create OAuth2 client with refresh token", () => {
    const client = getOAuth2Client();
    expect(client).toBeDefined();
    
    // Check that credentials are set
    const credentials = client.credentials;
    expect(credentials).toBeDefined();
    expect(credentials.refresh_token).toBe(process.env.GOOGLE_REFRESH_TOKEN);
  });

  it("should be able to refresh access token", async () => {
    const client = getOAuth2Client();
    
    try {
      // Attempt to get a fresh access token using the refresh token
      const { credentials } = await client.refreshAccessToken();
      
      expect(credentials).toBeDefined();
      expect(credentials.access_token).toBeDefined();
      expect(credentials.access_token).toBeTruthy();
      
      // Access token should be a string
      expect(typeof credentials.access_token).toBe("string");
    } catch (error: any) {
      // If this fails, the refresh token is invalid
      throw new Error(`Failed to refresh access token: ${error.message}`);
    }
  }, 30000); // 30 second timeout for API call

  it("should be able to access Calendar API", async () => {
    const client = getOAuth2Client();
    const calendar = google.calendar({ version: "v3", auth: client });
    
    try {
      // Try to list calendars (lightweight API call)
      const response = await calendar.calendarList.list({
        maxResults: 1,
      });
      
      expect(response.data).toBeDefined();
      expect(response.data.items).toBeDefined();
      expect(Array.isArray(response.data.items)).toBe(true);
    } catch (error: any) {
      throw new Error(`Failed to access Calendar API: ${error.message}`);
    }
  }, 30000);

  it("should be able to access Gmail API", async () => {
    const client = getOAuth2Client();
    const gmail = google.gmail({ version: "v1", auth: client });
    
    try {
      // Try to get user profile (lightweight API call)
      const response = await gmail.users.getProfile({
        userId: "me",
      });
      
      expect(response.data).toBeDefined();
      expect(response.data.emailAddress).toBeDefined();
      expect(response.data.emailAddress).toContain("@");
    } catch (error: any) {
      throw new Error(`Failed to access Gmail API: ${error.message}`);
    }
  }, 30000);
});
