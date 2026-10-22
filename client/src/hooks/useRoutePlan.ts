import { useEffect, useMemo, useState } from "react"
import { navigateToLogin } from "@/const"
import { toast } from "sonner"
import { trpc } from "@/lib/trpc"
import { computePlanCosts } from "@shared/planCost"
import { TRANSPORT_MODES, type RouteDraft } from "@/components/RouteDayCard"
import { blankNightOut, type NightOutDraft } from "@/components/NightOutAllowance"

const [nightOut, setNightOut] = useState<Record<string, NightOutDraft>>(
  () => Object.fromEntries(DAYS.map(d => [d, blankNightOut()]))
)

export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

const DRAFT_STORAGE_KEY = "sassy-hr:draft:v1"

type Draft = {
  weekStart: string
  routes: Record<string, RouteDraft[]>
  activeDays: string[]
}

const blankRoute = (): RouteDraft => ({
  from: "",
  to: "",
  plannedArrival: "",
  departure: "",
  transportMode: TRANSPORT_MODES[1],
  cost: "",
})

const blankRoutes = (): Record<string, RouteDraft[]> => Object.fromEntries(
  DAYS.map(day => [day, [blankRoute()]])
)

function isValidRouteDraft(value: any): value is RouteDraft {
  return Boolean(value) &&
    typeof value.from === "string" &&
    typeof value.to === "string" &&
    typeof value.plannedArrival === "string" &&
    typeof value.departure === "string" &&
    typeof value.cost === "string" &&
    typeof value.transportMode === "string"
}

function hasDraftContent(routes: Record<string, RouteDraft[]>) {
  return Object.values(routes).some(dayRoutes => dayRoutes.some(route => route.from.trim() || route.to.trim()))
}

function loadDraft(): Draft | null {
  try {
    const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)

    if (
      typeof parsed?.weekStart !== "string" ||
      !Array.isArray(parsed?.activeDays) ||
      typeof parsed?.routes !== "object" || parsed.routes === null
    ) return null

    const activeDays = parsed.activeDays.filter((day: unknown): day is string => typeof day === "string" && DAYS.includes(day))
    if (!activeDays.length) return null

    const routes: Record<string, RouteDraft[]> = {}
    for (const day of DAYS) {
      const dayRoutes = parsed.routes[day]
      routes[day] = Array.isArray(dayRoutes) && dayRoutes.length && dayRoutes.every(isValidRouteDraft)
        ? dayRoutes
        : [blankRoute()]
    }

    if (!hasDraftContent(routes)) return null
    return { weekStart: parsed.weekStart, routes, activeDays }
  } catch {
    return null
  }
}

function saveDraft(draft: Draft) {
  try {
    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft))
  } catch {
    // Autosave is best-effort when storage is unavailable or full.
  }
}

function clearDraft() {
  try {
    window.localStorage.removeItem(DRAFT_STORAGE_KEY)
  } catch {
    // Ignore unavailable storage.
  }
}

function mondayDate() {
  const date = new Date()
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diff)
  return date.toISOString().slice(0, 10)
}

