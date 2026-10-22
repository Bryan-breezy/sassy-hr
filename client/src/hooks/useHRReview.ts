import { useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import { trpc } from "@/lib/trpc"
import { downloadRoutePlanPdf } from "@/lib/routePlanPdf"
import type { HRPlan, PlanFilter } from "@/lib/hrTypes"

export default function useHRReview(enabled: boolean) {
  const [filter, setFilter] = useState<PlanFilter>("all")
  const [search, setSearch] = useState("")
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [confirmReviewOpen, setConfirmReviewOpen] = useState(false)
  const pendingReviewPlanRef = useRef<HRPlan | null>(null)
  const utils = trpc.useUtils()
  const plans = trpc.routePlans.all.useQuery(undefined, { enabled })

  const downloadReviewedPlan = async (plan: HRPlan, reviewedOn?: Date | string) => {
    try {
      await downloadRoutePlanPdf(plan, { reviewedOn })
      return true
    } catch (error) {
      console.error("Failed to generate route plan PDF", error)
      toast.error("The PDF report could not be generated")
      return false
    }
  }

  const markReviewed = trpc.routePlans.markReviewed.useMutation({
    onSuccess: () => {
      toast.success("Route plan marked as reviewed")
      void utils.routePlans.all.invalidate()
      const reviewedPlan = pendingReviewPlanRef.current
      pendingReviewPlanRef.current = null
      if (reviewedPlan) {
        void downloadReviewedPlan(reviewedPlan, new Date()).then(ok => {
          if (ok) toast.success("Review report (PDF) downloaded")
        })
      }
    },
    onError: error => {
      toast.error(error.message || "Failed to update review status")
      pendingReviewPlanRef.current = null
    },
  })

  const visiblePlans = useMemo(() => {
    return (plans.data || []).filter(plan =>
      (filter === "all" || plan.status === filter) &&
      `${plan.merchandizerName || ""} ${plan.merchandizerEmail || ""} ${plan.weekStart}`
        .toLowerCase()
        .includes(search.toLowerCase())
    )
  }, [plans.data, filter, search])

  const selected = visiblePlans.find(plan => plan.id === selectedId) || visiblePlans[0]
  const submitted = plans.data?.filter(plan => plan.status === "submitted").length || 0
  const reviewed = plans.data?.filter(plan => plan.status === "reviewed").length || 0

  const handleExportCSV = () => {
    if (!visiblePlans.length) {
      toast.error("No plans available to export")
      return
    }

    const headers = [
      "Plan ID", "Week Commencing", "Merchandiser", "Status", "Total Cost (Ksh)",
      "Day", "From", "To", "Arrival", "Departure", "Transport Mode", "Cost (Ksh)",
    ]
    const rows: string[][] = []

    visiblePlans.forEach(plan => {
      const merchandiser = plan.merchandizerName || plan.merchandizerEmail || `User #${plan.submittedBy}`
      const base = [
        String(plan.id), plan.weekStart, merchandiser, plan.status, Number(plan.totalCost).toFixed(2),
      ]
      if (plan.dailyRoutes?.length) {
        plan.dailyRoutes.forEach(route => rows.push([
          ...base,
          route.day,
          `"${(route.from || "").replace(/"/g, '""')}"`,
          `"${(route.to || "").replace(/"/g, '""')}"`,
          route.plannedArrival,
          route.departure,
          route.transportMode,
          Number(route.cost).toFixed(2),
        ]))
      } else {
        rows.push([...base, "-", "-", "-", "-", "-", "-", "0.00"])
      }
    })

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(row => row.join(","))].join("\n")
    const link = document.createElement("a")
    link.setAttribute("href", encodeURI(csvContent))
    link.setAttribute("download", `merchandiser_routes_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success("CSV export downloaded successfully")
  }

  const handleMarkReviewed = () => {
    if (!selected) return
    pendingReviewPlanRef.current = selected
    markReviewed.mutate({ id: selected.id })
    setConfirmReviewOpen(false)
  }

  return {
    plans,
    filter,
    setFilter,
    search,
    setSearch,
    selected,
    setSelectedId,
    visiblePlans,
    submitted,
    reviewed,
    confirmReviewOpen,
    setConfirmReviewOpen,
    markReviewed,
    handleExportCSV,
    handleMarkReviewed,
    downloadReviewedPlan,
    refresh: () => { void utils.routePlans.all.invalidate() },
  }
}