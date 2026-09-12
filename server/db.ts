import "dotenv/config";

type UserRow = {
  id: number;
  openId: string;
  username?: string;
  name: string | null;
  email: string | null;
  role: "user" | "admin";
  loginMethod: string | null;
  passwordHash?: string | null;
  lastSignedIn: Date;
  createdAt: Date;
  updatedAt: Date;
};

type PlanRow = {
  id: number;
  submittedBy: number;
  weekStart: string;
  totalCost: string;
  status: "submitted" | "reviewed";
  submittedAt: string;
  updatedAt: string;
};

type DailyRoute = {
  id?: number;
  routePlanId?: number;
  day: string;
  from: string;
  to: string;
  plannedArrival: string;
  departure: string;
  transportMode: string;
  cost: number;
};

function getCredentials() {
  const scriptUrl = process.env.GOOGLE_APPS_SCRIPT_URL ?? "";
  const scriptToken = process.env.GOOGLE_APPS_SCRIPT_TOKEN ?? "";
  if (!scriptUrl || !scriptToken) {
    throw new Error("Google Sheets is not configured. Set GOOGLE_APPS_SCRIPT_URL and GOOGLE_APPS_SCRIPT_TOKEN.");
  }
  return { scriptUrl, scriptToken };
}

export function validateGoogleSheetsConfig() {
  getCredentials();
}

async function sheetsRequest<T>(body: { action: "read" | "append" | "update"; range: string; values?: (string | number | null)[] }): Promise<T> {
  const { scriptUrl, scriptToken } = getCredentials();
  const response = await fetch(scriptUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ...body, token: scriptToken }),
  });
  if (response.status === 401 || response.status === 403) {
    throw new Error("Google Apps Script rejected the request. Deploy the script as a web app with Execute as 'Me' and Who has access 'Anyone'.");
  }
  if (!response.ok) throw new Error(`Google Sheets request failed: ${response.status} ${await response.text()}`);
  const data = await response.json() as T & { error?: string };
  if (data.error) throw new Error(`Google Sheets request failed: ${data.error}`);
  return data;
}

async function readRows(range: string): Promise<string[][]> {
  const data = await sheetsRequest<{ values?: string[][] }>({ action: "read", range });
  return data.values ?? [];
}

async function appendRow(range: string, values: (string | number | null)[]) {
  await sheetsRequest({ action: "append", range, values });
}

async function updateRow(range: string, values: (string | number | null)[]) {
  await sheetsRequest({ action: "update", range, values });
}

