import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { clientGroupName } from "@/lib/workflow";
import { Tag } from "@/components/ui/tag";
import { PageHeader, PrimaryAction } from "@/components/PageHeader";
import { Link, useNavigate } from "react-router-dom";
import { Settings2, Eye } from "lucide-react";
import { useClient } from "@/context/ClientContext";
import { useHibeOverview, useHibeActions } from "@/hooks/useHibeOverview";
import { useLogoUrls, ClientLogo } from "@/hooks/useLogoUrl";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber } from "@/lib/stats";

export default function HibeKlanten() {
  const { allClients } = useClient();
  const [q, setQ] = useState("");
  const [state, setState] = useState("active");
  const [sort, setSort] = useState("az");
  const clients = allClients.filter(c => state === "all" || (state === "active" ? !c.archived_at : !!c.archived_at));
  const groups = useMemo(() => {
    const map = new Map<string, typeof clients>();
    for (const c of clients) { const key = clientGroupName(c.name); map.set(key, [...(map.get(key) ?? []), c]); }
    return [...map.entries()].filter(([name, cs]) => (name + cs.map(c => c.name).join(" ")).toLowerCase().includes(q.toLowerCase())).sort((a,b) => a[0].localeCompare(b[0], "nl") * (sort === "za" ? -1 : 1));
  }, [allClients, state, q, sort]);
  const { data, isLoading } = useHibeOverview("30d");
  const { data: actions } = useHibeActions(clients.map((c) => c.id));
  const logos = useLogoUrls(clients.map((c) => c.logo_url));

  const nav = useNavigate();
  return (
    <div className="mx-auto max-w-7xl space-y-5 p-4 md:p-8">
      <PageHeader title="Klanten" action={<PrimaryAction icon={Settings2} to="/hibe/klanten/beheer">Klanten beheren &amp; sync</PrimaryAction>} />
      <div className="flex flex-wrap gap-2"><Input aria-label="Zoek klant" placeholder="Zoek klant…" value={q} onChange={e => setQ(e.target.value)} className="w-56" />
        <Select value={state} onValueChange={setState}><SelectTrigger aria-label="Klantstatus" className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Actief</SelectItem><SelectItem value="inactive">Inactief</SelectItem><SelectItem value="all">Alle klanten</SelectItem></SelectContent></Select>
        <Select value={sort} onValueChange={setSort}><SelectTrigger aria-label="Sorteer klanten" className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="az">Naam A–Z</SelectItem><SelectItem value="za">Naam Z–A</SelectItem></SelectContent></Select>
      </div>
      {!groups.length && <div className="space-y-3 py-6 text-sm text-muted-foreground"><p>Geen klanten voor deze selectie.</p><Button variant="outline" onClick={() => { setQ(""); setState("all"); }}>Wis filters</Button></div>}
      {isLoading ? <Skeleton className="h-64 rounded-lg" /> : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {groups.map(([group, channels]) => {
            const c = channels[0];
            if (!c) return null;
            const summaries = channels.filter(c => !c.video_only).flatMap(c => data?.summaries.filter(s => s.clientId === c.id) ?? []);
            const pending = channels.reduce((n,c) => n + (actions?.pending[c.id] ?? 0), 0);
            return <li key={group} className="min-w-0 rounded-lg border border-border bg-card p-5">
              <Button asChild variant="ghost" className="h-auto w-full justify-start p-0 text-left"><Link to={`/hibe/klant/${c.id}`}><ClientLogo url={c.logo_url ? logos[c.logo_url] : null} name={group} size={40} /><span className="min-w-0 whitespace-normal text-xl font-semibold">{group}</span></Link></Button>
              {summaries.length > 0 ? <div className="my-5 grid grid-cols-2 gap-3"><div className="min-w-0"><div className="text-3xl font-light tabular">{formatNumber(summaries.reduce((n,s) => n + (s.followers ?? 0), 0))}</div><div className="text-xs text-muted-foreground">volgers</div></div><div className="min-w-0"><div className="text-3xl font-light tabular">{formatNumber(summaries.reduce((n,s) => n + s.views, 0))}</div><div className="text-xs text-muted-foreground">weergaven 30 dagen</div></div></div> : <p className="my-5 text-sm text-muted-foreground">{channels.every(c => c.video_only) ? "Alleen video's" : "Nog geen cijfers"}</p>}
              <div className="space-y-2 border-t border-border pt-3">{channels.map(channel => <div key={channel.id} className="flex min-w-0 flex-wrap items-center gap-2"><Button asChild variant="ghost" size="sm" className="min-w-0 flex-1 justify-start whitespace-normal text-left"><Link to={`/hibe/klant/${channel.id}`}>{channels.length > 1 ? channel.name === group ? "Hoofdkanaal" : channel.name : "Open klant"}</Link></Button>{channel.archived_at && <Tag>Inactief</Tag>}{!channel.metricool_blog_id && <Button size="sm" variant="outline" onClick={() => nav(`/hibe/klanten/beheer?bewerken=${channel.id}`)}>Koppel kanaal</Button>}<Button size="sm" variant="outline" aria-label={`Bekijk ${channel.name} als klant`} onClick={() => nav(`/hibe/als/${channel.id}`)}><Eye className="h-3.5 w-3.5" /></Button></div>)}</div>
              <div className="mt-3"><Tag variant={pending ? "warning" : "neutral"}>{pending ? `${pending} te beoordelen` : "Niets te beoordelen"}</Tag></div>
            </li>;
          })}
        </ul>
      )}
    </div>
  );
}
