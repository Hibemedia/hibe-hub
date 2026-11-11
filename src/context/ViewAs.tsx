import { createContext, useContext, ReactNode } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/** Set while HIBE looks at the client environment of one client ("Bekijk als klant"). Read-only. */
const Ctx = createContext<{ clientId: string } | null>(null);
export const ViewAsProvider = ({ clientId, children }: { clientId: string; children: ReactNode }) => <Ctx.Provider value={{ clientId }}>{children}</Ctx.Provider>;
export const useViewAs = () => useContext(Ctx);
export const READ_ONLY_HINT = "Alleen-lezen in meekijkmodus";

/** Wraps a disabled control so hovering explains why. */
export function ReadOnlyTip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild><span tabIndex={0} className={className} title={READ_ONLY_HINT}>{children}</span></TooltipTrigger>
      <TooltipContent>{READ_ONLY_HINT}</TooltipContent>
    </Tooltip>
  );
}
