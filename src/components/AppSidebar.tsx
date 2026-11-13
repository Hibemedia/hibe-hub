import hibeLogoUrl from "@/assets/hibe-logo.png";
const hibeLogo = { url: hibeLogoUrl };
import { useState } from "react";
import { BarChart3, Calendar, Award, Archive, Settings, LogOut, Home, Users, Building2, LayoutGrid, ListChecks, Film, MoreHorizontal, Scissors, MessagesSquare, CalendarDays, ListTodo, PanelLeftClose, PanelLeftOpen, type LucideIcon } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { STEPS, STEP_SLUG, VIDEO_STATUS_LABEL, VideoStatus } from "@/lib/videos";
import { useQuery } from "@tanstack/react-query";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { usePendingReviewCount } from "@/hooks/useReviews";
import { useClient } from "@/context/ClientContext";
import { useLogoUrls, ClientLogo } from "@/hooks/useLogoUrl";
import { useUnread } from "@/hooks/useChat";
import { useViewAs, ReadOnlyTip } from "@/context/ViewAs";
import { useBase } from "@/lib/paths";
import { User } from "lucide-react";

type Item = { title: string; url: string; icon: LucideIcon; prefix?: string };
export const CLIENT_MENU: Item[] = [
  { title: "Home", url: "/", icon: Home },
  { title: "Video's", url: "/videos", icon: Film, prefix: "/videos/" },
  { title: "Planning", url: "/planning", icon: Calendar },
  { title: "Resultaten", url: "/performance", icon: BarChart3 },
  { title: "Medailles", url: "/medals", icon: Award },
  { title: "Contentmomenten", url: "/content-moments", icon: CalendarDays },
  { title: "Branding & Archief", url: "/branding", icon: Archive },
];
/** Klanten waarvoor HIBE niet post: alleen video's goedkeuren/downloaden, geen cijfers. */
export const VIDEO_ONLY_URLS = ["/videos", "/content-moments", "/branding"];
const HIBE_MENU: Item[] = [
  { title: "Dashboard", url: "/hibe", icon: LayoutGrid },
  { title: "Media Management", url: "/hibe/videos", icon: Film, prefix: "/hibe/videos" },
  { title: "Edits", url: "/hibe/edits", icon: Scissors },
  { title: "Socials-checklist", url: "/hibe/socials", icon: ListChecks },
  { title: "Agenda", url: "/hibe/agenda", icon: CalendarDays },
  { title: "Taken", url: "/hibe/taken", icon: ListTodo },
  { title: "Contentmomenten", url: "/hibe/contentmomenten", icon: Calendar },
  { title: "Klanten", url: "/hibe/klanten", icon: Building2, prefix: "/hibe/klant" },
  { title: "Chat", url: "/hibe/chat", icon: MessagesSquare },
  { title: "Team", url: "/hibe/gebruikers", icon: Users },
];
const MEDIA_OPEN_KEY = "hibe.sidebar.media";
export const MEDIA_SUB: { title: string; url: string; status?: VideoStatus | "trash" }[] = [
  { title: "Overzicht", url: "/hibe/videos" },
  { title: "Productieboard", url: "/hibe/pipeline" },
  ...STEPS.map((s) => ({ title: VIDEO_STATUS_LABEL[s], url: `/hibe/videos/stap/${STEP_SLUG[s]}`, status: s as VideoStatus })),
  { title: "Archief", url: "/hibe/videos/stap/archief", status: "archived" as VideoStatus },
  { title: "Prullenbak", url: "/hibe/videos/stap/prullenbak", status: "trash" as const },
];
/** Counts per step for the Media Management submenu. */
export function useMediaCounts(enabled: boolean) {
  return useQuery({
    queryKey: ["video-items", "media-counts"],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase.from("video_items" as any).select("status,archived_at");
      if (error) throw error;
      const c: Record<string, number> = {};
      for (const r of (data ?? []) as any[]) { const k = r.archived_at ? "trash" : r.status; c[k] = (c[k] ?? 0) + 1; }
      return c;
    },
  });
}

