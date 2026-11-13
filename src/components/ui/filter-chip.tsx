import * as React from "react";
import { Button, type ButtonProps } from "./button";
import { cn } from "@/lib/utils";

export interface FilterChipProps extends ButtonProps { active?: boolean; count?: number; }
export const FilterChip = React.forwardRef<HTMLButtonElement, FilterChipProps>(({ active, count, className, children, ...props }, ref) => (
  <Button ref={ref} variant="outline" size="sm" {...props} aria-pressed={active ?? props["aria-pressed"]} className={cn("ui-filter ui-control h-8 gap-1.5 px-3", className)}>
    {children}{count !== undefined && <span className="text-[10px] tabular-nums text-muted-foreground">{count}</span>}
  </Button>
));
FilterChip.displayName = "FilterChip";