/**
 * LOCAL_USERS — parsed from USER_CREDENTIALS env var.
 * Format: "username1:password1,username2:password2"
 * Role is always "user" for these entries.
 */
function parseUserCredentials(raw: string): Array<{ username: string; password: string }> {
  if (!raw.trim()) return [];
  return raw
    .split(",")
    .map(pair => pair.trim())
    .filter(Boolean)
    .map(pair => {
      const colonIdx = pair.indexOf(":");
      if (colonIdx < 1) return null;
      return {
        username: pair.slice(0, colonIdx).trim(),
        password: pair.slice(colonIdx + 1).trim(),
      };
    })
    .filter((x): x is { username: string; password: string } => x !== null);
}

export const ENV = {
  // Local authentication uses the existing signed-session utility; no third-party OAuth is used.
  appId: "local-app",
  oAuthServerUrl: "",
  cookieSecret: process.env.JWT_SECRET ?? "local-development-secret-change-me",
  googleSheetsSpreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  /** Admin credential */
  adminUsername: process.env.ADMIN_USERNAME ?? "",
  adminPassword: process.env.ADMIN_PASSWORD ?? "",
  /** Extra regular users */
  userCredentials: parseUserCredentials(process.env.USER_CREDENTIALS ?? ""),
};
