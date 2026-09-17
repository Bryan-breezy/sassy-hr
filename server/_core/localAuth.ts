import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { ENV } from "./env";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export type LocalUser = {
  username: string;
  password: string;
  role: "admin" | "user";
  displayName: string;
};

/**
 * Build the list of valid local users from environment variables.
 * The admin account is always available when ADMIN_USERNAME is set.
 * Additional regular users can be supplied via USER_CREDENTIALS.
 */
export function getLocalUsers(): LocalUser[] {
  const users: LocalUser[] = [];

  if (ENV.adminUsername) {
    users.push({
      username: ENV.adminUsername,
      password: ENV.adminPassword,
      role: "admin",
      displayName: ENV.adminUsername,
    });
  }

  for (const { username, password } of ENV.userCredentials) {
    users.push({ username, password, role: "user", displayName: username });
  }

  return users;
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

function verifyPassword(password: string, storedHash: string) {
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const actual = scryptSync(password, salt, expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

// ─── Basic in-memory login rate limiting ──────────────────────────────────
// Per-warm-instance protection against password guessing on /api/auth/login.
// In a serverless environment this resets on cold start and isn't shared
// across instances, so it's not an absolute guarantee — but it stops the
// common case (a script hammering the endpoint over one connection) at
// negligible cost. For a stronger guarantee, back this with a shared store
// (e.g. Redis) instead.
const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

type LoginAttempt = { count: number; windowStart: number };
const loginAttempts = new Map<string, LoginAttempt>();

function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length) return forwarded.split(",")[0].trim();
  return req.socket.remoteAddress ?? "unknown";
}

function loginRateLimitKey(req: Request, username: string) {
  return `${getClientIp(req)}:${username.trim().toLowerCase()}`;
}

/** Returns seconds remaining if currently rate-limited, otherwise null. */
function checkRateLimit(key: string): number | null {
  const attempt = loginAttempts.get(key);
  if (!attempt) return null;

  const elapsed = Date.now() - attempt.windowStart;
  if (elapsed > LOGIN_WINDOW_MS) {
    loginAttempts.delete(key);
    return null;
  }

  if (attempt.count >= LOGIN_MAX_ATTEMPTS) {
    return Math.ceil((LOGIN_WINDOW_MS - elapsed) / 1000);
  }

  return null;
}

function recordFailedLoginAttempt(key: string) {
  const now = Date.now();
  const existing = loginAttempts.get(key);
  if (!existing || now - existing.windowStart > LOGIN_WINDOW_MS) {
    loginAttempts.set(key, { count: 1, windowStart: now });
  } else {
    existing.count += 1;
  }
}

function clearLoginAttempts(key: string) {
  loginAttempts.delete(key);
}

async function createSession(res: Response, req: Request, openId: string, name: string, role: "user" | "admin") {
  const sessionToken = await sdk.createSessionToken(openId, { name, expiresInMs: ONE_YEAR_MS });
  const cookieOptions = getSessionCookieOptions(req);
  res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
  res.json({ ok: true, role, token: sessionToken });
}

export function registerLocalAuthRoutes(app: Express) {
  /**
   * POST /api/auth/login
   * Body: { username: string; password: string }
   * Returns: { ok: true } on success or { error: string } on failure.
   */
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    const { username, password } = req.body ?? {};

    if (typeof username !== "string" || typeof password !== "string") {
      res.status(400).json({ error: "username and password are required" });
      return;
    }

    const rateLimitKey = loginRateLimitKey(req, username);
    const retryAfterSeconds = checkRateLimit(rateLimitKey);
    if (retryAfterSeconds !== null) {
      const minutes = Math.ceil(retryAfterSeconds / 60);
      res.setHeader("Retry-After", String(retryAfterSeconds));
      res.status(429).json({
        error: `Too many failed sign-in attempts. Please try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
      });
      return;
    }

    const localUsers = getLocalUsers();

    const match = localUsers.find(
      u => u.username === username.trim() && u.password === password
    );

    const storedUser = match ? null : await db.getUserByUsername(username.trim());
    if (!match && (!storedUser?.passwordHash || !verifyPassword(password, storedUser.passwordHash))) {
      recordFailedLoginAttempt(rateLimitKey);
      // Avoid leaking whether the username or password was wrong.
      res.status(401).json({ error: "Invalid username or password." });
      return;
    }

    clearLoginAttempts(rateLimitKey);

    const openId = match ? `local:${match.username}` : storedUser!.openId;
    const displayName = match?.displayName ?? storedUser!.name ?? storedUser!.username ?? username.trim();
    const role = match?.role ?? storedUser!.role;

    try {
      await db.upsertUser({
        openId,
        name: displayName,
        email: null,
        loginMethod: "local",
        role,
        lastSignedIn: new Date(),
      });

      await createSession(res, req, openId, displayName, role);
    } catch (error) {
      console.error("[LocalAuth] Login failed", error);
      const message = error instanceof Error ? error.message : "";
      const isSheetsError = message.includes("Google Sheets") || message.includes("Google Apps Script");
      res.status(500).json({
        error: isSheetsError
          ? "Google Sheets connection failed. Check that the deployed Apps Script ACCESS_TOKEN matches GOOGLE_APPS_SCRIPT_TOKEN."
          : "Login failed. Please try again.",
      });
    }
  });

  app.post("/api/auth/signup", async (req: Request, res: Response) => {
    const { name, username, password } = req.body ?? {};
    if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 120 ||
      typeof username !== "string" || username.trim().length < 3 || username.trim().length > 80 ||
      typeof password !== "string" || password.length < 8) {
      res.status(400).json({ error: "Enter a name, a username, and a password of at least 8 characters." });
      return;
    }

    const normalizedUsername = username.trim();
    try {
      const existing = getLocalUsers().some(user => user.username.toLowerCase() === normalizedUsername.toLowerCase())
        || Boolean(await db.getUserByUsername(normalizedUsername));
      if (existing) {
        res.status(409).json({ error: "That username is already in use." });
        return;
      }

      const openId = `local:${normalizedUsername}`;
      await db.upsertUser({
        openId,
        username: normalizedUsername,
        name: name.trim(),
        passwordHash: hashPassword(password),
        loginMethod: "local",
        role: "user",
        lastSignedIn: new Date(),
      });
      await createSession(res, req, openId, name.trim(), "user");
    } catch (error) {
      console.error("[LocalAuth] Signup failed", error);
      res.status(500).json({ error: "Sign-up failed. Please try again." });
    }
  });
}
