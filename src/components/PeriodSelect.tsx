import { FilterChip } from "@/components/ui/filter-chip";
import { PERIODS, PeriodKey } from "@/lib/stats";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/** Chips on wide screens, a dropdown on narrow ones — never scrolls sideways. */
export function PeriodSelect({ value, onChange, only, compact }: { value: PeriodKey; onChange: (v: PeriodKey) => void; only?: PeriodKey[]; compact?: boolean }) {
  const list = PERIODS.filter((p) => !only || only.includes(p.key));
  return (
    <>
      <div className="sm:hidden">
        <Select value={value} onValueChange={(v) => onChange(v as PeriodKey)}>
          <SelectTrigger aria-label="Periode" className="h-9 w-auto min-w-[7.5rem]"><SelectValue /></SelectTrigger>
          <SelectContent>{list.map((p) => <SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="hidden flex-wrap justify-end gap-2 sm:flex" role="group" aria-label="Periode">
        {list.map((p) => (
          <FilterChip key={p.key} onClick={() => onChange(p.key)} aria-pressed={value === p.key} className={compact ? " h-8 shrink-0 px-3 text-xs" : " shrink-0"}>{p.label}</FilterChip>
        ))}
      </div>
    </>
  );
}
