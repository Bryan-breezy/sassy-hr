export default function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl bg-white border border-[#e5ebe3] p-3 sm:p-4">
      <div className="text-base sm:text-xl font-semibold tracking-tight break-words">{value}</div>
      <div className="text-[11px] sm:text-xs leading-tight text-[#7b8a81] mt-1">{label}</div>
    </div>
  )
}