import type { RouterOutputs } from "@/lib/trpc"

export type HRPlan = NonNullable<RouterOutputs["routePlans"]["all"]>[number]
export type PlanFilter = "all" | "submitted" | "reviewed"