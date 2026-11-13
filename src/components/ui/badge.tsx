import * as React from "react";
import { Tag, type TagVariant } from "./tag";
import { cn } from "@/lib/utils";
const variants = { default: "neutral", secondary: "neutral", destructive: "danger", success: "success", warning: "warning", gradient: "neutral", accent: "info", outline: "neutral" } as const;
export function badgeVariants({ variant = "default" }: { variant?: keyof typeof variants } = {}) { return cn("ui-tag", `ui-tag-${variants[variant]}`); }
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> { variant?: keyof typeof variants; }
export function Badge({ variant = "default", ...props }: BadgeProps) { return <Tag variant={variants[variant] as TagVariant} {...props} />; }
