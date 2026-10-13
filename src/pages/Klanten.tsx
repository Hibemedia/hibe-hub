import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MetricoolService } from "@/integrations/Metricool.service";
import { useClient, ClientRow } from "@/context/ClientContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Building2 } from "lucide-react";
import { toast } from "sonner";

interface Brand { id: number | string; label: string }
interface SyncRun { client_id: string; started_at: string; finished_at: string | null; status: string; days_count: number | null; videos_count: number | null; error: string | null }

export default function Klanten() {
  const { clients, refreshClients } = useClient();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [runs, setRuns] = useState<Record<string, SyncRun>>({});
  const [logos, setLogos] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<Partial<ClientRow> | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const loadRuns = async () => {
    const { data } = await supabase.from("sync_runs").select("client_id,started_at,finished_at,status,days_count,videos_count,error").order("started_at", { ascending: false }).limit(500);
    const map: Record<string, SyncRun> = {};
    for (const r of (data ?? []) as SyncRun[]) if (!map[r.client_id]) map[r.client_id] = r;
    setRuns(map);
  };

  useEffect(() => {
    MetricoolService.getFromMetricool("getBrands").then((b) => setBrands(Array.isArray(b) ? b : [])).catch(() => toast.error("Metricool-merken konden niet geladen worden"));
    loadRuns();
  }, []);

  useEffect(() => {
    const paths = clients.filter((c) => c.logo_url).map((c) => c.logo_url!) ;
    if (!paths.length) return;
    supabase.storage.from("client-logos").createSignedUrls(paths, 3600).then(({ data }) => {
      const m: Record<string, string> = {};
      data?.forEach((d) => { if (d.path && d.signedUrl) m[d.path] = d.signedUrl; });
      setLogos(m);
    });
  }, [clients]);

  const save = async () => {
    if (!editing) return;
    const name = (editing.name ?? "").trim();
    const blog = editing.metricool_blog_id ?? null;
    if (!name) return toast.error("Vul een naam in");
    if (!blog) return toast.error("Kies een Metricool-merk");
    const dup = clients.find((c) => c.metricool_blog_id === blog && c.id !== editing.id);
    if (dup) return toast.error(`Dit Metricool-merk hoort al bij "${dup.name}"`);
    setBusy(true);
    try {
      const payload = { name, metricool_blog_id: blog, tiktok_handle: (editing.tiktok_handle ?? "").replace(/^@/, "").trim() || null };
      let id = editing.id;
      if (id) {
        const { error } = await supabase.from("clients").update(payload).eq("id", id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("clients").insert(payload).select("id").single();
        if (error) throw error;
        id = data.id;
      }
      if (logoFile && id) {
        const path = `${id}/${Date.now()}-${logoFile.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
        const { error: upErr } = await supabase.storage.from("client-logos").upload(path, logoFile, { upsert: true });
        if (upErr) throw upErr;
        await supabase.from("clients").update({ logo_url: path }).eq("id", id);
      }
      if (!editing.id && id) {
        // New client: start history sync from 2025-06-01 automatically.
        supabase.functions.invoke("metricool-sync", { body: { mode: "backfill", clientId: id } })
          .then(() => setTimeout(loadRuns, 3000));
        toast.success("Klant toegevoegd — historie wordt opgehaald");
      } else toast.success("Klant opgeslagen");
      setEditing(null); setLogoFile(null);
      await refreshClients();
    } catch (e: any) {
      toast.error(String(e?.message ?? e).includes("duplicate") ? "Dit Metricool-merk is al gekoppeld aan een klant" : "Opslaan mislukt: " + (e?.message ?? e));
    } finally { setBusy(false); }
  };

  const brandLabel = (id: string | null) => brands.find((b) => String(b.id) === id)?.label ?? id ?? "–";

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2"><Building2 className="h-7 w-7" />Klanten</h1>
        <Button onClick={() => { setEditing({}); setLogoFile(null); }}><Plus className="h-4 w-4 mr-2" />Klant toevoegen</Button>
      </div>
      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Klant</TableHead><TableHead>Metricool-merk</TableHead><TableHead>TikTok</TableHead><TableHead>Laatste sync</TableHead><TableHead className="w-12" />
          </TableRow></TableHeader>
          <TableBody>
            {clients.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nog geen klanten</TableCell></TableRow>}
            {clients.map((c) => {
              const r = runs[c.id];
              return (
                <TableRow key={c.id}>
                  <TableCell><div className="flex items-center gap-3">
                    {c.logo_url && logos[c.logo_url] ? <img src={logos[c.logo_url]} alt="" className="h-8 w-8 rounded object-cover" /> : <div className="h-8 w-8 rounded bg-muted" />}
                    <span className="font-medium">{c.name}</span></div></TableCell>
                  <TableCell>{brandLabel(c.metricool_blog_id)} <span className="text-xs text-muted-foreground">({c.metricool_blog_id})</span></TableCell>
                  <TableCell>{c.tiktok_handle ? `@${c.tiktok_handle}` : "–"}</TableCell>
                  <TableCell>
                    {!r ? <span className="text-muted-foreground text-sm">Nog niet gesynchroniseerd</span> : (
                      <div className="text-sm space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={r.status === "fout" ? "destructive" : r.status === "ok" ? "secondary" : "outline"}>{r.status === "running" ? "bezig" : r.status}</Badge>
                          {new Date(r.finished_at ?? r.started_at).toLocaleString("nl-NL")}
                        </div>
                        {r.status === "ok" && <div className="text-xs text-muted-foreground">{r.days_count} dagen · {r.videos_count} video's</div>}
                        {r.error && <div className="text-xs text-destructive max-w-xs break-words">{r.error}</div>}
                      </div>
                    )}
                  </TableCell>
                  <TableCell><Button variant="ghost" size="icon" aria-label="Bewerken" onClick={() => { setEditing(c); setLogoFile(null); }}><Pencil className="h-4 w-4" /></Button></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent></Card>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing?.id ? "Klant bewerken" : "Klant toevoegen"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label htmlFor="cname">Naam</Label><Input id="cname" value={editing?.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} maxLength={200} /></div>
            <div className="space-y-2"><Label>Metricool-merk</Label>
              <Select value={editing?.metricool_blog_id ?? ""} onValueChange={(v) => setEditing({ ...editing, metricool_blog_id: v })}>
                <SelectTrigger><SelectValue placeholder={brands.length ? "Kies een merk" : "Merken laden…"} /></SelectTrigger>
                <SelectContent>{brands.map((b) => {
                  const taken = clients.find((c) => c.metricool_blog_id === String(b.id) && c.id !== editing?.id);
                  return <SelectItem key={b.id} value={String(b.id)} disabled={!!taken}>{b.label}{taken ? ` (al gekoppeld)` : ""}</SelectItem>;
                })}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label htmlFor="tt">TikTok-handle</Label><Input id="tt" placeholder="bijv. dehollandsetulp" value={editing?.tiktok_handle ?? ""} onChange={(e) => setEditing({ ...editing, tiktok_handle: e.target.value })} maxLength={100} /></div>
            <div className="space-y-2"><Label htmlFor="logo">Logo</Label><Input id="logo" type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)} /></div>
          </div>
          <DialogFooter><Button onClick={save} disabled={busy}>Opslaan</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
