import { Link, NavLink } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useClient } from "@/context/ClientContext";
import { useLogoUrls, ClientLogo } from "@/hooks/useLogoUrl";
import { CLIENT_MENU } from "@/components/AppSidebar";
import { cn } from "@/lib/utils";

/** Client environment: own logo + name, no switcher. */
export function ClientTopBar() {
  const { client } = useClient();
  const logos = useLogoUrls([client?.logo_url]);
  return (
    <header className="sticky top-0 z-40 bg-background/95 px-4 pt-4 md:px-8 md:pt-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {client && <ClientLogo url={client.logo_url ? logos[client.logo_url] : null} name={client.name} />}
          <div className="min-w-0">
            <p className="truncate text-base font-bold leading-tight">{client?.name ?? "Klantportaal"}</p>
            <p className="text-xs text-muted-foreground">HIBE Klantportaal</p>
          </div>
        </div>
      </div>
    </header>
  );
}

export function HibeTopBar() {
  return (
    <header className="sticky top-0 z-40 bg-background/95 px-4 pt-4 md:px-8 md:pt-5">
      <div className="flex items-center gap-2">
        <span className="text-base font-extrabold tracking-tight">HIBE</span>
        <span className="text-sm text-muted-foreground">Studio</span>
      </div>
    </header>
  );
}

/** Inside /hibe/klant/:id: back capsule + client name + sub-navigation. */
export function ClientScopeBar({ id }: { id: string }) {
  const { clients } = useClient();
  const c = clients.find((x) => x.id === id);
  const logos = useLogoUrls([c?.logo_url]);
  const base = `/hibe/klant/${id}`;
  return (
    <div className="mx-auto max-w-7xl space-y-3 px-4 pt-4 md:px-8">
      <Link to="/hibe/klanten" className="capsule-dark h-11 max-w-full pl-1.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-background text-foreground"><ArrowLeft className="h-4 w-4" /></span>
        <span>Alle klanten</span>
        {c && <><span className="opacity-40">/</span><ClientLogo url={c.logo_url ? logos[c.logo_url] : null} name={c.name} size={24} /><span className="truncate font-semibold">{c.name}</span></>}
      </Link>
      <nav className="-mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0" aria-label="Klantpagina's">
        {CLIENT_MENU.map((m) => (
          <NavLink key={m.url} end to={base + (m.url === "/" ? "" : m.url)}
            className={({ isActive }) => cn("chip-filter shrink-0", isActive && "border-transparent bg-popover font-medium")}>{m.title}</NavLink>
        ))}
      </nav>
    </div>
  );
}
