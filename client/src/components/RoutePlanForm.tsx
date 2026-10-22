import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import RouteDayCard, { type RouteDraft } from "@/components/RouteDayCard"
import { ArrowRight, CalendarDays, Plus } from "lucide-react"
import { LUNCH_ALLOWANCE_PER_DAY } from "@shared/planCost"

type RoutePlanFormProps = {
  days: string[]
  weekStart: string
  routes: Record<string, RouteDraft[]>
  activeDays: Set<string>
  dayErrors: Record<string, string>
  activeRoutesCount: number
  transportCost: number
  lunchCost: number
  daysWithData: number
  totalCost: number
  isSubmitting: boolean
  isAuthenticated: boolean
  onWeekStartChange: (value: string) => void
  onToggleDay: (day: string) => void
  onRemoveVisit: (day: string, routeIndex: number) => void
  onChangeRoute: (day: string, routeIndex: number, field: keyof RouteDraft, value: string) => void
  onSubmit: () => void
}

export default function RoutePlanForm({
  days,
  weekStart,
  routes,
  activeDays,
  dayErrors,
  activeRoutesCount,
  transportCost,
  lunchCost,
  daysWithData,
  totalCost,
  isSubmitting,
  isAuthenticated,
  onWeekStartChange,
  onToggleDay,
  onRemoveVisit,
  onChangeRoute,
  onSubmit,
}: RoutePlanFormProps) {
  return (
    <Card className="order-1 lg:order-2 border-0 shadow-[0_18px_60px_rgba(37,68,52,.10)] rounded-[28px] overflow-hidden">
      <CardHeader className="bg-[#143f37] text-[#f2f4e8] p-6 sm:p-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-[.2em] text-[#b7cbb3]">New submission</div>
            <CardTitle className="text-2xl mt-2 text-[#f2f4e8]">Route plan</CardTitle>
          </div>
          <CalendarDays className="text-[#b7cbb3]" />
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-8">
        <Label htmlFor="week-start" className="text-xs uppercase tracking-[.14em] text-[#708078]">Week commencing</Label>
        <Input
          id="week-start"
          aria-invalid={Boolean(dayErrors.Week)}
          aria-describedby={dayErrors.Week ? "week-start-error" : undefined}
          type="date"
          value={weekStart}
          onChange={event => onWeekStartChange(event.target.value)}
          className={`mt-2 h-12 rounded-xl bg-white ${dayErrors.Week ? "border-[#b85f46]" : "border-[#dfe7df]"}`}
        />
        {dayErrors.Week && (
          <p id="week-start-error" role="alert" className="mt-2 text-xs text-[#a34f38]">
            {dayErrors.Week}
          </p>
        )}

        <div className="mt-5 sm:mt-6 space-y-3 sm:space-y-4">
          {days.map((day, index) => {
            if (!activeDays.has(day)) {
              return (
                <div
                  key={day}
                  onClick={() => onToggleDay(day)}
                  className="rounded-2xl border border-dashed border-[#d5ded4] p-3 text-center cursor-pointer hover:bg-[#fbfcf9] transition-colors flex items-center justify-between px-4 text-xs font-medium text-[#7a8c81]"
                >
                  <span className="min-w-0 truncate">{day} (Not included)</span>
                  <span className="shrink-0 inline-flex items-center gap-1 text-[#143f37] font-semibold">
                    <Plus size={14} /> Add {day}
                  </span>
                </div>
              )
            }

            return (
              <RouteDayCard
                key={day}
                day={day}
                index={index}
                cardId={`route-day-${day}`}
                routes={routes[day]}
                error={dayErrors[day]}
                onRemove={() => onToggleDay(day)}
                canRemove={activeDays.size > 1}
                onRemoveVisit={routeIndex => onRemoveVisit(day, routeIndex)}
                onChange={(routeIndex, field, value) => onChangeRoute(day, routeIndex, field, value)}
              />
            )
          })}
        </div>

        <div className="mt-5 rounded-2xl bg-[#f3f6ef] p-3.5 sm:p-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[11px] sm:text-xs leading-tight uppercase tracking-[.13em] text-[#75877b]">Total estimated cost</div>
            <div className="text-xl sm:text-2xl font-semibold mt-1 break-words">Ksh {totalCost.toFixed(2)}</div>
            <div className="mt-1 text-[11px] sm:text-xs text-[#75877b]">
              Transport Ksh {transportCost.toFixed(2)} + Lunch Ksh {lunchCost.toFixed(2)}
              {daysWithData > 0 && ` (${daysWithData} day${daysWithData === 1 ? "" : "s"} × ${LUNCH_ALLOWANCE_PER_DAY})`}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-[11px] sm:text-xs leading-tight uppercase tracking-[.13em] text-[#75877b]">Visits planned</div>
            <div className="text-xl font-semibold mt-1 text-[#143f37]">{activeRoutesCount}</div>
          </div>
        </div>

        <div className="sticky bottom-3 z-10 -mx-1 mt-4 rounded-2xl bg-[#f6f7f4]/90 p-1.5 backdrop-blur sm:static sm:m-0 sm:mt-5 sm:bg-transparent sm:p-0">
          <Button
            className="w-full h-12 sm:h-13 rounded-xl bg-[#a86743] hover:bg-[#8f5537] text-white shadow-lg shadow-[#a86743]/20 transition-all font-semibold"
            disabled={isSubmitting || activeRoutesCount === 0}
            onClick={onSubmit}
          >
            {isSubmitting ? "Submitting…" : isAuthenticated ? `Submit plan (${activeRoutesCount} visit${activeRoutesCount === 1 ? "" : "s"})` : "Sign in to submit"}
            <ArrowRight className="ml-2" size={18} />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}