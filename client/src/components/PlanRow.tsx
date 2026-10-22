import { ChevronDown } from "lucide-react"
import { LUNCH_ALLOWANCE_PER_DAY, computePlanCosts } from "@shared/planCost"

export default function PlanRow({ plan, openPlan, setOpenPlan }: {
  plan: any
  openPlan: number | null
  setOpenPlan: (id: number | null) => void
}) {
  const routes = plan.dailyRoutes || []

  // Plans submitted before the lunch allowance existed only have transport in their total, so
  // only show the breakdown when the saved total actually includes lunch money.
  const costs = computePlanCosts(routes)
  const lunchIncluded = routes.length > 0 && Math.abs(Number(plan.totalCost) - costs.totalCost) < 0.01

  return (
    <div className="p-5 sm:px-7">
      <button
        className="w-full text-left flex items-center justify-between gap-4"
        onClick={() => setOpenPlan(openPlan === plan.id ? null : plan.id)}
      >
        <div>
          <div className="font-semibold">Week commencing {plan.weekStart}</div>
          <div className="text-sm text-[#7b8a81] mt-1">
            {routes.length} route day{routes.length === 1 ? "" : "s"} · Ksh {Number(plan.totalCost).toFixed(2)} estimated
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${plan.status === "reviewed" ? "bg-[#e4f0e2] text-[#4c7755]" : "bg-[#f6eadf] text-[#9a623e]"}`}>
            {plan.status}
          </span>
          <ChevronDown size={17} className={`text-[#8a978e] transition-transform ${openPlan === plan.id ? "rotate-180" : ""}`} />
        </div>
      </button>
      {openPlan === plan.id && (
        <div className="mt-4 grid sm:grid-cols-2 gap-2">
          {routes.map((route: any) => (
            <div key={route.day} className="rounded-xl bg-[#f7f9f5] p-3 text-sm">
              <div className="font-medium">{route.day}</div>
              <div className="text-[#6f8176] mt-1">{route.from} → {route.to}</div>
              <div className="text-xs text-[#89968d] mt-1">
                {route.plannedArrival}–{route.departure} · {route.transportMode} · Ksh {Number(route.cost).toFixed(2)}
              </div>
            </div>
          ))}
          {lunchIncluded && (
            <div className="sm:col-span-2 rounded-xl bg-[#f3f6ef] p-3 text-sm flex flex-wrap items-center justify-between gap-2">
              <span className="text-[#5b7266]">
                Transport Ksh {costs.transportCost.toFixed(2)} + Lunch allowance Ksh {costs.lunchCost.toFixed(2)}
                {` (${costs.daysWithData} day${costs.daysWithData === 1 ? "" : "s"} × ${LUNCH_ALLOWANCE_PER_DAY})`}
              </span>
              <span className="font-semibold text-[#143f37]">Total Ksh {Number(plan.totalCost).toFixed(2)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}