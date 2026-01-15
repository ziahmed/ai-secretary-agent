import { describe, expect, it } from "vitest";
import { getOAuth2Client, getAuthUrl } from "./googleApi";

describe("Google OAuth Redirect URI Configuration", () => {
  it("should have GOOGLE_REDIRECT_URI environment variable set", () => {
    expect(process.env.GOOGLE_REDIRECT_URI).toBeDefined();
    expect(process.env.GOOGLE_REDIRECT_URI).toBe("https://omega2.manus.space/api/google/callback");
  });

  it("should create OAuth2 client with correct redirect URI", () => {
    const client = getOAuth2Client();
    expect(client).toBeDefined();
    
    // The client should be configured with the redirect URI
    const authUrl = getAuthUrl();
    expect(authUrl).toContain("redirect_uri=https%3A%2F%2Fomega2.manus.space%2Fapi%2Fgoogle%2Fcallback");
  });

  it("should not use localhost in redirect URI", () => {
    const authUrl = getAuthUrl();
    expect(authUrl).not.toContain("localhost");
    expect(authUrl).not.toContain("127.0.0.1");
  });

  it("should use HTTPS protocol in redirect URI", () => {
    const authUrl = getAuthUrl();
    expect(authUrl).toContain("https%3A%2F%2F"); // URL-encoded https://
  });

  it("should include required OAuth scopes", () => {
    const authUrl = getAuthUrl();
    expect(authUrl).toContain("calendar.readonly");
    expect(authUrl).toContain("gmail.readonly");
  });
});
