import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RefreshCw, Search } from "lucide-react";

interface ContentSyncLog {
  id: string;
  brand_id: number | null;
  platform: string | null;
  posts_fetched: number | null;
  errors: any | null;
  raw_response: any | null;
  synced_at: string;
}

interface BrandLite { id: number; label: string | null }

export default function SyncLogs() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<ContentSyncLog[]>([]);
  const [brands, setBrands] = useState<BrandLite[]>([]);

  const [platform, setPlatform] = useState<string>("all");
  const [brandId, setBrandId] = useState<string>("all");
  const [query, setQuery] = useState("");

  const loadBrands = async () => {
    const { data, error } = await supabase
      .from("metricool_brands")
      .select("id,label")
      .order("label", { ascending: true });
    if (error) {
      console.error(error);
      toast({ title: "Kon brands niet laden", variant: "destructive" });
      return;
    }
    setBrands((data || []) as any);
  };

  const loadLogs = async () => {
    setLoading(true);
    try {
      let queryBuilder = supabase
        .from("metricool_content_sync_logs")
        .select("id, brand_id, platform, posts_fetched, errors, raw_response, synced_at")
        .order("synced_at", { ascending: false })
        .limit(200);

      if (platform !== "all") queryBuilder = queryBuilder.eq("platform", platform);
      if (brandId !== "all") queryBuilder = queryBuilder.eq("brand_id", Number(brandId));

      const { data, error } = await queryBuilder;
      if (error) throw error;

      const filtered = (data || []).filter((row) => {
        if (!query) return true;
        const q = query.toLowerCase();
        const brand = brands.find((b) => b.id === row.brand_id)?.label || String(row.brand_id || "");
        const errStr = row.errors ? JSON.stringify(row.errors) : "";
        return (
          brand.toLowerCase().includes(q) ||
          (row.platform || "").toLowerCase().includes(q) ||
          errStr.toLowerCase().includes(q)
        );
      });

      setLogs(filtered as any);
    } catch (e: any) {
      console.error(e);
      toast({ title: "Fout bij laden logs", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBrands();
  }, []);

  useEffect(() => {
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platform, brandId, brands.length]);

  const platforms = useMemo(() => [
    { value: "all", label: "Alle platforms" },
    { value: "facebook", label: "Facebook" },
    { value: "instagram", label: "Instagram" },
    { value: "tiktok", label: "TikTok" },
    { value: "linkedin", label: "LinkedIn" },
    { value: "youtube", label: "YouTube" },
  ], []);

  return (
    <main className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sync Logs</h1>
          <p className="text-muted-foreground">Controleer content-sync runs en API responses</p>
        </div>
        <Button onClick={loadLogs} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Herladen
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm text-muted-foreground">Platform</label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {platforms.map(p => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Brand</label>
              <Select value={brandId} onValueChange={setBrandId}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle brands</SelectItem>
                  {brands.map(b => (
                    <SelectItem key={b.id} value={String(b.id)}>{b.label || `Brand ${b.id}`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm text-muted-foreground">Zoeken</label>
              <div className="mt-1 flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Zoek op brand, platform of fout" className="pl-8" />
                </div>
                <Button variant="outline" onClick={loadLogs}>Zoek</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Laatste sync runs</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tijdstip</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead className="text-right">Posts</TableHead>
                <TableHead>Fout</TableHead>
                <TableHead className="text-right">Acties</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((row) => {
                const brandName = brands.find(b => b.id === row.brand_id)?.label || `Brand ${row.brand_id}`;
                const errorMsg = row.errors ? (row.errors.message || JSON.stringify(row.errors).slice(0, 120) + '…') : '';
                return (
                  <TableRow key={row.id}>
                    <TableCell>{new Date(row.synced_at).toLocaleString()}</TableCell>
                    <TableCell>{brandName}</TableCell>
                    <TableCell className="capitalize">{row.platform}</TableCell>
                    <TableCell className="text-right">{row.posts_fetched ?? 0}</TableCell>
                    <TableCell className="max-w-[280px] truncate">{errorMsg}</TableCell>
                    <TableCell className="text-right">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">Bekijk response</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl">
                          <DialogHeader>
                            <DialogTitle>Ruwe API-response</DialogTitle>
                          </DialogHeader>
                          <pre className="max-h-[60vh] overflow-auto text-xs bg-muted p-4 rounded">
{JSON.stringify(row.raw_response ?? { info: "Geen response opgeslagen" }, null, 2)}
                          </pre>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
            {logs.length === 0 && (
              <TableCaption>Geen logs gevonden met de huidige filters</TableCaption>
            )}
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
