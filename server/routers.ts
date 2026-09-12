import { COOKIE_NAME } from "@shared/const"
import { getSessionCookieOptions } from "./_core/cookies"
import { systemRouter } from "./_core/systemRouter"
import { protectedProcedure, publicProcedure, router } from "./_core/trpc"
import { TRPCError } from "@trpc/server"
import { z } from "zod"
import { createRoutePlan, getAllRoutePlans, getRoutePlansForUser, markRoutePlanReviewed } from "./db"

export const dailyRouteSchema = z.object({
  day: z.string().min(1),
  from: z.string().trim().min(1).max(160),
  to: z.string().trim().min(1).max(160),
  plannedArrival: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  departure: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  transportMode: z.enum(["Walking", "Public transport", "Motorcycle", "Car", "Taxi", "Other"]),
  cost: z.number().min(0).max(100000),
})
 
export const routePlanInputSchema = z.object(
  { 
    weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), 
    totalCost: z.number().min(0).max(1000000), 
    dailyRoutes: z.array(dailyRouteSchema).min(1).max(49) 
  }
)

export function buildRoutePlanInsert(userId: number, input: z.infer<typeof routePlanInputSchema>) {
  return { 
    submittedBy: userId, 
    weekStart: input.weekStart, 
    totalCost: input.totalCost.toFixed(2), 
    routeDetails: input.dailyRoutes 
  }
}

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "HR access required" });
  return next()
})

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  routePlans: router({
    create: protectedProcedure.input(routePlanInputSchema).mutation(async ({ ctx, input }) => {
      return createRoutePlan(buildRoutePlanInsert(ctx.user.id, input));
    }),
    mine: protectedProcedure.query(({ ctx }) => getRoutePlansForUser(ctx.user.id)),
    all: adminProcedure.query(() => getAllRoutePlans()),
    markReviewed: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => markRoutePlanReviewed(input.id)),
  }),
});

export type AppRouter = typeof appRouter;
