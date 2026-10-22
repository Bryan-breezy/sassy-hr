import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

type HomeHeaderProps = {
  userRole?: string
  displayName?: string
  isAuthenticated: boolean
  onLogout: () => void
}

export default function HomeHeader({ userRole, displayName, isAuthenticated, onLogout }: HomeHeaderProps) {
  return (
    // A header that:
    // Stays pinned to the top while the page scrolls (sticky top-0).
    // Semi-transparently frosts the content passing underneath (bg-[...]/90 + backdrop-blur) — letting ~10% of the blurred content bleed through 
    // Has a subtle divider line at the bottom (border-b border-[#dfe7df]) matching the off-white/sage palette.

    <header className="border-b border-[#dfe7df] bg-[#f6f7f4]/90 backdrop-blur sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 sm:h-20 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="min-w-0">
            <div className="font-semibold tracking-tight text-sm sm:text-lg truncate">
              Sassy Cosmetic &amp; Beauty Products (K) Limited
            </div>
            <div className="text-[11px] sm:text-xs text-[#6d8075] truncate">
              Merchandisers weekly Route Plan
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {userRole === "admin" && (
            <a
              href="/hr"
              className="inline-flex items-center px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#8b5e3c] text-white text-[11px] sm:text-xs font-semibold tracking-wide hover:bg-[#6d442d] transition-colors"
            >
              <span className="hidden sm:inline">HR Console</span>
              <span className="sm:hidden">HR</span>
            </a>
          )}
          {isAuthenticated && (
            <>
              <div className="hidden sm:block text-right">
                <div className="text-sm font-medium">{displayName}</div>
                <div className="text-xs text-[#718278]">
                  {userRole === "admin" ? "HR administrator" : "Merchandiser"}
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onLogout} aria-label="Sign out">
                <LogOut size={18} />
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}