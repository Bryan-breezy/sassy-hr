import { Button } from "@/components/ui/button"
import { RefreshCw, ShieldCheck } from "lucide-react"
import { Link } from "wouter"

export function HRAccessDenied() {
  return (
    <div className="min-h-screen bg-[#f4f6f9] grid place-items-center p-6 text-center">
      <div>
        <ShieldCheck className="mx-auto text-[#274765]" size={48} />
        <h1 className="mt-4 text-3xl font-semibold text-[#223047]">HR Access Only</h1>
        <p className="mt-2 text-[#6c7887]">This review console is reserved for authorized HR administrators.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/">
            <Button variant="outline" className="border-[#274765] text-[#274765]">Return to Field App</Button>
          </Link>
          <Link href="/login">
            <Button className="bg-[#274765] hover:bg-[#1f3850]">Sign in as Admin</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export function HRLoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-[#f4f6f9] grid place-items-center p-6 text-center">
      <div className="max-w-lg">
        <ShieldCheck className="mx-auto text-[#a34f38]" size={48} />
        <h1 className="mt-4 text-2xl font-semibold text-[#223047]">Google Sheets data could not be loaded</h1>
        <p className="mt-2 text-sm text-[#6c7887]">{message}</p>
        <Button onClick={onRetry} className="mt-6 bg-[#274765] hover:bg-[#1f3850]">
          <RefreshCw size={16} className="mr-2" /> Try again
        </Button>
      </div>
    </div>
  )
}