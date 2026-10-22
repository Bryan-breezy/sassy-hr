import { describe, expect, it } from "vitest"
import { buildDailyRoutePayload, isValidNightOutAmount } from "../client/src/lib/routePlanSubmission"
import { ROUTE_PLAN_PDF_CONFIG } from "../client/src/lib/routePlanPdfTemplate"
import { computePlanCosts } from "../shared/planCost"

describe("buildDailyRoutePayload", () => {
  it("attaches a checked night-out amount to only the first visit on that day", () => {
    const routes = [
      { day: "Monday", from: "A", to: "B", plannedArrival: "08:00", departure: "09:00", transportMode: "Car" as const, cost: "100" },
      { day: "Monday", from: "B", to: "C", plannedArrival: "10:00", departure: "11:00", transportMode: "Car" as const, cost: "50" },
      { day: "Tuesday", from: "C", to: "D", plannedArrival: "08:00", departure: "09:00", transportMode: "Car" as const, cost: "20" },
    ]

    const result = buildDailyRoutePayload(routes, {
      Monday: { enabled: true, amount: "1200.50" },
      Tuesday: { enabled: false, amount: "800" },
    })

    expect(result.map(route => route.nightOutCost)).toEqual([1200.5, 0, 0])
    expect(computePlanCosts(result).totalCost).toBe(1670.5)
  })

  it("includes a per-day night-out amount column in the downloaded PDF", () => {
    expect(ROUTE_PLAN_PDF_CONFIG.columns).toContainEqual({ key: "nightOutCost", header: "Night out (Ksh)" })
  })

  it("requires an entered, non-negative amount within the server limit when claimed", () => {
    expect(["", "abc", "-1", "100000.01"].map(isValidNightOutAmount)).toEqual([false, false, false, false])
    expect(["0", "1250.50", "100000"].map(isValidNightOutAmount)).toEqual([true, true, true])
  })
})
