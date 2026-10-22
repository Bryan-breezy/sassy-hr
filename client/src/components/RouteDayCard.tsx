import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Check, Plus, Trash2 } from "lucide-react"
import { LUNCH_ALLOWANCE_PER_DAY } from "@shared/planCost"
import NightOutAllowance, { type NightOutDraft } from "@/components/NightOutAllowance"

export const TRANSPORT_MODES = ["Walking", "Public transport", "Motorcycle", "Car", "Taxi", "Other"] as const

export type RouteDraft = {
  from: string
  to: string
  plannedArrival: string
  departure: string
  transportMode: typeof TRANSPORT_MODES[number]
  cost: string
}

type RouteDayCardProps = {
  day: string
  index: number
  cardId?: string
  routes: RouteDraft[]
  error?: string
  canRemove: boolean
  onRemove: () => void
  onRemoveVisit: (routeIndex: number) => void
  onChange: (routeIndex: number, field: keyof RouteDraft, value: string) => void
  nightOut: NightOutDraft
  onNightOutChange: (patch: Partial<NightOutDraft>) => void
}

export default function RouteDayCard({ day, index, cardId, routes, error, canRemove, onRemove, onRemoveVisit, onChange, nightOut, onNightOutChange }: RouteDayCardProps) {
  const active = routes.some(route => route.from.trim() || route.to.trim())
  return (
    <div id={cardId} tabIndex={-1} className={`scroll-mt-24 rounded-2xl border ${active ? "border-[#c8d8c5] bg-[#fbfcf8]" : "border-[#edf0eb] bg-white"} ${error ? "border-[#b85f46]" : ""} p-3.5 sm:p-4 transition-all`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`size-8 rounded-xl grid place-items-center text-xs font-semibold ${active ? "bg-[#dce9d5] text-[#3e654d]" : "bg-[#f1f3ef] text-[#8a978e]"}`}>
          {String(index + 1).padStart(2, "0")}
        </div>
        <div className="min-w-0 font-semibold text-sm">{day}</div>
        {active && <Check size={16} className="shrink-0 text-[#5b8a62]" />}

        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="ml-auto shrink-0 text-xs text-[#95a49a] hover:text-[#b85f46] flex items-center gap-1 transition-colors"
            title={`Remove ${day}`}
          >
            <Trash2 size={14} />
            <span className="hidden sm:inline">Remove</span>
          </button>
        )}
      </div>

      {error && <p role="alert" className="mb-3 rounded-lg bg-[#fff1eb] px-3 py-2 text-xs text-[#a34f38]">{error}</p>}

      <div className="space-y-4">
        {routes.map((route, routeIndex) => (
          <div key={routeIndex} className="rounded-xl border border-[#edf0eb] bg-white p-3">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[.12em] text-[#8a978e]">Visit {routeIndex + 1}</span>
              {routes.length > 1 && <button type="button" onClick={() => onRemoveVisit(routeIndex)} className="text-xs text-[#95a49a] hover:text-[#b85f46]">Remove visit</button>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 sm:col-span-1"><Field label="From" value={route.from} placeholder="e.g. CBD Nairobi" onChange={v => onChange(routeIndex, "from", v)} /></div>
              <div className="col-span-2 sm:col-span-1"><Field label="To" value={route.to} placeholder="e.g. Westlands Supermarket" onChange={v => onChange(routeIndex, "to", v)} /></div>
              <Field label="Planned arrival" type="time" value={route.plannedArrival} onChange={v => onChange(routeIndex, "plannedArrival", v)} />
              <Field label="Departure" type="time" value={route.departure} onChange={v => onChange(routeIndex, "departure", v)} />
              <div className="min-w-0">
                <Label className="text-xs text-[#77877d]">Transport mode</Label>
                <Select value={route.transportMode} onValueChange={v => onChange(routeIndex, "transportMode", v)}>
                  <SelectTrigger className="mt-1 h-11 w-full min-w-0 rounded-xl border-[#dfe7df] text-xs sm:text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{TRANSPORT_MODES.map(mode => <SelectItem key={mode} value={mode}>{mode}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Field label="Cost incurred (Ksh)" inputMode="decimal" value={route.cost} placeholder="0.00" onChange={v => onChange(routeIndex, "cost", v)} />
            </div>
          </div>
        ))}
      </div>
      {routes.length < 7 && <Button type="button" variant="outline" className="mt-3 h-10 w-full rounded-xl border-dashed text-[#143f37]" onClick={() => onChange(routes.length, "from", "")}>
        <Plus size={16} /> Add another visit on {day}
      </Button>}
      {active && (
        <div className="mt-3 flex items-center justify-between rounded-xl bg-[#f3f6ef] px-3 py-2 text-xs text-[#5b7266]">
          <span>Lunch allowance </span>
          <span className="font-semibold text-[#143f37]">+ Ksh {LUNCH_ALLOWANCE_PER_DAY.toFixed(2)}</span>
        </div>
      )}
      <NightOutAllowance day={day} value={nightOut} onChange={onNightOutChange} />
    </div>
  )
}

function Field({ label, value, onChange, placeholder, type = "text", prefix, inputMode }: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: string
  prefix?: string
  inputMode?: "decimal"
}) {
  return (
    <div>
      <Label className="text-xs text-[#77877d]">{label}</Label>
      <div className="relative mt-1">
        {prefix && <span className="absolute left-3 top-3 text-[#9aa69e]">{prefix}</span>}
        <Input
          type={type}
          inputMode={inputMode}
          value={value}
          placeholder={placeholder}
          onChange={event => onChange(event.target.value)}
          className={`h-11 rounded-xl border-[#dfe7df] ${prefix ? "pl-7" : ""}`}
        />
      </div>
    </div>
  )
}
