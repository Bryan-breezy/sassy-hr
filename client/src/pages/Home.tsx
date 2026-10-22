import { useState } from "react"
import { useAuth } from "@/_core/hooks/useAuth"
import { trpc } from "@/lib/trpc"
import LoadingScreen from "@/components/LoadingScreen"
import HomeHeader from "@/components/HomeHeader"
import RecentSubmissions from "@/components/RecentSubmissions"
import RouteOverview from "@/components/RouteOverview"
import RoutePlanForm from "@/components/RoutePlanForm"
import useRoutePlan, { DAYS } from "../hooks/useRoutePlan"

export default function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth({ redirectOnUnauthenticated: true })
  const [openPlan, setOpenPlan] = useState<number | null>(null)
  const routePlan = useRoutePlan(isAuthenticated)
  const mine = trpc.routePlans.mine.useQuery(undefined, { enabled: isAuthenticated })

  if (loading || !isAuthenticated) return <LoadingScreen />
  if (mine.isLoading) return <LoadingScreen />

  return (
    <div className="min-h-screen bg-[#f6f7f4] text-[#18352f]">
      <HomeHeader
        userRole={user?.role}
        displayName={user?.name || user?.email || ""}
        isAuthenticated={isAuthenticated}
        onLogout={() => logout()}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-12">
        <div className="grid lg:grid-cols-[1.05fr_.95fr] gap-6 lg:gap-8 items-start">
          <RouteOverview
            days={DAYS}
            activeRoutesCount={routePlan.activeRoutes.length}
            totalCost={routePlan.totalCost}
            savedPlansCount={mine.data?.length || 0}
            routes={routePlan.routes}
            activeDays={routePlan.activeDays}
            onToggleDay={routePlan.toggleDay}
          />
          <RoutePlanForm
            days={DAYS}
            weekStart={routePlan.weekStart}
            routes={routePlan.routes}
            activeDays={routePlan.activeDays}
            dayErrors={routePlan.dayErrors}
            activeRoutesCount={routePlan.activeRoutes.length}
            transportCost={routePlan.transportCost}
            lunchCost={routePlan.lunchCost}
            daysWithData={routePlan.daysWithData}
            totalCost={routePlan.totalCost}
            isSubmitting={routePlan.isSubmitting}
            isAuthenticated={isAuthenticated}
            onWeekStartChange={routePlan.onWeekStartChange}
            onToggleDay={routePlan.toggleDay}
            onRemoveVisit={routePlan.removeVisit}
            onChangeRoute={routePlan.changeRoute}
            onSubmit={routePlan.handleSubmit}
          />
        </div>
        <RecentSubmissions
          plans={mine.data || []}
          openPlan={openPlan}
          onSetOpenPlan={setOpenPlan}
        />
      </main>
    </div>
  )
}

