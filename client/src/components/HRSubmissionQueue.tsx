import { Card, CardContent } from "@/components/ui/card"
import { Search, UsersRound } from "lucide-react"
import type { HRPlan, PlanFilter } from "@/lib/hrTypes"

export default function HRSubmissionQueue({ plans, selectedId, search, filter, onSearchChange, onFilterChange, onSelect }: {
  plans: HRPlan[]
  selectedId?: number
  search: string
  filter: PlanFilter
  onSearchChange: (value: string) => void
  onFilterChange: (value: PlanFilter) => void
  onSelect: (id: number) => void
}) {
  return (
    <Card className="border-0 shadow-[0_8px_35px_rgba(29,44,63,.06)] rounded-2xl overflow-hidden bg-white">
      <div className="p-5 border-b border-[#e8edf2] flex items-center justify-between">
        <div>
          <h2 className="font-bold text-base text-[#1c2c3e]">Submission Queue</h2>
          <p className="text-xs text-[#748292] mt-0.5">Select a weekly plan to inspect individual daily visits.</p>
        </div>
        <UsersRound className="text-[#7990a4]" size={20} />
      </div>
      <div className="p-4 border-b border-[#e8edf2] space-y-3 bg-[#fbfcfd]">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-[#93a0ad]" size={17} />
          <input
            value={search}
            onChange={event => onSearchChange(event.target.value)}
            placeholder="Search by merchandiser or week…"
            className="w-full h-10 pl-9 pr-3 rounded-xl border border-[#dce4ec] bg-white text-sm outline-none focus:border-[#7894ae] focus:ring-1 focus:ring-[#7894ae] transition-all"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "submitted", "reviewed"] as const).map(item => (
            <button
              key={item}
              onClick={() => onFilterChange(item)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-all ${filter === item ? "bg-[#274765] text-white shadow-sm" : "bg-[#eef2f6] text-[#637487] hover:bg-[#e4e9ef]"}`}
            >
              {item === "submitted" ? "Pending" : item}
            </button>
          ))}
        </div>
      </div>
      <CardContent className="p-0">
        <div className="divide-y divide-[#edf1f4] max-h-[580px] overflow-y-auto">
          {plans.length === 0 ? (
            <div className="p-10 text-center text-sm text-[#748292]">No route submissions match this search or filter.</div>
          ) : plans.map(plan => (
            <button
              key={plan.id}
              onClick={() => onSelect(plan.id)}
              className={`w-full text-left p-5 transition-all ${selectedId === plan.id ? "bg-[#f0f5f8] border-l-4 border-[#d1a45b]" : "border-l-4 border-transparent hover:bg-[#f7f9fb]"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-sm text-[#1e2f41]">{plan.merchandizerName || plan.merchandizerEmail || `Merchandiser #${plan.submittedBy}`}</div>
                  <div className="text-xs text-[#788796] mt-1">Week of {plan.weekStart}</div>
                </div>
                <span className={`text-[10px] uppercase tracking-[.1em] font-bold rounded-full px-2.5 py-1 ${plan.status === "reviewed" ? "bg-[#e2f0e6] text-[#4e7b5e]" : "bg-[#fff0d8] text-[#9a6b21]"}`}>
                  {plan.status === "submitted" ? "Pending" : plan.status}
                </span>
              </div>
              <div className="text-xs text-[#788796] mt-3 flex items-center justify-between">
                <span>{plan.dailyRoutes?.length || 0} planned visit{plan.dailyRoutes?.length === 1 ? "" : "s"}</span>
                <span className="font-semibold text-[#304860]">Ksh {Number(plan.totalCost).toFixed(2)}</span>
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}