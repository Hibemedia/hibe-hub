import * as React from "react";
import { cn } from "@/lib/utils";

export type TagVariant = "neutral" | "success" | "warning" | "danger" | "info";
export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: TagVariant;
  icon?: React.ReactNode;
  logo?: React.ReactNode;
}
export const Tag = React.forwardRef<HTMLSpanElement, TagProps>(({ variant = "neutral", icon, logo, className, children, ...props }, ref) => (
  <span ref={ref} className={cn("ui-tag", `ui-tag-${variant}`, className)} {...props}>
    {(logo || icon) && <span className="flex h-4 w-4 shrink-0 items-center justify-center overflow-hidden [&_img]:h-full [&_img]:w-full [&_svg]:h-4 [&_svg]:w-4">{logo || icon}</span>}
    {children}
  </span>
));
Tag.displayName = "Tag";