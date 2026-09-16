import { useMemo, useState } from "react"
import { useAuth } from "@/_core/hooks/useAuth"
import { navigateToLogin } from "@/const"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { ArrowRight, CalendarDays, Check, ChevronDown, LogOut, Plus, Trash2 } from "lucide-react"
import { trpc } from "@/lib/trpc"
import LoadingScreen from "@/components/LoadingScreen"

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
const MODES = ["Walking", "Public transport", "Motorcycle", "Car", "Taxi", "Other"] as const

type RouteDraft = { 
  from: string; 
  to: string; 
  plannedArrival: string; 
  departure: string; 
  transportMode: typeof MODES[number]; 
  cost: string;
}

const blankRoute = (): RouteDraft => ({ 
  from: "", 
  to: "", 
  plannedArrival: "", 
  departure: "", 
  transportMode: "Public transport", 
  cost: "" 
})

const blankRoutes = (): Record<string, RouteDraft[]> => Object.fromEntries(
  DAYS.map(day => [day, [blankRoute()]])
)

function mondayDate() {
  const date = new Date()
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diff)
  return date.toISOString().slice(0, 10)
}

export default function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth({ redirectOnUnauthenticated: true })
  const [weekStart, setWeekStart] = useState(mondayDate)
  const [routes, setRoutes] = useState<Record<string, RouteDraft[]>>(blankRoutes)
  // Keep track of which days the merchandiser has activated to fill in (starts with Monday active)
  const [activeDays, setActiveDays] = useState<Set<string>>(() => new Set([""]))
  const [openPlan, setOpenPlan] = useState<number | null>(null)
  const [dayErrors, setDayErrors] = useState<Record<string, string>>({})
  const utils = trpc.useUtils()

  const createPlan = trpc.routePlans.create.useMutation({
    onSuccess: () => { 
      toast.success("Successfully submitted to HR") 
      setRoutes(blankRoutes()) 
      setActiveDays(new Set(["Monday"]));
      setDayErrors({}); 
      utils.routePlans.mine.invalidate(); 
    },
    onError: (error) => toast.error(error.message || "Please review the route details and try again"),
  })

  const mine = trpc.routePlans.mine.useQuery(undefined, { enabled: isAuthenticated })

  // A day is active for submission if it is enabled and the user entered a location or filled fields
  const activeRoutes = useMemo(() => {
    return DAYS.filter(day => activeDays.has(day))
      .flatMap(day => routes[day].map(route => ({ day, ...route })))
      .filter(route => route.from.trim() || route.to.trim())
  }, [routes, activeDays])

  const totalCost = activeRoutes.reduce((sum, route) => sum + (Number(route.cost) || 0), 0)

  const toggleDay = (day: string) => {
    setActiveDays(current => {
      const next = new Set(current)
      if (next.has(day)) {
        if (next.size <= 1) {
          toast.info("Keep at least one day available in your route plan.")
          return current
        }
        next.delete(day)
        setRoutes(curr => ({ ...curr, [day]: [blankRoute()] }))
        setDayErrors(curr => {
          const updated = { ...curr }
          delete updated[day]
          return updated
        })
      } else {
        next.add(day)
      }
      return next
    })
  }

  const handleSubmit = () => {
    if (!isAuthenticated) {
      navigateToLogin();
      return;
    }
    const errors: Record<string, string> = {}

    if (!weekStart) errors.Week = "Choose the Monday that starts this plan."

    // Only validate days that the merchandiser actually activated and filled in
    DAYS.forEach(day => {
      if (!activeDays.has(day)) return
      routes[day].forEach((route, index) => {
        const hasAny = route.from.trim() || route.to.trim() || route.cost.trim() || route.plannedArrival.trim() || route.departure.trim()
        if (!hasAny) return
        let message = ""
        if (!route.from.trim() || !route.to.trim()) message = "Add both a starting location and destination."
        else if (!route.plannedArrival.trim()) message = "Please specify a planned arrival time (e.g. 09:00)."
        else if (!route.departure.trim()) message = "Please specify a departure time (e.g. 11:30)."
        else if (route.departure <= route.plannedArrival) message = "Departure time must be later than planned arrival."
        else if (route.cost && (!Number.isFinite(Number(route.cost)) || Number(route.cost) < 0)) message = "Enter a valid non-negative cost."
        if (message && !errors[day]) errors[day] = `Entry ${index + 1}: ${message}`
      })
    })

    setDayErrors(errors);

    if (Object.keys(errors).length) {
      const firstError = Object.keys(errors)[0]
      if (firstError === "Week") {
        const weekInput = document.getElementById("week-start")
        weekInput?.focus()
        weekInput?.scrollIntoView({ behavior: "smooth", block: "center" })
      } else {
        const firstDayCard = document.getElementById(`route-day-${firstError}`)
        firstDayCard?.focus()
        firstDayCard?.scrollIntoView({ behavior: "smooth", block: "center" })
      }

      toast.error("Please fix the highlighted route details")
      return
    }

    if (!activeRoutes.length) {
      toast.error("Add route details for at least one day before submitting");
      return;
    }

    createPlan.mutate({
      weekStart,
      totalCost,
      dailyRoutes: activeRoutes.map(route => ({
        day: route.day,
        from: route.from.trim(),
        to: route.to.trim(),
        plannedArrival: route.plannedArrival.trim() || "09:00",
        departure: route.departure.trim() || "11:30",
        transportMode: route.transportMode,
        cost: Number(route.cost) || 0,
      })),
    });
  };

  if (loading || !isAuthenticated) return <LoadingScreen />
  if (mine.isLoading) return <LoadingScreen />
  
  return (
    <div className="min-h-screen bg-[#f6f7f4] text-[#18352f]">
      <header className="border-b border-[#dfe7df] bg-[#f6f7f4]/90 backdrop-blur sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <div className="font-semibold tracking-tight text-base sm:text-lg max-w-[220px] sm:max-w-none truncate">Sassy Cosmetic &amp; Beauty Products (K) Limited</div>
              <div className="text-[11px] sm:text-xs text-[#6d8075]">Merchandisers weekly Route Plan</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {user?.role === "admin" && 
              <a href="/hr" className="inline-flex items-center px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#8b5e3c] text-white text-[11px] sm:text-xs font-semibold tracking-wide hover:bg-[#6d442d] transition-colors">
                HR Console
              </a>
            }
            {isAuthenticated && <>
              <div className="hidden sm:block text-right">
                <div className="text-sm font-medium">{user?.name || user?.email}</div>
                <div className="text-xs text-[#718278]">
                  {user?.role === "admin" ? "HR administrator" : "Merchandiser"}
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => logout()} aria-label="Sign out">
                <LogOut size={18} />
              </Button></>
            }
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-12">
        <div className="grid lg:grid-cols-[1.05fr_.95fr] gap-6 lg:gap-8 items-start">
          <section className="order-2 lg:order-1">
            <h1 className="mt-3 text-4xl sm:text-6xl leading-[.98] font-semibold tracking-[-.05em] max-w-xl">
              Weekly Route Schedule.
            </h1>
            <div className="mt-7 sm:mt-10 grid grid-cols-3 gap-2 sm:gap-3 max-w-xl">
              <Stat label="Planned visits" value={activeRoutes.length.toString().padStart(2, "0")} />
              <Stat label="Planned cost" value={`Ksh ${totalCost.toFixed(2)}`} />
              <Stat label="Saved plans" value={(mine.data?.length || 0).toString().padStart(2, "0")} />
            </div>

            {/* Quick Day Selector Helper */}
            <div className="mt-6 sm:mt-8 max-w-xl bg-white border border-[#e5ebe3] rounded-2xl p-4 sm:p-5">
              <div className="text-xs uppercase tracking-[.14em] text-[#708078] font-semibold">
                Select days you plan to visit
              </div>
              <div className="grid grid-cols-4 sm:flex sm:flex-wrap gap-2 mt-3">
                {DAYS.map(day => {
                  const isEnabled = activeDays.has(day)
                  const hasContent = routes[day].some(route => route.from.trim() || route.to.trim())
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
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
                onChange={e => { setWeekStart(e.target.value); setDayErrors(current => ({ ...current, Week: "" })); }}
                className={`mt-2 h-12 rounded-xl bg-white ${dayErrors.Week ? "border-[#b85f46]" : "border-[#dfe7df]"}`}
              />
              {dayErrors.Week && (
                <p id="week-start-error" role="alert" className="mt-2 text-xs text-[#a34f38]">
                  {dayErrors.Week}
                </p>
              )}

              {/* Day Cards */}
              <div className="mt-5 sm:mt-6 space-y-3 sm:space-y-4">
                {DAYS.map((day, index) => {
                  const isEnabled = activeDays.has(day)
                  if (!isEnabled) {
                    return (
                      <div
                        key={day}
                        onClick={() => toggleDay(day)}
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
                    <DayCard
                      key={day}
                      day={day}
                      index={index}
                      cardId={`route-day-${day}`}
                      routes={routes[day]}
                      error={dayErrors[day]}
                      onRemove={() => toggleDay(day)}
                      canRemove={activeDays.size > 1}
                      onRemoveVisit={routeIndex => setRoutes(current => ({
                        ...current,
                        [day]: current[day].filter((_, index) => index !== routeIndex),
                      }))}
                      onChange={(routeIndex, field, value) => {
                        setRoutes(current => ({
                          ...current,
                          [day]: routeIndex >= current[day].length
                            ? [...current[day], { ...blankRoute(), [field]: value }]
                            : current[day].map((route, index) => index === routeIndex ? { ...route, [field]: value } : route),
                        }));
                      }}
                    />
                  )
                })}
              </div>

              <div className="mt-5 rounded-2xl bg-[#f3f6ef] p-3.5 sm:p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[11px] sm:text-xs leading-tight uppercase tracking-[.13em] text-[#75877b]">Total estimated cost</div>
                  <div className="text-xl sm:text-2xl font-semibold mt-1 break-words">Ksh {totalCost.toFixed(2)}</div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-[11px] sm:text-xs leading-tight uppercase tracking-[.13em] text-[#75877b]">Visits planned</div>
                  <div className="text-xl font-semibold mt-1 text-[#143f37]">
                    {activeRoutes.length}
                  </div>
                </div>
              </div>

              <div className="sticky bottom-3 z-10 -mx-1 mt-4 rounded-2xl bg-[#f6f7f4]/90 p-1.5 backdrop-blur sm:static sm:m-0 sm:mt-5 sm:bg-transparent sm:p-0">
              <Button
                className="w-full h-12 sm:h-13 rounded-xl bg-[#a86743] hover:bg-[#8f5537] text-white shadow-lg shadow-[#a86743]/20 transition-all font-semibold"
                disabled={createPlan.isPending || activeRoutes.length === 0}
                onClick={handleSubmit}
              >
                {createPlan.isPending ? "Submitting…" : isAuthenticated ? `Submit plan (${activeRoutes.length} visit${activeRoutes.length === 1 ? "" : "s"})` : "Sign in to submit"}
                <ArrowRight className="ml-2" size={18} />
              </Button>
              </div>

            </CardContent>
          </Card>
        </div>

        <section className="mt-12">
          <div className="flex items-end justify-between mb-5">
            <div>
              <div className="text-xs uppercase tracking-[.18em] text-[#8b5e3c] font-semibold">Your workspace</div>
              <h2 className="text-2xl font-semibold tracking-tight mt-1">Recent submissions</h2>
            </div>
          </div>
          <Card className="border-0 shadow-sm rounded-3xl overflow-hidden">
            <CardContent className="p-0">
              {!mine.data?.length ? 
              <div className="p-8 text-center text-[#718278]">Your submitted weekly plans will appear here.</div> : 
              <div className="divide-y divide-[#edf0eb]">{mine.data.map(plan => <PlanRow key={plan.id} plan={plan} openPlan={openPlan} setOpenPlan={setOpenPlan} />)}</div>
              }
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) { 
  return (
    <div className="min-w-0 rounded-2xl bg-white border border-[#e5ebe3] p-3 sm:p-4">
      <div className="text-base sm:text-xl font-semibold tracking-tight break-words">{value}</div>
      <div className="text-[11px] sm:text-xs leading-tight text-[#7b8a81] mt-1">{label}</div>
    </div> 
  )
}

function DayCard({ day, index, routes, error, canRemove, onRemove, onRemoveVisit, onChange }: {
  day: string
  index: number
  routes: RouteDraft[]
  error?: string
  canRemove: boolean
  onRemove: () => void
  onRemoveVisit: (routeIndex: number) => void
  onChange: (routeIndex: number, field: keyof RouteDraft, value: string) => void
}) { 
  const active = routes.some(route => route.from.trim() || route.to.trim())
  return (
    <div className={`rounded-2xl border ${active ? "border-[#c8d8c5] bg-[#fbfcf8]" : "border-[#edf0eb] bg-white"} p-3.5 sm:p-4 transition-colors`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`size-8 rounded-xl grid place-items-center text-xs font-semibold ${active ? "bg-[#dce9d5] text-[#3e654d]" : "bg-[#f1f3ef] text-[#8a978e]"}`}>
          {String(index + 1).padStart(2, "0")}
        </div>
        <div className="min-w-0 font-semibold text-sm">{day}</div>
        {active && <Check size={16} className="shrink-0 text-[#5b8a62]" />}

        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="ml-auto shrink-0 text-xs text-[#95a49a] hover:text-[#b85f46] flex items-center gap-1 transition-colors"
            title={`Remove ${day}`}
          >
            <Trash2 size={14} />
            <span className="hidden sm:inline">Remove</span>
          </button>
        )}
      </div>

      {error && <p role="alert" className="mb-3 rounded-lg bg-[#fff1eb] px-3 py-2 text-xs text-[#a34f38]">{error}</p>}

      <div className="space-y-4">
        {routes.map((route, routeIndex) => (
          <div key={routeIndex} className="rounded-xl border border-[#edf0eb] bg-white p-3">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[.12em] text-[#8a978e]">Visit {routeIndex + 1}</span>
              {routes.length > 1 && <button type="button" onClick={() => onRemoveVisit(routeIndex)} className="text-xs text-[#95a49a] hover:text-[#b85f46]">Remove visit</button>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 sm:col-span-1"><Field label="From" value={route.from} placeholder="e.g. CBD Nairobi" onChange={v => onChange(routeIndex, "from", v)} /></div>
              <div className="col-span-2 sm:col-span-1"><Field label="To" value={route.to} placeholder="e.g. Westlands Supermarket" onChange={v => onChange(routeIndex, "to", v)} /></div>
              <Field label="Planned arrival" type="time" value={route.plannedArrival} onChange={v => onChange(routeIndex, "plannedArrival", v)} />
              <Field label="Departure" type="time" value={route.departure} onChange={v => onChange(routeIndex, "departure", v)} />
              <div className="min-w-0">
                <Label className="text-xs text-[#77877d]">Transport mode</Label>
                <Select value={route.transportMode} onValueChange={v => onChange(routeIndex, "transportMode", v)}>
                  <SelectTrigger className="mt-1 h-11 w-full min-w-0 rounded-xl border-[#dfe7df] text-xs sm:text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{MODES.map(mode => <SelectItem key={mode} value={mode}>{mode}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Field label="Cost incurred (Ksh)" inputMode="decimal" value={route.cost} placeholder="0.00" onChange={v => onChange(routeIndex, "cost", v)} />
            </div>
          </div>
        ))}
      </div>
      {routes.length < 7 && <Button type="button" variant="outline" className="mt-3 h-10 w-full rounded-xl border-dashed text-[#143f37]" onClick={() => onChange(routes.length, "from", "")}>
        <Plus size={16} /> Add another visit on {day}
      </Button>}
    </div> 
  )
}

function Field({ label, value, onChange, placeholder, type = "text", prefix, inputMode }: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  prefix?: string
  inputMode?: "decimal"
}) { 
  return (
    <div>
      <Label className="text-xs text-[#77877d]">{label}</Label>
      <div className="relative mt-1">
        {prefix && <span className="absolute left-3 top-3 text-[#9aa69e]">{prefix}</span>}
        <Input
          type={type}
          inputMode={inputMode}
          value={value}
          placeholder={placeholder}
          onChange={e => onChange(e.target.value)}
          className={`h-11 rounded-xl border-[#dfe7df] ${prefix ? "pl-7" : ""}`}
        />
      </div>
    </div> 
  )
}

function PlanRow({ plan, openPlan, setOpenPlan }: {
  plan: any
  openPlan: number | null
  setOpenPlan: (id: number | null) => void
}) { 
  const routes = plan.dailyRoutes || []

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
        </div>
      )}
    </div>
  )
}
