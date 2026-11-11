import { Link, NavLink } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useClient } from "@/context/ClientContext";
import { UserAuth } from "@/context/AuthContext.jsx";
import { useLogoUrls, ClientLogo } from "@/hooks/useLogoUrl";
import { useViewAs } from "@/context/ViewAs";
import { Eye } from "lucide-react";

/** Tabs inside /hibe/klant/:id (HIBE management of one client). */
const HIBE_CLIENT_TABS = [
  { title: "Overzicht", url: "/" }, { title: "Performance", url: "/performance" }, { title: "Video's", url: "/videos" },
  { title: "Planning", url: "/planning" }, { title: "Contentmomenten", url: "/content-moments" }, { title: "Branding & Archief", url: "/branding" }, { title: "Medailles", url: "/medals" },
];
import { useHeaderSlots } from "@/components/PageHeader";
import { GlobalSearch } from "@/components/GlobalSearch";
import { NotificationBell } from "@/components/NotificationBell";
import { cn } from "@/lib/utils";

function Avatar() {
  const { user, session } = UserAuth() as any;
  const u = user ?? session?.user;
  const label: string = u?.full_name || u?.user_metadata?.full_name || u?.email || "";
  const initials = label.split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((s: string) => s[0]?.toUpperCase()).join("") || "?";
  return <span title={label} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-semibold text-background">{initials}</span>;
}

/** 56px top bar on every page: title left, search centre, main action + avatar right. */
export function FrameTopBar({ variant }: { variant: "client" | "hibe" }) {
  const { setTitleEl, setActionEl } = useHeaderSlots();
  const viewAs = useViewAs();
  return (
    <header className={cn("sticky z-40 flex h-14", viewAs ? "top-11" : "top-0", " items-center gap-3 border-b border-border bg-background px-4 md:px-6")}>
      <div ref={setTitleEl} className="min-w-0 flex-1" />
      <div className="flex min-w-0 flex-none justify-center md:flex-1">{!viewAs && <GlobalSearch variant={variant} />}</div>
      <div className="flex flex-none items-center justify-end gap-3 md:flex-1">
        <div ref={setActionEl} className="flex items-center" />
        {variant === "hibe" && <NotificationBell />}
        {!viewAs && <Avatar />}
      </div>
    </header>
  );
}

/** Inside /hibe/klant/:id: back link + client name + sub-navigation, as one row under the top bar. */
export function ClientScopeBar({ id }: { id: string }) {
  const { clients } = useClient();
  const c = clients.find((x) => x.id === id);
  const logos = useLogoUrls([c?.logo_url]);
  const base = `/hibe/klant/${id}`;
  return (
    <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-4 pt-4 md:px-8">
      <Link to="/hibe/klanten" className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-popover px-2.5 text-sm font-medium">
        <ArrowLeft className="h-4 w-4" /><span className="sr-only sm:not-sr-only">Klanten</span>
        {c && <><span className="opacity-40">/</span><ClientLogo url={c.logo_url ? logos[c.logo_url] : null} name={c.name} size={20} /><span className="max-w-40 truncate font-semibold">{c.name}</span></>}
      </Link>
      <nav className="-mx-4 flex w-full gap-2 overflow-x-auto px-4 sm:mx-0 sm:w-auto sm:px-0" aria-label="Klantpagina's">
        {HIBE_CLIENT_TABS.map((m) => (
          <NavLink key={m.url} end to={base + (m.url === "/" ? "" : m.url)}
            className={({ isActive }) => cn("chip-filter shrink-0", isActive && "border-foreground bg-foreground text-background hover:bg-foreground")}>{m.title}</NavLink>
        ))}
      </nav>
      <Link to={`/hibe/als/${id}`} className="ml-auto inline-flex h-9 shrink-0 items-center gap-2 rounded-md bg-foreground px-3 text-sm font-semibold text-background"><Eye className="h-4 w-4" />Bekijk als klant</Link>
    </div>
  );
}
