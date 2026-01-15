import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("Google Integration", () => {
  it("should have Google OAuth credentials configured", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const status = await caller.google.getSyncStatus();

    expect(status).toBeDefined();
    expect(status.configured).toBe(true);
    expect(status.accountEmail).toBe("secretary.omega2@gmail.com");
  });

  it("should generate Google OAuth authorization URL", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.google.getAuthUrl();

    expect(result).toBeDefined();
    expect(result.url).toBeDefined();
    expect(typeof result.url).toBe("string");
    expect(result.url).toContain("accounts.google.com");
    expect(result.url).toContain("oauth2");
  });

  it("should verify Google refresh token is authenticated", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const status = await caller.google.getSyncStatus();

    expect(status).toBeDefined();
    expect(status.authenticated).toBe(true);
    expect(status.accountEmail).toBe("secretary.omega2@gmail.com");
  });
});
