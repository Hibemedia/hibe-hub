import { BarChart3, Calendar, CheckCircle, Award, Archive, Settings, LogOut, Home, Users, Building2, type LucideIcon } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useClient } from "@/context/ClientContext";
import { usePendingReviewCount } from "@/hooks/useReviews";

type Item = { title: string; url: string; icon: LucideIcon; admin?: boolean };
const menuItems: Item[] = [
  { title: "Dashboard", url: "/home", icon: Home },
  { title: "Performance", url: "/performance", icon: BarChart3 },
  { title: "Video Goedkeuring", url: "/video-approval", icon: CheckCircle },
  { title: "Medailles", url: "/medals", icon: Award },
  { title: "Branding & Archief", url: "/branding", icon: Archive },
  { title: "Contentmomenten", url: "/content-moments", icon: Calendar },
  { title: "Klanten", url: "/klanten", icon: Building2, admin: true },
  { title: "Gebruikers Beheer", url: "/gebruikersbeheer", icon: Users, admin: true },
];

function RoundLink({ item, side = "right", badge }: { item: Item; side?: "right" | "top"; badge?: number }) {
  const active = useLocation().pathname === item.url;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <NavLink to={item.url} aria-label={item.title}
          className={cn("relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-colors",
            active ? "bg-foreground text-background" : "bg-card text-foreground hover:bg-popover")}>
          <item.icon className="h-5 w-5" strokeWidth={1.6} />
          {active && <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-background bg-lime" aria-hidden />}
          {!!badge && badge > 0 && (
            <span className="absolute -bottom-1 -right-1 min-w-5 rounded-full bg-lime px-1.5 text-center text-[11px] font-bold leading-5 text-lime-foreground tabular" aria-label={`${badge} te beoordelen`}>{badge}</span>
          )}
        </NavLink>
      </TooltipTrigger>
      <TooltipContent side={side}>{item.title}</TooltipContent>
    </Tooltip>
  );
}

const logout = () => supabase.auth.signOut();

export function AppSidebar() {
  const { isAdmin } = useClient();
  const { data: pending = 0 } = usePendingReviewCount();
  const items = menuItems.filter((i) => !i.admin || isAdmin);
  const settings: Item = { title: "Instellingen", url: "/settings", icon: Settings };
  const badgeFor = (i: Item) => (i.url === "/video-approval" ? pending : undefined);

  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-20 shrink-0 flex-col items-center gap-3 py-5 md:flex">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-foreground">
          <span className="text-lg font-extrabold text-background">H</span>
        </div>
        <nav className="flex flex-1 flex-col items-center gap-2" aria-label="Hoofdmenu">
          {items.map((i) => <RoundLink key={i.url} item={i} badge={badgeFor(i)} />)}
        </nav>
        <RoundLink item={settings} />
        <Tooltip>
          <TooltipTrigger asChild>
            <button onClick={logout} aria-label="Log uit" className="flex h-12 w-12 items-center justify-center rounded-full bg-card hover:bg-popover">
              <LogOut className="h-5 w-5" strokeWidth={1.6} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">Log uit</TooltipContent>
        </Tooltip>
      </aside>

      <nav aria-label="Hoofdmenu" className="fixed inset-x-0 bottom-0 z-50 bg-background/95 px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-2 md:hidden">
        <div className="flex gap-2 overflow-x-auto">
          {[...items, settings].map((i) => <RoundLink key={i.url} item={i} side="top" badge={badgeFor(i)} />)}
          <button onClick={logout} aria-label="Log uit" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-card">
            <LogOut className="h-5 w-5" strokeWidth={1.6} />
          </button>
        </div>
      </nav>
    </>
  );
}
