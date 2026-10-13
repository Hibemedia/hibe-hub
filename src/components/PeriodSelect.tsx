import { PERIODS, PeriodKey } from "@/lib/stats";

export function PeriodSelect({ value, onChange }: { value: PeriodKey; onChange: (v: PeriodKey) => void }) {
  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0" role="group" aria-label="Periode">
      {PERIODS.map((p) => (
        <button key={p.key} onClick={() => onChange(p.key)} aria-pressed={value === p.key} className="chip-filter shrink-0">{p.label}</button>
      ))}
    </div>
  );
}
