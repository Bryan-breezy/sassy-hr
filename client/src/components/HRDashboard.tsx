import HRMetrics from "@/components/HRMetrics"
import HRSubmissionDetails from "@/components/HRSubmissionDetails"
import HRSubmissionQueue from "@/components/HRSubmissionQueue"
import { HRHeader, HRSidebar } from "@/components/HRChrome"
import type { HRPlan, PlanFilter } from "@/lib/hrTypes"

export default function HRDashboard({
  displayName,
  isFetching,
  onRefresh,
  onExportCSV,
  totalPlans,
  submitted,
  reviewed,
  visiblePlans,
  selected,
  search,
  filter,
  onSearchChange,
  onFilterChange,
  onSelectPlan,
  onLogout,
  confirmReviewOpen,
  isMarkingReviewed,
  onConfirmReviewChange,
  onMarkReviewed,
  onDownloadReviewedPlan,
}: {
  displayName: string
  isFetching: boolean
  onRefresh: () => void
  onExportCSV: () => void
  totalPlans: number
  submitted: number
  reviewed: number
  visiblePlans: HRPlan[]
  selected?: HRPlan
  search: string
  filter: PlanFilter
  onSearchChange: (value: string) => void
  onFilterChange: (value: PlanFilter) => void
  onSelectPlan: (id: number) => void
  onLogout: () => void
  confirmReviewOpen: boolean
  isMarkingReviewed: boolean
  onConfirmReviewChange: (open: boolean) => void
  onMarkReviewed: () => void
  onDownloadReviewedPlan: (plan: HRPlan, reviewedOn?: Date | string) => void | Promise<boolean>
}) {
  return (
    <div className="min-h-screen bg-[#f4f6f9] text-[#223047] lg:grid lg:grid-cols-[260px_1fr]">
      <HRSidebar displayName={displayName} onLogout={onLogout} />
      <div className="flex flex-col min-w-0">
        <HRHeader isFetching={isFetching} onRefresh={onRefresh} onExportCSV={onExportCSV} />
        <main className="p-5 sm:p-8 max-w-[1500px] w-full mx-auto space-y-6">
          <HRMetrics total={totalPlans} pending={submitted} reviewed={reviewed} />
          <div className="grid xl:grid-cols-[minmax(380px,.9fr)_1.1fr] gap-6 items-start">
            <HRSubmissionQueue
              plans={visiblePlans}
              selectedId={selected?.id}
              search={search}
              filter={filter}
              onSearchChange={onSearchChange}
              onFilterChange={onFilterChange}
              onSelect={onSelectPlan}
            />
            <HRSubmissionDetails
              selected={selected}
              confirmReviewOpen={confirmReviewOpen}
              isMarkingReviewed={isMarkingReviewed}
              onConfirmReviewChange={onConfirmReviewChange}
              onMarkReviewed={onMarkReviewed}
              onDownloadReviewedPlan={onDownloadReviewedPlan}
            />
          </div>
        </main>
      </div>
    </div>
  )
}