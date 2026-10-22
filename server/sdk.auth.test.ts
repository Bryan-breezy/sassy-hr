import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Request } from "express";

vi.mock("./db", () => ({
  getUserByOpenId: vi.fn(),
  upsertUser: vi.fn(),
}));

import * as db from "./db";
import { sdk } from "./_core/sdk";

describe("session credential precedence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses the refreshed bearer token instead of a stale session cookie", async () => {
    const client = {
      id: 2,
      openId: "local:client",
      name: "Client",
      email: null,
      loginMethod: "local",
      role: "user" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };
    vi.mocked(db.getUserByOpenId).mockResolvedValue(client);
    vi.mocked(db.upsertUser).mockResolvedValue(undefined);

    const bearerToken = await sdk.createSessionToken(client.openId, { name: client.name });
    const staleCookieToken = await sdk.createSessionToken("local:admin", { name: "Admin" });

    const user = await sdk.authenticateRequest({
      headers: {
        authorization: `Bearer ${bearerToken}`,
        cookie: `app_session_id=${staleCookieToken}`,
      },
    } as Request);

    expect(user.openId).toBe(client.openId);
    expect(db.getUserByOpenId).toHaveBeenCalledWith(client.openId);
  });
});
