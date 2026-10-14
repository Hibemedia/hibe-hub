import { Link } from "react-router-dom";
import { Settings2 } from "lucide-react";
import { useClient } from "@/context/ClientContext";
import { useHibeOverview, useHibeActions } from "@/hooks/useHibeOverview";
import { useLogoUrls, ClientLogo } from "@/hooks/useLogoUrl";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber } from "@/lib/stats";

export default function HibeKlanten() {
  const { clients } = useClient();
  const { data, isLoading } = useHibeOverview("30d");
  const { data: actions } = useHibeActions(clients.map((c) => c.id));
  const logos = useLogoUrls(clients.map((c) => c.logo_url));

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-4 md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="wordmark">Klanten</h1>
        <Link to="/hibe/klanten/beheer" className="inline-flex h-12 items-center gap-3 rounded-full bg-foreground pl-2 pr-5 text-sm font-medium text-background">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-background text-foreground"><Settings2 className="h-4 w-4" /></span>
          Klanten beheren &amp; sync
        </Link>
      </div>
      {isLoading ? <Skeleton className="h-64 rounded-lg" /> : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {clients.map((c) => {
            const s = data?.summaries.find((x) => x.clientId === c.id);
            const pending = actions?.pending[c.id] ?? 0;
            return (
              <li key={c.id}>
                <Link to={`/hibe/klant/${c.id}`} className="flex h-full flex-col rounded-lg bg-card p-5 transition-colors hover:bg-popover md:p-6">
                  <div className="flex items-center gap-3">
                    <ClientLogo url={c.logo_url ? logos[c.logo_url] : null} name={c.name} size={48} />
                    <div className="min-w-0">
                      <p className="truncate text-xl font-semibold">{c.name}</p>
                      {c.metricool_brand_label && <span className="chip mt-1">{c.metricool_brand_label}</span>}
                    </div>
                  </div>
                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <div><div className="text-3xl font-light tabular">{formatNumber(s?.followers ?? null)}</div><div className="text-xs text-muted-foreground">volgers</div></div>
                    <div><div className="text-3xl font-light tabular">{formatNumber(s?.views ?? null)}</div><div className="text-xs text-muted-foreground">weergaven 30 dagen</div></div>
                  </div>
                  <div className="mt-5">
                    {pending > 0 ? <span className="growth">{pending} te beoordelen</span> : <span className="chip">Niets te beoordelen</span>}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