export default function useRoutePlan(isAuthenticated: boolean) {
  const [initialDraft] = useState(loadDraft)
  const [weekStart, setWeekStart] = useState(initialDraft?.weekStart ?? mondayDate)
  const [routes, setRoutes] = useState<Record<string, RouteDraft[]>>(initialDraft?.routes ?? blankRoutes())
  const [activeDays, setActiveDays] = useState<Set<string>>(() => new Set(initialDraft?.activeDays ?? ["Monday"]))
  const [dayErrors, setDayErrors] = useState<Record<string, string>>({})
  const utils = trpc.useUtils()

  useEffect(() => {
    if (initialDraft) toast.info("Restored your unsaved route plan draft")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (hasDraftContent(routes)) {
      saveDraft({ weekStart, routes, activeDays: Array.from(activeDays) })
    } else {
      clearDraft()
    }
  }, [weekStart, routes, activeDays])

  const createPlan = trpc.routePlans.create.useMutation({
    onSuccess: () => {
      toast.success("Successfully submitted to HR")
      setRoutes(blankRoutes())
      setActiveDays(new Set(["Monday"]))
      setDayErrors({})
      clearDraft()
      utils.routePlans.mine.invalidate()
    },
    onError: error => toast.error(error.message || "Please review the route details and try again"),
  })

  const activeRoutes = useMemo(() => {
    return DAYS.filter(day => activeDays.has(day))
      .flatMap(day => routes[day].map(route => ({ day, ...route })))
      .filter(route => route.from.trim() || route.to.trim())
  }, [routes, activeDays])

  const costs = useMemo(() => computePlanCosts(activeRoutes), [activeRoutes])

  const toggleDay = (day: string) => {
    setActiveDays(current => {
      const next = new Set(current)
      if (next.has(day)) {
        if (next.size <= 1) {
          toast.info("Keep at least one day available in your route plan.")
          return current
        }
        next.delete(day)
        setRoutes(currentRoutes => ({ ...currentRoutes, [day]: [blankRoute()] }))
        setDayErrors(currentErrors => {
          const updated = { ...currentErrors }
          delete updated[day]
          return updated
        })
      } else {
        next.add(day)
      }
      return next
    })
  }

  const onWeekStartChange = (value: string) => {
    setWeekStart(value)
    setDayErrors(current => ({ ...current, Week: "" }))
  }

  const removeVisit = (day: string, routeIndex: number) => {
    setRoutes(current => ({
      ...current,
      [day]: current[day].filter((_, index) => index !== routeIndex),
    }))
  }

  const changeRoute = (day: string, routeIndex: number, field: keyof RouteDraft, value: string) => {
    setRoutes(current => ({
      ...current,
      [day]: routeIndex >= current[day].length
        ? [...current[day], { ...blankRoute(), [field]: value }]
        : current[day].map((route, index) => index === routeIndex ? { ...route, [field]: value } : route),
    }))
  }

  const handleSubmit = () => {
    if (!isAuthenticated) {
      navigateToLogin()
      return
    }

    const errors: Record<string, string> = {}
    if (!weekStart) errors.Week = "Choose the Monday that starts this plan."

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

    setDayErrors(errors)

    if (Object.keys(errors).length) {
      const firstError = Object.keys(errors)[0]
      const target = firstError === "Week"
        ? document.getElementById("week-start")
        : document.getElementById(`route-day-${firstError}`)

      if (target) {
        const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
        target.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "center" })
        target.focus({ preventScroll: true })
        target.classList.add("ring-2", "ring-[#b85f46]", "ring-offset-2")
        window.setTimeout(() => target.classList.remove("ring-2", "ring-[#b85f46]", "ring-offset-2"), 2000)
      }

      toast.error("Please fix the highlighted route details")
      return
    }

    if (!activeRoutes.length) {
      toast.error("Add route details for at least one day before submitting")
      document.getElementById("week-start")?.scrollIntoView({ behavior: "smooth", block: "center" })
      return
    }

    createPlan.mutate({
      weekStart,
      totalCost: costs.totalCost,
      dailyRoutes: activeRoutes.map(route => ({
        day: route.day,
        from: route.from.trim(),
        to: route.to.trim(),
        plannedArrival: route.plannedArrival.trim() || "09:00",
        departure: route.departure.trim() || "11:30",
        transportMode: route.transportMode,
        cost: Number(route.cost) || 0,
      })),
    })
  }

  return {
    weekStart,
    routes,
    activeDays,
    dayErrors,
    activeRoutes,
    ...costs,
    isSubmitting: createPlan.isPending,
    toggleDay,
    onWeekStartChange,
    removeVisit,
    changeRoute,
    handleSubmit,

    nightOut,                              // Record<string, NightOutDraft>
    setNightOut,                           // React.Dispatch<React.SetStateAction<...>>
    nightOutCost,
  }
}
