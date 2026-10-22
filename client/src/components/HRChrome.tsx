import { Button } from "@/components/ui/button"
import { Link } from "wouter"
import { ArrowLeft, FileSpreadsheet, LayoutDashboard, LogOut, MapPin, RefreshCw, Download } from "lucide-react"

export function HRSidebar({ displayName, onLogout }: { displayName: string; onLogout: () => void }) {
  return (
    <aside className="hidden lg:flex flex-col bg-[#1d2c3f] text-white p-6 shadow-xl">
      <div className="flex items-center gap-3">
        <div className="size-10 bg-[#d1a45b] text-[#1d2c3f] rounded-xl grid place-items-center font-bold shadow-md">
          <LayoutDashboard size={20} />
        </div>
        <div>
          <div className="font-semibold tracking-tight text-base leading-tight">Sassy Cosmetics</div>
          <div className="text-xs text-[#a9b8c6] mt-0.5 font-medium">HR Review Console</div>
        </div>
      </div>

      <div className="mt-10 text-[10px] uppercase tracking-[.2em] text-[#91a4b5] font-bold">Navigation</div>
      <div className="mt-3 space-y-1">
        <div className="rounded-xl bg-white/10 px-3 py-2.5 flex items-center gap-3 text-sm font-medium text-white shadow-inner">
          <FileSpreadsheet size={18} className="text-[#d1a45b]" />
          Route Submissions
        </div>
        <Link href="/">
          <div className="rounded-xl px-3 py-2.5 flex items-center gap-3 text-sm text-[#b0c0cf] hover:text-white hover:bg-white/5 cursor-pointer transition-colors">
            <MapPin size={18} /> Field App View
          </div>
        </Link>
      </div>

      <div className="mt-auto border-t border-white/10 pt-5">
        <div className="text-sm font-medium truncate">{displayName}</div>
        <div className="text-xs text-[#d1a45b] mt-0.5 font-semibold">HR Administrator</div>
        <button onClick={onLogout} className="mt-4 text-xs text-[#c3ced8] hover:text-white flex items-center gap-2 transition-colors">
          <LogOut size={14} /> Sign out
        </button>
      </div>
    </aside>
  )
}

export function HRHeader({ isFetching, onRefresh, onExportCSV }: {
  isFetching: boolean
  onRefresh: () => void
  onExportCSV: () => void
}) {
  return (
    <header className="h-20 bg-white border-b border-[#e1e7ee] flex items-center justify-between px-5 sm:px-10 sticky top-0 z-20">
      <div>
        <div className="text-xs uppercase tracking-[.18em] text-[#8b6a32] font-bold">Operations &amp; Compliance</div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1b2b3d] mt-0.5">Weekly Submissions Review</h1>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <Button variant="outline" size="sm" onClick={onRefresh} disabled={isFetching} className="rounded-xl border-[#d7e0e8] text-[#42566b] hover:bg-[#f3f6f9]">
          <RefreshCw size={14} className={`mr-1.5 ${isFetching ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
        <Button variant="outline" size="sm" onClick={onExportCSV} className="rounded-xl border-[#d7e0e8] text-[#42566b] hover:bg-[#f3f6f9]">
          <Download size={14} className="mr-1.5" />
          <span className="hidden sm:inline">Export CSV</span>
        </Button>
        <Link href="/">
          <Button variant="outline" size="sm" className="rounded-xl border-[#d7e0e8] text-[#42566b] hover:bg-[#f3f6f9]">
            <ArrowLeft size={14} className="mr-1.5" /> Field App
          </Button>
        </Link>
      </div>
    </header>
  )
}