export const LUNCH_ALLOWANCE_PER_DAY = 150

/**
 * `nightOutCost` is optional
 *  It is stored on the first visit of the day (other visits carry 0), 
 * so summing it across visits gives the plan's total night-out spend.
 */
export type CostableRoute = { 
  day: string; 
  cost: string | number; 
  nightOutCost?: string | number | null 
}

/**
 * Totals a route plan. Pass only the visits that actually have data entered.
 * Lunch is charged per distinct day (not per visit), 
 * so several visits on one day still earn one allowance.
 * Night out is optional and user-entered, so it is summed as given 
 */
export function computePlanCosts(routes: CostableRoute[]) {
  // treat invalid night-out values as 0
  const amount = (value: string | number | null | undefined) => {
    const parsed = Number(value)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
  }
  const transportCost = routes.reduce((sum, route) => sum + (Number(route.cost) || 0), 0)
  const daysWithData = new Set(routes.map(route => route.day)).size
  const lunchCost = daysWithData * LUNCH_ALLOWANCE_PER_DAY
  const nightOutCost = routes.reduce((sum, route) => sum + amount(route.nightOutCost), 0)
  const nightOutDays = Array.from(new Set(routes.filter(route => amount(route.nightOutCost) > 0).map(route => route.day)))
  return {
    transportCost,
    daysWithData,
    lunchCost,
    nightOutCost,
    nightOutDays,
    totalCost: transportCost + lunchCost + nightOutCost,
  }
}
