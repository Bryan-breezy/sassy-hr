import { Card, CardContent } from "@/components/ui/card"
import PlanRow from "@/components/PlanRow"

type RecentSubmissionsProps = {
  plans: any[]
  openPlan: number | null
  onSetOpenPlan: (id: number | null) => void
}

export default function RecentSubmissions({ plans, openPlan, onSetOpenPlan }: RecentSubmissionsProps) {
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
          {!plans.length ?
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