import { Card, CardContent } from "@/components/ui/card"
import PlanRow from "@/components/PlanRow"

type RecentSubmissionsProps = {
  plans: any[]
  isLoading: boolean
  openPlan: number | null
  onSetOpenPlan: (id: number | null) => void
}

export default function RecentSubmissions({ plans, isLoading, openPlan, onSetOpenPlan }: RecentSubmissionsProps) {
  return (
    <section className="mt-12">
      <div className="flex items-end justify-between mb-5">
        <div>
          <div className="text-xs uppercase tracking-[.18em] text-[#8b5e3c] font-semibold">Your workspace</div>
          <h2 className="text-2xl font-semibold tracking-tight mt-1">Recent submissions</h2>
        </div>
      </div>
      <Card className="border-0 shadow-sm rounded-3xl overflow-hidden">
        <CardContent className="p-0">
          {isLoading ?
            <div role="status" aria-label="Loading recent submissions" className="space-y-px">
              {[0, 1, 2].map(index => (
                <div key={index} aria-hidden="true" className="h-20 animate-pulse motion-reduce:animate-none border-b border-[#edf0eb] bg-[#f6f7f4]" />
              ))}
            </div> : !plans.length ?
            <div className="p-8 text-center text-[#718278]">Your submitted weekly plans will appear here.</div> :
            <div className="divide-y divide-[#edf0eb]">
              {plans.map(plan => (
                <PlanRow key={plan.id} plan={plan} openPlan={openPlan} setOpenPlan={onSetOpenPlan} />
              ))}
            </div>
          }
        </CardContent>
      </Card>
    </section>
  )
}
