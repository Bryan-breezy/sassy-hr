import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2, Clock3, FileSpreadsheet } from "lucide-react"

export default function HRMetrics({ total, pending, reviewed }: { total: number; pending: number; reviewed: number }) {
  return (
    <div className="grid sm:grid-cols-3 gap-4">
      <Metric icon={<FileSpreadsheet size={22} />} label="Total Submissions" value={total.toString()} tone="blue" />
      <Metric icon={<Clock3 size={22} />} label="Pending Review" value={pending.toString()} tone="amber" />
      <Metric icon={<CheckCircle2 size={22} />} label="Reviewed" value={reviewed.toString()} tone="green" />
    </div>
  )
}

function Metric({ icon, label, value, tone }: {
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
        <div className={`size-12 rounded-xl grid place-items-center ${colors[tone]}`}>{icon}</div>
        <div>
          <div className="text-xs uppercase tracking-[.12em] text-[#84919e] font-semibold">{label}</div>
          <div className="text-2xl font-bold mt-0.5 text-[#1a2b3d]">{value}</div>
        </div>
      </CardContent>
    </Card>
  )
}