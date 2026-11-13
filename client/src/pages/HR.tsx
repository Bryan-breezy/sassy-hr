import { useMemo, useState } from "react"
import { useAuth } from "@/_core/hooks/useAuth"
import { HRAccessDenied, HRLoadError } from "@/components/HRPageStates"
import HRDashboard from "@/components/HRDashboard"
import PageSkeleton from "@/components/PageSkeleton"
import { trpc } from "@/lib/trpc"
import type { PlanFilter } from "@/lib/hrTypes"
import { toast } from "sonner"
import { downloadRoutePlanPdf } from "@/lib/routePlanPdf"
import { computePlanCosts } from "@shared/planCost"

export default function HR() {
  const { user, loading, isAuthenticated, logout } = useAuth()
  const [filter, setFilter] = useState<PlanFilter>("all")
  const [search, setSearch] = useState("")
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [confirmReviewOpen, setConfirmReviewOpen] = useState(false)
  const utils = trpc.useUtils()

  const plans = trpc.routePlans.all.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  })

  const markReviewed = trpc.routePlans.markReviewed.useMutation({
    onSuccess: async () => {
      toast.success("Route plan marked as reviewed")
      await utils.routePlans.all.invalidate()
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update review status")
    },
  })

  const visiblePlans = useMemo(
    () =>
      (plans.data || []).filter(
        (plan) =>
          (filter === "all" || plan.status === filter) &&
          `${plan.merchandizerName || ""} ${plan.merchandizerEmail || ""} ${plan.weekStart}`
            .toLowerCase()
            .includes(search.toLowerCase())
      ),
    [plans.data, filter, search]
  )

  const selected = visiblePlans.find((plan) => plan.id === selectedId) || visiblePlans[0]
  const selectedCosts = selected ? computePlanCosts(selected.dailyRoutes ?? []) : null
  const selectedBreakdown =
    selected &&
    selectedCosts &&
    (selected.dailyRoutes?.length ?? 0) > 0 &&
    Math.abs(Number(selected.totalCost) - selectedCosts.totalCost) < 0.01
      ? selectedCosts
      : null
  const submitted = plans.data?.filter((plan) => plan.status === "submitted").length || 0
  const reviewed = plans.data?.filter((plan) => plan.status === "reviewed").length || 0

  const handleExportCSV = () => {
    if (!visiblePlans.length) {
      toast.error("No plans available to export")
      return
    }

    const headers = [
      "Plan ID",
      "Week Commencing",
      "Merchandiser",
      "Status",
      "Total Cost (Ksh)",
      "Day",
      "From",
      "To",
      "Arrival",
      "Departure",
      "Transport Mode",
      "Cost (Ksh)",
      "Night Out (Ksh)",
    ]
    const rows: string[][] = []

    visiblePlans.forEach((plan) => {
      if (plan.dailyRoutes?.length) {
        plan.dailyRoutes.forEach((route) => {
          rows.push([
            String(plan.id),
            plan.weekStart,
            plan.merchandizerName || `User #${plan.submittedBy}`,
            plan.status,
            Number(plan.totalCost).toFixed(2),
            route.day,
            `"${(route.from || "").replace(/"/g, '""')}"`,
            `"${(route.to || "").replace(/"/g, '""')}"`,
            route.plannedArrival,
            route.departure,
            route.transportMode,
            Number(route.cost).toFixed(2),
            Number(route.nightOutCost || 0).toFixed(2),
          ])
        })
      } else {
        rows.push([
          String(plan.id),
          plan.weekStart,
          plan.merchandizerName || `User #${plan.submittedBy}`,
          plan.status,
          Number(plan.totalCost).toFixed(2),
          "-",
          "-",
          "-",
          "-",
          "-",
          "-",
          "0.00",
          "0.00",
        ])
      }
    })

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")
    const link = document.createElement("a")
    link.setAttribute("href", encodeURI(csvContent))
    link.setAttribute("download", `merchandiser_routes_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success("CSV export downloaded successfully")
  }

  const downloadReviewedPlan = async (
    plan: NonNullable<typeof plans.data>[number],
    reviewedOn?: Date | string
  ) => {
    try {
      await downloadRoutePlanPdf(plan, { reviewedOn })
      return true
    } catch (error) {
      console.error("Failed to generate route plan PDF", error)
      const message = error instanceof Error ? error.message : String(error)
      const staleBundle =
        /dynamically imported module|importing a module script|loading chunk|loading css chunk/i.test(
          message
        )

      if (staleBundle) {
        toast.error("The app was just updated. Reloading so your PDF can be generated…")
        window.setTimeout(() => window.location.reload(), 1500)
      } else {
        toast.error(
          `The PDF report could not be generated${message ? ` (${message.slice(0, 120)})` : ""}`
        )
      }
      return false
    }
  }

  const handleMarkReviewed = () => {
    if (!selected) return
    markReviewed.mutate({ id: selected.id })
    setConfirmReviewOpen(false)
  }

  if (loading || (isAuthenticated && user?.role === "admin" && plans.isLoading)) {
    return <PageSkeleton page="hr" />
  }

  if (!isAuthenticated || user?.role !== "admin") return <HRAccessDenied />
  if (plans.isError) return <HRLoadError message={plans.error.message} onRetry={() => plans.refetch()} />

  return (
    <HRDashboard
      displayName={user.name || ""}
      isFetching={plans.isFetching}
      onRefresh={() => void utils.routePlans.all.invalidate()}
      onExportCSV={handleExportCSV}
      totalPlans={plans.data?.length || 0}
      submitted={submitted}
      reviewed={reviewed}
      visiblePlans={visiblePlans}
      selected={selected}
      selectedBreakdown={selectedBreakdown}
      search={search}
      filter={filter}
      onSearchChange={setSearch}
      onFilterChange={setFilter}
      onSelectPlan={setSelectedId}
      onLogout={() => void logout()}
      confirmReviewOpen={confirmReviewOpen}
      isMarkingReviewed={markReviewed.isPending}
      onConfirmReviewChange={setConfirmReviewOpen}
      onMarkReviewed={handleMarkReviewed}
      onDownloadReviewedPlan={downloadReviewedPlan}
    />
  )
}