function asNumber(value: string | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function asDate(value: string | undefined) {
  const parsed = value ? new Date(value) : new Date(0);
  return Number.isNaN(parsed.getTime()) ? new Date(0) : parsed;
}

function nowIso() { return new Date().toISOString(); }

function mapUser(row: string[]): UserRow {
  return {
    id: asNumber(row[0]), openId: row[1] ?? "", username: row[2] ?? "", name: row[3] || null,
    email: row[4] || null, role: row[5] === "admin" ? "admin" : "user", loginMethod: row[6] || null,
    passwordHash: row[9] || null, lastSignedIn: asDate(row[7]), createdAt: asDate(row[8]), updatedAt: asDate(row[7]),
  };
}

function mapPlan(row: string[]): PlanRow {
  return { id: asNumber(row[0]), submittedBy: asNumber(row[1]), weekStart: row[2] ?? "", totalCost: row[3] ?? "0", status: row[4] === "reviewed" ? "reviewed" : "submitted", submittedAt: row[5] ?? "", updatedAt: row[6] ?? "" };
}

function mapDailyRoute(row: string[]): DailyRoute {
  return { id: asNumber(row[0]), routePlanId: asNumber(row[1]), day: row[2] ?? "", from: row[3] ?? "", to: row[4] ?? "", plannedArrival: row[5] ?? "", departure: row[6] ?? "", transportMode: row[7] ?? "", cost: asNumber(row[8]) };
}

async function getUsers() {
  return (await readRows("Users!A2:J")).filter(row => row.length).map(mapUser);
}

async function getPlans() {
  return (await readRows("RoutePlans!A2:G")).filter(row => row.length).map(mapPlan);
}

async function getDays() {
  return (await readRows("RoutePlanDays!A2:I")).filter(row => row.length).map(mapDailyRoute);
}

export async function upsertUser(user: { openId: string; username?: string | null; name?: string | null; email?: string | null; passwordHash?: string | null; loginMethod?: string | null; role?: "user" | "admin"; lastSignedIn?: Date }) {
  const users = await getUsers();
  const existing = users.find(item => item.openId === user.openId);
  const timestamp = (user.lastSignedIn ?? new Date()).toISOString();
  const row: UserRow = {
    id: existing?.id ?? (users.reduce((max, item) => Math.max(max, item.id), 0) + 1),
    openId: user.openId,
    username: user.username ?? existing?.username ?? user.openId,
    name: user.name ?? existing?.name ?? null,
    email: user.email ?? existing?.email ?? null,
    passwordHash: user.passwordHash ?? existing?.passwordHash ?? null,
    role: user.role ?? existing?.role ?? "user",
    loginMethod: user.loginMethod ?? existing?.loginMethod ?? "local",
    lastSignedIn: new Date(timestamp),
    createdAt: existing?.createdAt ?? new Date(timestamp),
    updatedAt: new Date(timestamp),
  };
  const values = [row.id, row.openId, row.username ?? "", row.name, row.email, row.role, row.loginMethod, row.lastSignedIn.toISOString(), row.createdAt.toISOString(), row.passwordHash ?? null];
  if (existing) {
    const rowNumber = users.findIndex(item => item.id === existing.id) + 2;
    await updateRow(`Users!A${rowNumber}:J${rowNumber}`, values);
  } else {
    await appendRow("Users!A:J", values);
  }
}

export async function getUserByUsername(username: string) {
  return (await getUsers()).find(user => user.username?.toLowerCase() === username.toLowerCase());
}

export async function getUserByOpenId(openId: string) {
  return (await getUsers()).find(user => user.openId === openId);
}

async function withDailyRoutes(plans: PlanRow[]) {
  const days = await getDays();
  return plans.map(plan => ({ ...plan, dailyRoutes: days.filter(day => day.routePlanId === plan.id) }));
}

export async function createRoutePlan(plan: { submittedBy: number; weekStart: string; totalCost: string; routeDetails: DailyRoute[] }) {
  const plans = await getPlans();
  const id = plans.reduce((max, item) => Math.max(max, item.id), 0) + 1;
  const timestamp = nowIso();
  await appendRow("RoutePlans!A:G", [id, plan.submittedBy, plan.weekStart, plan.totalCost, "submitted", timestamp, timestamp]);
  const days = await getDays();
  let nextDayId = days.reduce((max, item) => Math.max(max, item.id ?? 0), 0) + 1;
  for (const route of plan.routeDetails) {
    await appendRow("RoutePlanDays!A:I", [nextDayId++, id, route.day, route.from, route.to, route.plannedArrival, route.departure, route.transportMode, route.cost.toFixed(2)]);
  }
  return { id };
}

export async function getRoutePlansForUser(userId: number) {
  return withDailyRoutes((await getPlans()).filter(plan => plan.submittedBy === userId).sort((a, b) => b.weekStart.localeCompare(a.weekStart)));
}

export async function getAllRoutePlans() {
  const users = await getUsers();
  const userMap = new Map(users.map(user => [user.id, user]));
  const plans = (await getPlans()).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  return (await withDailyRoutes(plans)).map(plan => ({ ...plan, merchandizerName: userMap.get(plan.submittedBy)?.name ?? null, merchandizerEmail: userMap.get(plan.submittedBy)?.email ?? null }));
}

export async function markRoutePlanReviewed(id: number) {
  const plans = await getPlans();
  const existing = plans.find(plan => plan.id === id);
  if (!existing) throw new Error("Route plan not found");
  const rowNumber = plans.findIndex(plan => plan.id === id) + 2;
  await updateRow(`RoutePlans!A${rowNumber}:G${rowNumber}`, [existing.id, existing.submittedBy, existing.weekStart, existing.totalCost, "reviewed", existing.submittedAt, nowIso()]);
  return { success: true };
}
