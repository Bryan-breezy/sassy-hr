import { describe, expect, it } from "vitest";
import { appRouter, buildRoutePlanInsert, routePlanInputSchema } from "./routers";
import type { TrpcContext } from "./_core/context";

function context(user: TrpcContext["user"]): TrpcContext {
  return { user, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

const merchandizer = { id: 7, openId: "merch-7", name: "Mina", email: "mina@example.com", loginMethod: "manus", role: "user" as const, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };
const hr = { ...merchandizer, id: 8, openId: "hr-8", role: "admin" as const };

describe("routePlans authorization", () => {
  it("requires authentication to submit a plan", async () => {
    const caller = appRouter.createCaller(context(null));
    await expect(caller.routePlans.create({ weekStart: "2026-08-24", totalCost: 12, dailyRoutes: [{ day: "Monday", from: "A", to: "B", plannedArrival: "08:00", departure: "17:00", transportMode: "Car", cost: 12 }] })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("blocks regular merchandizers from the HR dashboard", async () => {
    const caller = appRouter.createCaller(context(merchandizer));
    await expect(caller.routePlans.all()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("recognizes admin context for HR access", async () => {
    const caller = appRouter.createCaller(context(hr));
    await expect(caller.routePlans.all()).resolves.toEqual([]);
  });

  it("maps a valid plan into normalized persistence details", () => {
    const input = routePlanInputSchema.parse({ weekStart: "2026-08-24", totalCost: 12.5, dailyRoutes: [{ day: "Monday", from: "Warehouse", to: "Central Market", plannedArrival: "08:00", departure: "17:00", transportMode: "Car", cost: 12.5 }] });
    expect(buildRoutePlanInsert(7, input)).toMatchObject({ submittedBy: 7, weekStart: "2026-08-24", totalCost: "12.50", routeDetails: input.dailyRoutes });
  });

  it("rejects incomplete daily route details", async () => {
    const caller = appRouter.createCaller(context(merchandizer));
    await expect(caller.routePlans.create({ weekStart: "2026-08-24", totalCost: 12, dailyRoutes: [{ day: "Monday", from: "", to: "B", plannedArrival: "08:00", departure: "17:00", transportMode: "Car", cost: 12 }] })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects invalid times, transport modes, and negative costs", async () => {
    const caller = appRouter.createCaller(context(merchandizer));
    await expect(caller.routePlans.create({ weekStart: "2026-08-24", totalCost: -1, dailyRoutes: [{ day: "Monday", from: "A", to: "B", plannedArrival: "18:00", departure: "08:00", transportMode: "Train" as never, cost: -1 }] })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
