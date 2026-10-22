import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { CheckCircle2, FileText } from "lucide-react"
import type { HRPlan } from "@/lib/hrTypes"

export default function HRSubmissionDetails({
  selected,
  confirmReviewOpen,
  isMarkingReviewed,
  onConfirmReviewChange,
  onMarkReviewed,
  onDownloadReviewedPlan,
}: {
  selected?: HRPlan
  confirmReviewOpen: boolean
  isMarkingReviewed: boolean
  onConfirmReviewChange: (open: boolean) => void
  onMarkReviewed: () => void
  onDownloadReviewedPlan: (plan: HRPlan, reviewedOn?: Date | string) => void | Promise<boolean>
}) {
  return (
    <Card className="border-0 shadow-[0_8px_35px_rgba(29,44,63,.06)] rounded-2xl overflow-hidden bg-white min-h-[460px]">
      <div className="p-5 sm:p-7 border-b border-[#e8edf2] flex items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[.16em] text-[#8b6a32] font-bold">Plan Details</div>
          <h2 className="text-2xl font-bold tracking-tight text-[#1b2b3d] mt-1">{selected ? `Week of ${selected.weekStart}` : "Select a submission"}</h2>
          {selected && (
            <p className="text-sm text-[#748292] mt-1">
              Submitted by <span className="font-medium text-[#1e2f41]">{selected.merchandizerName || selected.merchandizerEmail || `Merchandiser #${selected.submittedBy}`}</span>
            </p>
          )}
        </div>

        {selected && selected.status !== "reviewed" && (
          <Button onClick={() => onConfirmReviewChange(true)} disabled={isMarkingReviewed} className="bg-[#274765] hover:bg-[#1f3850] rounded-xl shadow-md text-white font-medium">
            <CheckCircle2 size={16} className="mr-2" />
            {isMarkingReviewed ? "Updating…" : "Mark Reviewed"}
          </Button>
        )}

        <AlertDialog open={confirmReviewOpen} onOpenChange={onConfirmReviewChange}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Mark this route plan as reviewed?</AlertDialogTitle>
              <AlertDialogDescription>
                {selected && <>
                  This updates the status for <span className="font-medium text-[#1e2f41]">{selected.merchandizerName || selected.merchandizerEmail || `Merchandiser #${selected.submittedBy}`}</span>
                  's week commencing {selected.weekStart} in Google Sheets, and immediately downloads a PDF review report with the merchandiser&apos;s details. This can&apos;t be undone from here.
                </>}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onMarkReviewed}>Yes, mark reviewed</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {selected?.status === "reviewed" && (
          <div className="flex flex-col items-end gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#e2f0e6] text-[#4e7b5e] text-xs font-bold">
              <CheckCircle2 size={15} /> Reviewed
            </span>
            <Button variant="outline" size="sm" onClick={() => onDownloadReviewedPlan(selected, selected.updatedAt)} className="rounded-xl border-[#d7e0e8] text-[#42566b] hover:bg-[#f3f6f9]">
              <FileText size={14} className="mr-1.5" /> Download PDF
            </Button>
          </div>
        )}
      </div>

      {selected ? (
        <CardContent className="p-5 sm:p-7 space-y-5">
          <div className="rounded-xl bg-[#f4f7fa] p-4 flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-[.12em] text-[#718496] font-medium">Total Estimated Budget</div>
              <div className="text-2xl font-bold text-[#1f354d] mt-0.5">Ksh {Number(selected.totalCost).toFixed(2)}</div>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase tracking-[.12em] text-[#718496] font-medium">Route Days</div>
              <div className="text-2xl font-bold text-[#1f354d] mt-0.5">{selected.dailyRoutes?.length || 0}</div>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {selected.dailyRoutes?.map((route, index) => (
              <div key={`${route.day}-${index}`} className="rounded-xl border border-[#e1e7ee] p-4 bg-white shadow-sm hover:border-[#c5d3df] transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-[#1d2d3e]">{route.day}</span>
                  <span className="text-xs font-bold text-[#8b6a32] bg-[#fdf8ee] px-2 py-0.5 rounded-md border border-[#faecd3]">Ksh {Number(route.cost).toFixed(2)}</span>
                </div>
                <div className="mt-3 text-sm text-[#495c6f] flex items-center gap-2">
                  <span className="font-semibold text-[#1e2f41] truncate max-w-[45%]">{route.from}</span>
                  <span className="text-[#a6b2bd]">→</span>
                  <span className="font-semibold text-[#1e2f41] truncate max-w-[45%]">{route.to}</span>
                </div>
                <div className="mt-3 text-xs text-[#7b8997] flex items-center justify-between">
                  <span>Arrive {route.plannedArrival} · Depart {route.departure}</span>
                  <span className="font-medium text-[#465b6f]">{route.transportMode}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      ) : (
        <div className="h-[330px] grid place-items-center text-sm text-[#8693a0]">Choose a submission from the queue to inspect its route details.</div>
      )}
    </Card>
  )
}