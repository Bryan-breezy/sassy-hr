import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export type NightOutDraft = {
  enabled: boolean
  amount: string
}

export const blankNightOut = (): NightOutDraft => ({ enabled: false, amount: "" })

type NightOutAllowanceProps = {
  day: string
  value: NightOutDraft
  onChange: (patch: Partial<NightOutDraft>) => void
}

export default function NightOutAllowance({ day, value, onChange }: NightOutAllowanceProps) {
  const id = `night-out-${day.toLowerCase()}`

  return (
    <div className="mt-3 rounded-xl border border-[#edf0eb] bg-white p-3">
      <div className="flex items-center gap-2">
        <Checkbox
          id={id}
          checked={value.enabled}
          onCheckedChange={checked => onChange({ enabled: checked === true })}
          className="border-[#b8c7b8] data-[state=checked]:bg-[#143f37]"
        />
        <Label htmlFor={id} className="cursor-pointer text-xs font-medium text-[#5b7266]">
          Claim night-out allowance for {day}
        </Label>
      </div>
      {value.enabled && (
        <div className="mt-3 max-w-xs">
          <Label htmlFor={`${id}-amount`} className="text-xs text-[#77877d]">Amount spent (Ksh)</Label>
          <Input
            id={`${id}-amount`}
            type="number"
            inputMode="decimal"
            min="0"
            max="100000"
            step="0.01"
            value={value.amount}
            placeholder="0.00"
            onChange={event => onChange({ amount: event.target.value })}
            className="mt-1 h-10 rounded-xl border-[#dfe7df]"
          />
        </div>
      )}
    </div>
  )
}
