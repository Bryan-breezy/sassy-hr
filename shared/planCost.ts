/** Fixed lunch money (Ksh), added once per day that has route data entered. */
export const LUNCH_ALLOWANCE_PER_DAY = 150

export type CostableRoute = { day: string; cost: string | number }

/**
 * Totals a route plan. Pass only the visits that actually have data entered.
 * Lunch is charged per distinct day (not per visit), so several visits on one day still earn one allowance.
 */
export function computePlanCosts(routes: CostableRoute[]) {
  const transportCost = routes.reduce((sum, route) => sum + (Number(route.cost) || 0), 0)
  const daysWithData = new Set(routes.map(route => route.day)).size
  const lunchCost = daysWithData * LUNCH_ALLOWANCE_PER_DAY
  return { transportCost, daysWithData, lunchCost, totalCost: transportCost + lunchCost }
}
