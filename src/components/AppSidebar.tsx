import { BarChart3, Calendar, CheckCircle, Award, Archive, Settings, LogOut, Home, Users, Building2, LayoutGrid, type LucideIcon } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { usePendingReviewCount } from "@/hooks/useReviews";

type Item = { title: string; url: string; icon: LucideIcon; prefix?: string };
export const CLIENT_MENU: Item[] = [
  { title: "Overzicht", url: "/", icon: Home },
  { title: "Performance", url: "/performance", icon: BarChart3 },
  { title: "Video Goedkeuring", url: "/video-approval", icon: CheckCircle },
  { title: "Contentmomenten", url: "/content-moments", icon: Calendar },
  { title: "Branding & Archief", url: "/branding", icon: Archive },
  { title: "Medailles", url: "/medals", icon: Award },
];
const HIBE_MENU: Item[] = [
  { title: "HIBE Dashboard", url: "/hibe", icon: LayoutGrid },
  { title: "Klanten", url: "/hibe/klanten", icon: Building2, prefix: "/hibe/klant" },
  { title: "Goedkeuringen", url: "/hibe/goedkeuringen", icon: CheckCircle },
  { title: "Contentmomenten", url: "/hibe/contentmomenten", icon: Calendar },
  { title: "Gebruikers", url: "/hibe/gebruikers", icon: Users },
];

function RoundLink({ item, side = "right", badge }: { item: Item; side?: "right" | "top"; badge?: number }) {
  const path = useLocation().pathname;
  const active = path === item.url || (!!item.prefix && path.startsWith(item.prefix));
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <NavLink to={item.url} end aria-label={item.title}
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

function LogoutBtn({ side = "right" }: { side?: "right" | "top" }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button onClick={logout} aria-label="Log uit" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-card hover:bg-popover">
          <LogOut className="h-5 w-5" strokeWidth={1.6} />
        </button>
      </TooltipTrigger>
      <TooltipContent side={side}>Log uit</TooltipContent>
    </Tooltip>
  );
}

export function AppSidebar({ variant }: { variant: "client" | "hibe" }) {
  const { data: pending = 0 } = usePendingReviewCount();
  const items = variant === "hibe" ? HIBE_MENU : CLIENT_MENU;
  const settings: Item = variant === "hibe" ? { title: "Instellingen", url: "/hibe/instellingen", icon: Settings } : { title: "Instellingen", url: "/settings", icon: Settings };
  const badgeFor = (i: Item) => (variant === "client" && i.url === "/video-approval" ? pending : undefined);

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
        <LogoutBtn />
      </aside>

      <nav aria-label="Hoofdmenu" className="fixed inset-x-0 bottom-0 z-50 bg-background/95 px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-2 md:hidden">
        <div className="flex gap-2 overflow-x-auto">
          {[...items, settings].map((i) => <RoundLink key={i.url} item={i} side="top" badge={badgeFor(i)} />)}
          <LogoutBtn side="top" />
        </div>
      </nav>
    </>
  );
}
