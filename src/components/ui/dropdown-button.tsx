import * as React from "react";
import { ChevronDown } from "lucide-react";
import { Button, type ButtonProps } from "./button";
import { cn } from "@/lib/utils";

export interface DropdownButtonProps extends ButtonProps { label?: React.ReactNode; value?: React.ReactNode; }
export const DropdownButton = React.forwardRef<HTMLButtonElement, DropdownButtonProps>(({ label, value, children, className, ...props }, ref) => (
  <Button ref={ref} variant="outline" {...props} className={cn("ui-control min-w-0 rounded-control border-border bg-card text-foreground", className)}>
    {label && <span className="text-muted-foreground">{label}</span>}
    {value && <span className="min-w-0 truncate">{value}</span>}{children}<ChevronDown className="ml-auto h-4 w-4 shrink-0 text-muted-foreground" />
  </Button>
));
DropdownButton.displayName = "DropdownButton";