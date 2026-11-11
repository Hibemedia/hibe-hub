import { createContext, useContext, useState, type ReactNode, type ComponentProps } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Slots = { titleEl: HTMLElement | null; actionEl: HTMLElement | null; setTitleEl: (e: HTMLElement | null) => void; setActionEl: (e: HTMLElement | null) => void };
const Ctx = createContext<Slots>({ titleEl: null, actionEl: null, setTitleEl: () => {}, setActionEl: () => {} });

/** Holds the top-bar slots that pages fill with their title and primary action. */
export function PageHeaderProvider({ children }: { children: ReactNode }) {
  const [titleEl, setTitleEl] = useState<HTMLElement | null>(null);
  const [actionEl, setActionEl] = useState<HTMLElement | null>(null);
  return <Ctx.Provider value={{ titleEl, actionEl, setTitleEl, setActionEl }}>{children}</Ctx.Provider>;
}
export const useHeaderSlots = () => useContext(Ctx);

/** Renders a page's title and main button into the fixed top bar. */
export function PageHeader({ title, action }: { title: ReactNode; action?: ReactNode }) {
  const { titleEl, actionEl } = useContext(Ctx);
  return (
    <>
      {titleEl && createPortal(<h1 className="truncate text-xl font-semibold leading-none tracking-tight">{title}</h1>, titleEl)}
      {actionEl && action ? createPortal(action, actionEl) : null}
    </>
  );
}

const actionCls = "inline-flex h-9 shrink-0 items-center gap-2 rounded-md bg-foreground px-3 text-sm font-medium text-background transition-colors hover:bg-foreground/85 disabled:opacity-50 sm:px-3.5";

/** The single primary button of a page (same place on every page). */
export function PrimaryAction({ icon: Icon, children, to, className, ...rest }: { icon: LucideIcon; children: ReactNode; to?: string } & ComponentProps<"button">) {
  const inner = <><Icon className="h-4 w-4" aria-hidden /><span className="hidden sm:inline">{children}</span></>;
  const label = typeof children === "string" ? children : undefined;
  if (to) return <Link to={to} aria-label={label} className={cn(actionCls, className)}>{inner}</Link>;
  return <button type="button" aria-label={label} className={cn(actionCls, className)} {...rest}>{inner}</button>;
}
