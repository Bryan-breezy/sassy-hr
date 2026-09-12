import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { ForbiddenError } from "@shared/_core/errors";
import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import { SignJWT, jwtVerify } from "jose";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { ENV } from "./env";

// Utility function
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

export type SessionPayload = {
  openId: string;
  name: string;
};

class SDKServer {
  private getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }

  /**
   * Create a session token for a local user.
   * @example
   * const sessionToken = await sdk.createSessionToken("local:admin", { name: "Admin" });
   */
  async createSessionToken(
    openId: string,
    options: { expiresInMs?: number; name?: string } = {}
  ): Promise<string> {
    return this.signSession(
      {
        openId,
        name: options.name || "",
      },
      options
    );
  }

  async signSession(
    payload: SessionPayload,
    options: { expiresInMs?: number } = {}
  ): Promise<string> {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1000);
    const secretKey = this.getSessionSecret();

    return new SignJWT({
      openId: payload.openId,
      name: payload.name,
    })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime(expirationSeconds)
      .sign(secretKey);
  }

  async verifySession(
    cookieValue: string | undefined | null
  ): Promise<{ openId: string; name: string } | null> {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }

    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"],
      });
      const { openId, name } = payload as Record<string, unknown>;

      if (!isNonEmptyString(openId)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }

      return {
        openId,
        name: isNonEmptyString(name) ? name : "",
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }

  private parseCookies(cookieHeader: string | undefined) {
    if (!cookieHeader) {
      return new Map<string, string>();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }

  private getHeader(req: Request, name: string): string | undefined {
    const headers = (req as Request & { headers?: Record<string, string | string[] | undefined> }).headers ?? {};
    const value = headers[name] ?? headers[name.toLowerCase()];
    if (Array.isArray(value)) return value[0];
    return typeof value === "string" ? value : undefined;
  }

  async authenticateRequest(req: Request): Promise<User> {
    // 1. Prefer the session cookie.
    const cookies = this.parseCookies(this.getHeader(req, "cookie"));
    let sessionToken = cookies.get(COOKIE_NAME);

    // 2. Fallback to the Authorization header (Bearer token).
    if (!sessionToken) {
      const authHeader = this.getHeader(req, "authorization");
      if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
        sessionToken = authHeader.slice(7);
      }
    }

    const session = await this.verifySession(sessionToken);

    if (!session) {
      throw ForbiddenError("Invalid session");
    }

    let user = await db.getUserByOpenId(session.openId);

    if (!user) {
      // Check if this is a valid local user configured via environment
      const username = session.openId.startsWith("local:")
        ? session.openId.slice(6)
        : session.openId;
      const localUsers = (await import("./localAuth")).getLocalUsers();
      const localMatch = localUsers.find(u => u.username === username);

      if (localMatch) {
        const now = new Date();
        user = {
          id: 1,
          openId: session.openId,
          name: localMatch.displayName,
          email: null,
          loginMethod: "local",
          role: localMatch.role,
          createdAt: now,
          updatedAt: now,
          lastSignedIn: now,
        };
      }
    }

    if (!user) {
      throw ForbiddenError("User not found");
    }

    // Update lastSignedIn if DB is connected
    await db.upsertUser({ openId: user.openId, lastSignedIn: new Date() }).catch(() => {});

    return user;
  }
}

export const sdk = new SDKServer();