function MediaGroup({ item, collapsed }: { item: Item; collapsed: boolean }) {
  const path = useLocation().pathname;
  const { data: counts = {} } = useMediaCounts(true);
  const active = path.startsWith("/hibe/videos") || path.startsWith("/hibe/pipeline");
  const [open, setOpen] = useState(() => localStorage.getItem(MEDIA_OPEN_KEY) !== "0");
  const toggle = () => setOpen((o) => { localStorage.setItem(MEDIA_OPEN_KEY, o ? "0" : "1"); return !o; });
  const n = (s?: string) => (s ? counts[s] : undefined);
  if (collapsed) return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onPointerEnter={(e) => (e.currentTarget as HTMLElement).click()}>
        <button aria-label={item.title} className={cn("relative flex h-10 items-center justify-center rounded-md px-3", active ? "bg-foreground text-background" : "hover:bg-muted")}><item.icon className="h-[18px] w-[18px]" strokeWidth={1.8} /></button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" align="start" className="w-56">
        {MEDIA_SUB.map((s) => <DropdownMenuItem key={s.url} asChild><NavLink to={s.url} end className="flex justify-between">{s.title}<span className="tabular text-muted-foreground">{n(s.status) || ""}</span></NavLink></DropdownMenuItem>)}
      </DropdownMenuContent>
    </DropdownMenu>
  );
  return (
    <div>
      <div className={cn("flex h-10 items-center rounded-md text-sm font-medium", active && path === "/hibe/videos" ? "" : "")}>
        <NavLink to={item.url} end className={cn("flex h-10 min-w-0 flex-1 items-center gap-3 rounded-md px-3 transition-colors", active ? "font-semibold" : "hover:bg-muted")}>
          <item.icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.8} /><span className="truncate">{item.title}</span>
        </NavLink>
        <button onClick={toggle} aria-label={open ? "Stappen inklappen" : "Stappen uitklappen"} aria-expanded={open} className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"><ChevronDown className={cn("h-4 w-4 transition-transform", !open && "-rotate-90")} /></button>
      </div>
      {open && (
        <div className="ml-4 mt-0.5 flex flex-col gap-0.5 border-l border-border pl-2">
          {MEDIA_SUB.map((s) => (
            <NavLink key={s.url} to={s.url} end className={({ isActive }) => cn("flex h-8 items-center gap-2 rounded-md px-2 text-[13px]", isActive ? "bg-foreground text-background" : "text-foreground hover:bg-muted")}>
              <span className="min-w-0 flex-1 truncate">{s.title}</span>{!!n(s.status) && <span className="text-[11px] tabular opacity-70">{n(s.status)}</span>}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

const COLLAPSE_KEY = "hibe.sidebar.collapsed";

/** HIBE: videos waiting for an internal check. */
function useHibeWaitingCount(enabled: boolean) {
  return useQuery({
    queryKey: ["video-items", "hibe-waiting-count"],
    enabled,
    queryFn: async () => {
      const { count, error } = await supabase.from("video_items" as any).select("id", { count: "exact", head: true }).eq("status", "internal_review");
      if (error) throw error;
      return count ?? 0;
    },
  });
}

function useActive(item: Item) {
  const path = useLocation().pathname;
  return path === item.url || (!!item.prefix && path.startsWith(item.prefix));
}

function Badge({ n }: { n?: number }) {
  if (!n) return null;
  return <span className="ml-auto min-w-5 rounded-full bg-lime px-1.5 text-center text-[11px] font-bold leading-5 text-lime-foreground tabular" aria-label={`${n} wachtend`}>{n}</span>;
}

function SideLink({ item, collapsed, badge }: { item: Item; collapsed: boolean; badge?: number }) {
  const active = useActive(item);
  const link = (
    <NavLink to={item.url} end aria-label={collapsed ? item.title : undefined}
      className={cn("relative flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors",
        active ? "bg-foreground text-background" : "text-foreground hover:bg-muted")}>
      <item.icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.8} />
      {!collapsed && <span className="truncate">{item.title}</span>}
      {!collapsed ? <Badge n={badge} /> : !!badge && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-lime" aria-label={`${badge} wachtend`} />}
    </NavLink>
  );
  if (!collapsed) return link;
  return <Tooltip><TooltipTrigger asChild>{link}</TooltipTrigger><TooltipContent side="right">{item.title}{badge ? ` (${badge})` : ""}</TooltipContent></Tooltip>;
}

const logout = () => supabase.auth.signOut();

function LogoutLink({ collapsed }: { collapsed: boolean }) {
  const btn = (
    <button onClick={logout} aria-label={collapsed ? "Uitloggen" : undefined} className="flex h-10 w-full items-center gap-3 rounded-md px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted">
      <LogOut className="h-[18px] w-[18px] shrink-0" strokeWidth={1.8} />{!collapsed && "Uitloggen"}
    </button>
  );
  if (!collapsed) return btn;
  return <Tooltip><TooltipTrigger asChild>{btn}</TooltipTrigger><TooltipContent side="right">Uitloggen</TooltipContent></Tooltip>;
}

function Brand({ variant, collapsed }: { variant: "client" | "hibe"; collapsed: boolean }) {
  const { client } = useClient();
  const logos = useLogoUrls([variant === "client" ? client?.logo_url : null]);
  if (variant === "client" && client) {
    return (
      <div className="flex min-w-0 items-center gap-2">
        <ClientLogo url={client.logo_url ? logos[client.logo_url] : null} name={client.name} size={32} />
        {!collapsed && <div className="min-w-0"><p className="truncate text-sm font-semibold leading-tight">{client.name}</p><p className="text-xs text-muted-foreground">HIBE Klantportaal</p></div>}
      </div>
    );
  }
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      {collapsed
        ? <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-foreground"><img src={hibeLogo.url} alt="HIBE" className="w-6 dark:invert" /></span>
        : <><img src={hibeLogo.url} alt="HIBE" className="h-6 w-auto invert dark:invert-0" /><span className="text-base font-medium text-muted-foreground">Hub</span></>}
    </div>
  );
}

export function AppSidebar({ variant }: { variant: "client" | "hibe" }) {
  const { data: clientPending = 0 } = usePendingReviewCount();
  const { data: hibeWaiting = 0 } = useHibeWaitingCount(variant === "hibe");
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSE_KEY) === "1");
  const [more, setMore] = useState(false);
  const toggle = () => setCollapsed((c) => { localStorage.setItem(COLLAPSE_KEY, c ? "0" : "1"); return !c; });
  const viewAs = useViewAs();
  const base = useBase();
  const { client } = useClient();
  const clientMenu = client?.video_only ? CLIENT_MENU.filter((i) => VIDEO_ONLY_URLS.includes(i.url)) : CLIENT_MENU;
  const items = variant === "hibe" ? HIBE_MENU : clientMenu.map((i) => ({ ...i, url: i.url === "/" ? base || "/" : base + i.url, prefix: i.prefix ? base + i.prefix : undefined }));
  const settings: Item = variant === "hibe" ? { title: "Instellingen", url: "/hibe/instellingen", icon: Settings } : { title: "Mijn account", url: "/settings", icon: User };
  const { data: chatUnread = {} } = useUnread(variant === "hibe");
  const chatCount = Object.values(chatUnread).reduce((a, b) => a + b, 0);
  const badgeFor = (i: Item) => i.icon === MessagesSquare ? chatCount : (i.icon === Film ? (variant === "hibe" ? hibeWaiting : clientPending) : undefined);
  const primary = items.slice(0, 5);
  const rest = [...items.slice(5), settings];
  const accountLink = viewAs
    ? <ReadOnlyTip className="block"><span className={cn("flex h-10 cursor-not-allowed items-center gap-3 rounded-md px-3 text-sm font-medium opacity-50")}><User className="h-[18px] w-[18px]" strokeWidth={1.8} />{!collapsed && "Mijn account"}</span></ReadOnlyTip>
    : <SideLink item={settings} collapsed={collapsed} />;

  return (
    <>
      <aside className={cn("sticky hidden shrink-0", viewAs ? "top-11 h-[calc(100vh-2.75rem)]" : "top-0 h-screen", " flex-col border-r border-border bg-popover transition-[width] duration-200 md:flex", collapsed ? "w-16" : "w-[220px]")}>
        <div className={cn("flex h-14 items-center border-b border-border", collapsed ? "justify-center px-2" : "justify-between gap-2 px-3")}>
          {!collapsed && <Brand variant={variant} collapsed={false} />}
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={toggle} aria-label={collapsed ? "Menu uitklappen" : "Menu inklappen"} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
                {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">{collapsed ? "Uitklappen" : "Inklappen"}</TooltipContent>
          </Tooltip>
        </div>
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-2" aria-label="Hoofdmenu">
          {items.map((i) => variant === "hibe" && i.icon === Film ? <MediaGroup key={i.url} item={i} collapsed={collapsed} /> : <SideLink key={i.url} item={i} collapsed={collapsed} badge={badgeFor(i)} />)}
        </nav>
        <div className="flex flex-col gap-1 border-t border-border p-2">
          {accountLink}
          {!viewAs && <LogoutLink collapsed={collapsed} />}
        </div>
      </aside>

      <nav aria-label="Hoofdmenu" className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-popover pb-[env(safe-area-inset-bottom)] md:hidden">
        <div className="grid grid-cols-6">
          {primary.map((i) => <BottomLink key={i.url} item={i} badge={badgeFor(i)} />)}
          <button onClick={() => setMore(true)} className="flex h-16 min-w-0 flex-col items-center justify-center gap-1 px-1 text-[11px] font-medium text-muted-foreground">
            <MoreHorizontal className="h-5 w-5" /><span className="max-w-full truncate">Meer</span>
          </button>
        </div>
      </nav>
      <Sheet open={more} onOpenChange={setMore}>
        <SheetContent side="bottom" className="rounded-t-lg">
          <SheetHeader><SheetTitle className="text-left text-base">Meer</SheetTitle></SheetHeader>
          <div className="mt-3 flex flex-col gap-1" onClick={() => setMore(false)}>
            {variant === "client"
              ? <>{items.slice(5).map((i) => <SideLink key={i.url} item={i} collapsed={false} badge={badgeFor(i)} />)}{accountLink}</>
              : rest.map((i) => <SideLink key={i.url} item={i} collapsed={false} badge={badgeFor(i)} />)}
            {!viewAs && <LogoutLink collapsed={false} />}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

function BottomLink({ item, badge }: { item: Item; badge?: number }) {
  const active = useActive(item);
  const short = item.title.replace("-checklist", "").replace(" & Archief", "").replace("Contentmomenten", "Momenten").replace("Media Management", "Media");
  return (
    <NavLink to={item.url} end className={cn("relative flex h-16 min-w-0 flex-col items-center justify-center gap-1 px-1 text-[11px] font-medium", active ? "text-foreground" : "text-muted-foreground")}>
      <span className={cn("flex h-7 w-11 items-center justify-center rounded-md", active && "bg-foreground text-background")}><item.icon className="h-[18px] w-[18px]" strokeWidth={1.8} /></span>
      <span className="max-w-full truncate">{short}</span>
      {!!badge && <span className="absolute right-[calc(50%-24px)] top-2 min-w-4 rounded-full bg-lime px-1 text-center text-[10px] font-bold leading-4 text-lime-foreground tabular">{badge}</span>}
    </NavLink>
  );
}
