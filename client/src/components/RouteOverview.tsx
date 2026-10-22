import { Check } from "lucide-react"
import type { RouteDraft } from "@/components/RouteDayCard"
import Stat from "@/components/Stat"

type RouteOverviewProps = {
  days: string[]
  activeRoutesCount: number
  totalCost: number
  savedPlansCount: number
  routes: Record<string, RouteDraft[]>
  activeDays: Set<string>
  onToggleDay: (day: string) => void
}

export default function RouteOverview({ days, activeRoutesCount, totalCost, savedPlansCount, routes, activeDays, onToggleDay }: RouteOverviewProps) {
  return (
    <section className="order-2 lg:order-1">
      <h1 className="mt-3 text-4xl sm:text-6xl leading-[.98] font-semibold tracking-[-.05em] max-w-xl">
        Weekly Route Schedule.
      </h1>
      <div className="mt-7 sm:mt-10 grid grid-cols-3 gap-2 sm:gap-3 max-w-xl">
        <Stat label="Planned visits" value={activeRoutesCount.toString().padStart(2, "0")} />
        <Stat label="Planned cost" value={`Ksh ${totalCost.toFixed(2)}`} />
        <Stat label="Saved plans" value={savedPlansCount.toString().padStart(2, "0")} />
      </div>

      <div className="mt-6 sm:mt-8 max-w-xl bg-white border border-[#e5ebe3] rounded-2xl p-4 sm:p-5">
        <div className="text-xs uppercase tracking-[.14em] text-[#708078] font-semibold">
          Select days you plan to visit
        </div>
        <div className="grid grid-cols-4 sm:flex sm:flex-wrap gap-2 mt-3">
          {days.map(day => {
            const isEnabled = activeDays.has(day)
            const hasContent = routes[day].some(route => route.from.trim() || route.to.trim())
            return (
              <button
                key={day}
                type="button"
                onClick={() => onToggleDay(day)}
                className={`min-h-10 px-2 sm:px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  isEnabled
                    ? "bg-[#143f37] text-white shadow-sm"
                    : "bg-[#f1f3ef] text-[#6d7e74] hover:bg-[#e4e8e1]"
                }`}
              >
                {hasContent && <Check size={13} className="text-[#96dfa1]" />}
                {day.slice(0, 3)}
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}