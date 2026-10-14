import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UserAuth } from "@/context/AuthContext.jsx";
import { useMySettings } from "@/hooks/useMySettings";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Settings from "@/pages/Settings";

type Place = { name: string; admin1?: string; country?: string; latitude: number; longitude: number };

export default function HibeInstellingen() {
  const { user } = UserAuth();
  const { data: me } = useMySettings();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Place[]>([]);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (me) setQ(me.place); }, [me?.place]); // eslint-disable-line react-hooks/exhaustive-deps

  const search = async () => {
    if (q.trim().length < 2) return;
    setBusy(true);
    const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q.trim())}&count=5&language=nl&format=json`).then((x) => x.json()).catch(() => null);
    setBusy(false);
    setResults(r?.results ?? []);
    if (!r?.results?.length) toast.error("Geen plaats gevonden");
  };
  const choose = async (p: Place) => {
    const { error } = await supabase.from("profiles_settings").upsert({ user_id: user.id, weather_location: p.name, weather_lat: p.latitude, weather_lon: p.longitude, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
    if (error) return toast.error(error.message);
    toast.success(`Weerlocatie: ${p.name}`);
    setResults([]); setQ(p.name);
    qc.invalidateQueries({ queryKey: ["my-settings"] });
  };

  return (
    <div>
      <div className="mx-auto max-w-7xl p-4 pb-0 md:p-8 md:pb-0">
        <section className="rounded-lg bg-card p-5 md:p-7">
          <h2 className="text-xl font-semibold">Weerlocatie</h2>
          <p className="mt-1 text-sm text-muted-foreground">Het weer op het HIBE Dashboard. Nu: {me?.place ?? "Amsterdam"}.</p>
          <form className="mt-4 flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); search(); }}>
            <Label htmlFor="place" className="sr-only">Plaats</Label>
            <Input id="place" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Zoek een plaats" className="max-w-xs" />
            <Button type="submit" disabled={busy}>Zoeken</Button>
          </form>
          {results.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2">
              {results.map((p) => (
                <li key={`${p.latitude},${p.longitude}`}>
                  <button onClick={() => choose(p)} className="chip-filter">{p.name}{p.admin1 ? `, ${p.admin1}` : ""}{p.country ? ` (${p.country})` : ""}</button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      <Settings />
    </div>
  );
}
