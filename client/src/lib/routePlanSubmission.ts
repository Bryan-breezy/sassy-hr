import type { RouteDraft } from "@/components/RouteDayCard"
import type { NightOutDraft } from "@/components/NightOutAllowance"

export type DailyRouteDraft = RouteDraft & { day: string }

export function isValidNightOutAmount(amount: string) {
  if (!amount.trim()) return false
  const parsed = Number(amount)
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 100000
}

export function buildDailyRoutePayload(
  routes: DailyRouteDraft[],
  nightOut: Record<string, NightOutDraft>
) {
  const firstRouteByDay = new Set<string>()

  return routes.map(route => {
    const firstVisit = !firstRouteByDay.has(route.day)
    firstRouteByDay.add(route.day)
    const allowance = nightOut[route.day]

    return {
      day: route.day,
      from: route.from.trim(),
      to: route.to.trim(),
      plannedArrival: route.plannedArrival.trim() || "09:00",
      departure: route.departure.trim() || "11:30",
      transportMode: route.transportMode,
      cost: Number(route.cost) || 0,
      nightOutCost: firstVisit && allowance?.enabled ? Number(allowance.amount) : 0,
    }
  })
}
