import * as React from "react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

export type SegmentOption<T extends string> = { value: T; label: React.ReactNode; disabled?: boolean; action?: () => void; trigger?: boolean };
export function SegmentedControl<T extends string>({ options, value, onChange, label, className }: { options: SegmentOption<T>[]; value: T; onChange: (value: T) => void; label?: string; className?: string }) {
  return <div role="group" aria-label={label} className={cn("inline-flex max-w-full items-center rounded-control border border-border bg-card p-1", className)}>
    {options.map((option) => <Button asChild={option.trigger} key={option.value} variant="ghost" size="sm" disabled={option.disabled} aria-pressed={option.value === value} onClick={() => option.action ? option.action() : onChange(option.value)} className={cn("ui-control h-8 min-w-0 rounded-tag px-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground", option.value === value && "bg-lime text-lime-foreground hover:bg-lime hover:text-lime-foreground")}>{option.label}</Button>)}
  </div>;
}