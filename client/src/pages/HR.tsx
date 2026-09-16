import { useMemo, useRef, useState } from "react"
import { useAuth } from "@/_core/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {  ArrowLeft, CheckCircle2, Clock3, Download, FileSpreadsheet, LayoutDashboard, LogOut, MapPin, RefreshCw, Search, ShieldCheck, UsersRound } from "lucide-react"
import { trpc } from "@/lib/trpc"
import { Link } from "wouter"
import { toast } from "sonner"
import LoadingScreen from "@/components/LoadingScreen"

export default function HR() {
  const { user, loading, isAuthenticated, logout } = useAuth()
  const [filter, setFilter] = useState<"all" | "submitted" | "reviewed">("all")
  const [search, setSearch] = useState("")
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const utils = trpc.useUtils()

  const plans = trpc.routePlans.all.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  })

  type PlanWithRoutes = NonNullable<typeof plans.data>[number]
  const pendingReviewPlanRef = useRef<PlanWithRoutes | null>(null)

  const markReviewed = trpc.routePlans.markReviewed.useMutation({
    onSuccess: () => {
      toast.success("Route plan marked as reviewed")
      utils.routePlans.all.invalidate()
      if (pendingReviewPlanRef.current) {
        downloadReviewedPlan(pendingReviewPlanRef.current)
        toast.success("Review report downloaded")
        pendingReviewPlanRef.current = null
      }
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update review status")
      pendingReviewPlanRef.current = null
    },
  })

  const visiblePlans = useMemo(() => {
    return (plans.data || []).filter(
      (plan) =>
        (filter === "all" || plan.status === filter) &&
        `${plan.merchandizerName || ""} ${plan.merchandizerEmail || ""} ${plan.weekStart}`
          .toLowerCase()
          .includes(search.toLowerCase())
    )
  }, [plans.data, filter, search])

  const selected = visiblePlans.find((plan) => plan.id === selectedId) || visiblePlans[0]
  const submitted = plans.data?.filter((plan) => plan.status === "submitted").length || 0
  const reviewed = plans.data?.filter((plan) => plan.status === "reviewed").length || 0

  // Export visible route plans to CSV
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
    ]

    const rows: string[][] = []

    visiblePlans.forEach((p) => {
      if (p.dailyRoutes && p.dailyRoutes.length > 0) {
        p.dailyRoutes.forEach((r) => {
          rows.push([
            String(p.id),
            p.weekStart,
            p.merchandizerName || p.merchandizerEmail || `User #${p.submittedBy}`,
            p.status,
            Number(p.totalCost).toFixed(2),
            r.day,
            `"${(r.from || "").replace(/"/g, '""')}"`,
            `"${(r.to || "").replace(/"/g, '""')}"`,
            r.plannedArrival,
            r.departure,
            r.transportMode,
            Number(r.cost).toFixed(2),
          ])
        })
      } else {
        rows.push([
          String(p.id),
          p.weekStart,
          p.merchandizerName || p.merchandizerEmail || `User #${p.submittedBy}`,
          p.status,
          Number(p.totalCost).toFixed(2),
          "-",
          "-",
          "-",
          "-",
          "-",
          "-",
          "0.00",
        ])
      }
    })

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n")

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute(
      "download",
      `merchandiser_routes_${new Date().toISOString().slice(0, 10)}.csv`
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success("CSV export downloaded successfully")
  }

  // Generate and auto-download an Excel-compatible report for a single reviewed plan
  const downloadReviewedPlan = (plan: PlanWithRoutes) => {
    const merchandiser = plan.merchandizerName || plan.merchandizerEmail || `Merchandiser #${plan.submittedBy}`
    const reviewedOn = new Date().toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" })
    const routes = plan.dailyRoutes || []

    const esc = (value: unknown) =>
      String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

    const cell = "border:1px solid #d7dde3;padding:6px 10px;"
    const routeRows = routes.length
      ? routes
          .map(
            (r: any) => `
          <tr>
            <td style="${cell}">${esc(r.day)}</td>
            <td style="${cell}">${esc(r.from)}</td>
            <td style="${cell}">${esc(r.to)}</td>
            <td style="${cell}">${esc(r.plannedArrival)}</td>
            <td style="${cell}">${esc(r.departure)}</td>
            <td style="${cell}">${esc(r.transportMode)}</td>
            <td style="${cell}text-align:right;">${Number(r.cost).toFixed(2)}</td>
          </tr>`
          )
          .join("")
      : `<tr><td colspan="7" style="${cell}text-align:center;">No route days recorded</td></tr>`

    const html = `
      <html xmlns:x="urn:schemas-microsoft-com:office:excel">
      <head>
        <meta charset="utf-8" />
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Route Plan</x:Name>
                <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          table { border-collapse: collapse; font-family: Calibri, Arial, sans-serif; font-size: 12px; }
          th { background:#274765; color:#ffffff; padding:8px 10px; border:1px solid #d7dde3; text-align:left; }
          .title { font-size:16px; font-weight:bold; color:#1b2b3d; }
          .meta-label { color:#6c7887; font-size:11px; text-transform:uppercase; }
          .meta-value { font-weight:bold; color:#1b2b3d; font-size:13px; }
        </style>
      </head>
      <body>
        <table>
          <tr><td colspan="7" class="title">Sassy Cosmetic &amp; Beauty Products &mdash; Route Plan Review</td></tr>
          <tr><td colspan="7">&nbsp;</td></tr>
          <tr>
            <td class="meta-label">Merchandiser</td><td colspan="2" class="meta-value">${esc(merchandiser)}</td>
            <td class="meta-label">Week Commencing</td><td colspan="3" class="meta-value">${esc(plan.weekStart)}</td>
          </tr>
          <tr>
            <td class="meta-label">Status</td><td colspan="2" class="meta-value">Reviewed</td>
            <td class="meta-label">Reviewed On</td><td colspan="3" class="meta-value">${esc(reviewedOn)}</td>
          </tr>
          <tr>
            <td class="meta-label">Total Estimated Cost</td><td colspan="6" class="meta-value">Ksh ${Number(plan.totalCost).toFixed(2)}</td>
          </tr>
          <tr><td colspan="7">&nbsp;</td></tr>
          <tr>
            <th>Day</th><th>From</th><th>To</th><th>Planned Arrival</th><th>Departure</th><th>Transport Mode</th><th>Cost (Ksh)</th>
          </tr>
          ${routeRows}
        </table>
      </body>
      </html>`

    const blob = new Blob(["\ufeff", html], { type: "application/vnd.ms-excel" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    const safeMerchandiser = merchandiser.replace(/[^a-z0-9]+/gi, "_").toLowerCase()
    link.href = url
    link.download = `route_plan_${safeMerchandiser}_${plan.weekStart}.xls`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleMarkReviewed = () => {
    if (!selected) return
    pendingReviewPlanRef.current = selected
    markReviewed.mutate({ id: selected.id })
  }

 if (loading || !isAuthenticated) return <LoadingScreen />

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-[#f4f6f9] grid place-items-center p-6 text-center">
        <div>
          <ShieldCheck className="mx-auto text-[#274765]" size={48} />
          <h1 className="mt-4 text-3xl font-semibold text-[#223047]">HR Access Only</h1>
          <p className="mt-2 text-[#6c7887]">
            This review console is reserved for authorized HR administrators.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/">
              <Button variant="outline" className="border-[#274765] text-[#274765]">
                Return to Field App
              </Button>
            </Link>
            <Link href="/login">
              <Button className="bg-[#274765] hover:bg-[#1f3850]">
                Sign in as Admin
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (plans.isLoading) { return <LoadingScreen /> }

  if (plans.isError) {
    return (
      <div className="min-h-screen bg-[#f4f6f9] grid place-items-center p-6 text-center">
        <div className="max-w-lg">
          <ShieldCheck className="mx-auto text-[#a34f38]" size={48} />
          <h1 className="mt-4 text-2xl font-semibold text-[#223047]">
            Google Sheets data could not be loaded
          </h1>
          <p className="mt-2 text-sm text-[#6c7887]">{plans.error.message}</p>
          <Button
            onClick={() => plans.refetch()}
            className="mt-6 bg-[#274765] hover:bg-[#1f3850]"
          >
            <RefreshCw size={16} className="mr-2" />
            Try again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f4f6f9] text-[#223047] lg:grid lg:grid-cols-[260px_1fr]">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col bg-[#1d2c3f] text-white p-6 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="size-10 bg-[#d1a45b] text-[#1d2c3f] rounded-xl grid place-items-center font-bold shadow-md">
            <LayoutDashboard size={20} />
          </div>
          <div>
            <div className="font-semibold tracking-tight text-base leading-tight">
              Sassy Cosmetics
            </div>
            <div className="text-xs text-[#a9b8c6] mt-0.5 font-medium">HR Review Console</div>
          </div>
        </div>

        <div className="mt-10 text-[10px] uppercase tracking-[.2em] text-[#91a4b5] font-bold">
          Navigation
        </div>

        <div className="mt-3 space-y-1">
          <div className="rounded-xl bg-white/10 px-3 py-2.5 flex items-center gap-3 text-sm font-medium text-white shadow-inner">
            <FileSpreadsheet size={18} className="text-[#d1a45b]" />
            Route Submissions
          </div>

          <Link href="/">
            <div className="rounded-xl px-3 py-2.5 flex items-center gap-3 text-sm text-[#b0c0cf] hover:text-white hover:bg-white/5 cursor-pointer transition-colors">
              <MapPin size={18} />
              Field App View
            </div>
          </Link>
        </div>

        <div className="mt-auto border-t border-white/10 pt-5">
          <div className="text-sm font-medium truncate">{user.name || user.email}</div>
          <div className="text-xs text-[#d1a45b] mt-0.5 font-semibold">HR Administrator</div>
          <button
            onClick={() => logout()}
            className="mt-4 text-xs text-[#c3ced8] hover:text-white flex items-center gap-2 transition-colors"
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-col min-w-0">
        <header className="h-20 bg-white border-b border-[#e1e7ee] flex items-center justify-between px-5 sm:px-10 sticky top-0 z-20">
          <div>
            <div className="text-xs uppercase tracking-[.18em] text-[#8b6a32] font-bold">
              Operations &amp; Compliance
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1b2b3d] mt-0.5">
              Weekly Submissions Review
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => utils.routePlans.all.invalidate()}
              disabled={plans.isFetching}
              className="rounded-xl border-[#d7e0e8] text-[#42566b] hover:bg-[#f3f6f9]"
            >
              <RefreshCw
                size={14}
                className={`mr-1.5 ${plans.isFetching ? "animate-spin" : ""}`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="rounded-xl border-[#d7e0e8] text-[#42566b] hover:bg-[#f3f6f9]"
            >
              <Download size={14} className="mr-1.5" />
              <span className="hidden sm:inline">Export CSV</span>
            </Button>

            <Link href="/">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl border-[#d7e0e8] text-[#42566b] hover:bg-[#f3f6f9]"
              >
                <ArrowLeft size={14} className="mr-1.5" />
                <span>Field App</span>
              </Button>
            </Link>
          </div>
        </header>

        <main className="p-5 sm:p-8 max-w-[1500px] w-full mx-auto space-y-6">
          {/* Top Metrics Cards */}
          <div className="grid sm:grid-cols-3 gap-4">
            <Metric
              icon={<FileSpreadsheet size={22} />}
              label="Total Submissions"
              value={(plans.data?.length || 0).toString()}
              tone="blue"
            />
            <Metric
              icon={<Clock3 size={22} />}
              label="Pending Review"
              value={submitted.toString()}
              tone="amber"
            />
            <Metric
              icon={<CheckCircle2 size={22} />}
              label="Reviewed"
              value={reviewed.toString()}
              tone="green"
            />
          </div>

          {/* Master-Detail Grid */}
          <div className="grid xl:grid-cols-[minmax(380px,.9fr)_1.1fr] gap-6 items-start">
            {/* Left Column: Submissions Queue */}
            <Card className="border-0 shadow-[0_8px_35px_rgba(29,44,63,.06)] rounded-2xl overflow-hidden bg-white">
              <div className="p-5 border-b border-[#e8edf2] flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-base text-[#1c2c3e]">Submission Queue</h2>
                  <p className="text-xs text-[#748292] mt-0.5">
                    Select a weekly plan to inspect individual daily visits.
                  </p>
                </div>
                <UsersRound className="text-[#7990a4]" size={20} />
              </div>

              <div className="p-4 border-b border-[#e8edf2] space-y-3 bg-[#fbfcfd]">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 text-[#93a0ad]" size={17} />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by merchandiser or week…"
                    className="w-full h-10 pl-9 pr-3 rounded-xl border border-[#dce4ec] bg-white text-sm outline-none focus:border-[#7894ae] focus:ring-1 focus:ring-[#7894ae] transition-all"
                  />
                </div>

                <div className="flex gap-2">
                  {(["all", "submitted", "reviewed"] as const).map((item) => (
                    <button
                      key={item}
                      onClick={() => setFilter(item)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-all ${
                        filter === item
                          ? "bg-[#274765] text-white shadow-sm"
                          : "bg-[#eef2f6] text-[#637487] hover:bg-[#e4e9ef]"
                      }`}
                    >
                      {item === "submitted" ? "Pending" : item}
                    </button>
                  ))}
                </div>
              </div>

              <CardContent className="p-0">
                <div className="divide-y divide-[#edf1f4] max-h-[580px] overflow-y-auto">
                  {visiblePlans.length === 0 ? (
                    <div className="p-10 text-center text-sm text-[#748292]">
                      No route submissions match this search or filter.
                    </div>
                  ) : (
                    visiblePlans.map((plan) => {
                      const isSelected = (selected?.id ?? visiblePlans[0]?.id) === plan.id
                      return (
                        <button
                          key={plan.id}
                          onClick={() => setSelectedId(plan.id)}
                          className={`w-full text-left p-5 transition-all ${
                            isSelected
                              ? "bg-[#f0f5f8] border-l-4 border-[#d1a45b]"
                              : "border-l-4 border-transparent hover:bg-[#f7f9fb]"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="font-semibold text-sm text-[#1e2f41]">
                                {plan.merchandizerName ||
                                  plan.merchandizerEmail ||
                                  `Merchandiser #${plan.submittedBy}`}
                              </div>
                              <div className="text-xs text-[#788796] mt-1">
                                Week of {plan.weekStart}
                              </div>
                            </div>

                            <span
                              className={`text-[10px] uppercase tracking-[.1em] font-bold rounded-full px-2.5 py-1 ${
                                plan.status === "reviewed"
                                  ? "bg-[#e2f0e6] text-[#4e7b5e]"
                                  : "bg-[#fff0d8] text-[#9a6b21]"
                              }`}
                            >
                              {plan.status === "submitted" ? "Pending" : plan.status}
                            </span>
                          </div>

                          <div className="text-xs text-[#788796] mt-3 flex items-center justify-between">
                            <span>
                              {plan.dailyRoutes?.length || 0} planned visit
                              {plan.dailyRoutes?.length === 1 ? "" : "s"}
                            </span>
                            <span className="font-semibold text-[#304860]">
                              Ksh {Number(plan.totalCost).toFixed(2)}
                            </span>
                          </div>
                        </button>
                      )
                    })
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Right Column: Selected Submission Detail */}
            <Card className="border-0 shadow-[0_8px_35px_rgba(29,44,63,.06)] rounded-2xl overflow-hidden bg-white min-h-[460px]">
              <div className="p-5 sm:p-7 border-b border-[#e8edf2] flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-[.16em] text-[#8b6a32] font-bold">
                    Plan Details
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight text-[#1b2b3d] mt-1">
                    {selected ? `Week of ${selected.weekStart}` : "Select a submission"}
                  </h2>
                  {selected && (
                    <p className="text-sm text-[#748292] mt-1">
                      Submitted by{" "}
                      <span className="font-medium text-[#1e2f41]">
                        {selected.merchandizerName ||
                          selected.merchandizerEmail ||
                          `Merchandiser #${selected.submittedBy}`}
                      </span>
                    </p>
                  )}
                </div>

                {selected && selected.status !== "reviewed" && (
                  <Button
                    onClick={handleMarkReviewed}
                    disabled={markReviewed.isPending}
                    className="bg-[#274765] hover:bg-[#1f3850] rounded-xl shadow-md text-white font-medium"
                  >
                    <CheckCircle2 size={16} className="mr-2" />
                    {markReviewed.isPending ? "Updating…" : "Mark Reviewed"}
                  </Button>
                )}

                {selected && selected.status === "reviewed" && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#e2f0e6] text-[#4e7b5e] text-xs font-bold">
                    <CheckCircle2 size={15} /> Reviewed
                  </span>
                )}
              </div>

              {selected ? (
                <CardContent className="p-5 sm:p-7 space-y-5">
                  <div className="rounded-xl bg-[#f4f7fa] p-4 flex items-center justify-between">
                    <div>
                      <div className="text-xs uppercase tracking-[.12em] text-[#718496] font-medium">
                        Total Estimated Budget
                      </div>
                      <div className="text-2xl font-bold text-[#1f354d] mt-0.5">
                        Ksh {Number(selected.totalCost).toFixed(2)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs uppercase tracking-[.12em] text-[#718496] font-medium">
                        Route Days
                      </div>
                      <div className="text-2xl font-bold text-[#1f354d] mt-0.5">
                        {selected.dailyRoutes?.length || 0}
                      </div>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    {selected.dailyRoutes?.map((route: any, idx: number) => (
                      <div
                        key={`${route.day}-${idx}`}
                        className="rounded-xl border border-[#e1e7ee] p-4 bg-white shadow-sm hover:border-[#c5d3df] transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-[#1d2d3e]">
                            {route.day}
                          </span>
                          <span className="text-xs font-bold text-[#8b6a32] bg-[#fdf8ee] px-2 py-0.5 rounded-md border border-[#faecd3]">
                            Ksh {Number(route.cost).toFixed(2)}
                          </span>
                        </div>

                        <div className="mt-3 text-sm text-[#495c6f] flex items-center gap-2">
                          <span className="font-semibold text-[#1e2f41] truncate max-w-[45%]">
                            {route.from}
                          </span>
                          <span className="text-[#a6b2bd]">→</span>
                          <span className="font-semibold text-[#1e2f41] truncate max-w-[45%]">
                            {route.to}
                          </span>
                        </div>

                        <div className="mt-3 text-xs text-[#7b8997] flex items-center justify-between">
                          <span>
                            Arrive {route.plannedArrival} · Depart {route.departure}
                          </span>
                          <span className="font-medium text-[#465b6f]">
                            {route.transportMode}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              ) : (
                <div className="h-[330px] grid place-items-center text-sm text-[#8693a0]">
                  Choose a submission from the queue to inspect its route details.
                </div>
              )}
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}

function Metric({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode
  label: string
  value: string
  tone: "blue" | "amber" | "green"
}) {
  const colors = {
    blue: "bg-[#e5eef6] text-[#315976]",
    amber: "bg-[#fff0d8] text-[#9a6b21]",
    green: "bg-[#e2f0e6] text-[#4e7b5e]",
  }

  return (
    <Card className="border-0 shadow-[0_5px_22px_rgba(29,44,63,.05)] rounded-2xl bg-white">
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`size-12 rounded-xl grid place-items-center ${colors[tone]}`}>
          {icon}
        </div>
        <div>
          <div className="text-xs uppercase tracking-[.12em] text-[#84919e] font-semibold">
            {label}
          </div>
          <div className="text-2xl font-bold mt-0.5 text-[#1a2b3d]">{value}</div>
        </div>
      </CardContent>
    </Card>
  )
}
