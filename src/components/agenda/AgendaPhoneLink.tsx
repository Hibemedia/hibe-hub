import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, Smartphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { toast } from "sonner";

const db = supabase as any;
type Scope = "me" | "team";
type Feed = { token: string; scope: Scope };

/** The address must be unguessable, so it is 24 random bytes. */
function newToken() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function agendaFeedUrl(token: string) {
  // The client object does not always expose its address, so use the same
  // backend address the app itself is configured with.
  const base = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? (supabase as any).url;
  return `${base}/functions/v1/agenda-ics?key=${token}`;
}

const STEPS = [
  "Kopieer het adres hierboven.",
  "Open op je iPhone Instellingen → Agenda → Accounts → Voeg account toe… → Gesubscribeerd agenda.",
  "Plak het adres bij Server en tik Voeg toe.",
  "Open de app Agenda en tik linksonder op Agenda's om HIBE te tonen of te verbergen.",
];

/** Button + dialog that hands a HIBE admin his own calendar address for his phone. */
export function AgendaPhoneLink({ me, isAdmin }: { me: string; isAdmin: boolean }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const field = useRef<HTMLInputElement>(null);

  const { data: feed, isLoading } = useQuery({
    queryKey: ["agenda-feed", me],
    queryFn: async () => {
      const { data, error } = await db.from("agenda_feeds").select("token,scope").eq("user_id", me).maybeSingle();
      if (error) throw error;
      return (data ?? null) as Feed | null;
    },
    enabled: !!me && isAdmin,
  });

  if (!me || !isAdmin) return null;

  const refresh = () => qc.invalidateQueries({ queryKey: ["agenda-feed", me] });

  const create = async () => {
    setBusy(true);
    try {
      const { error } = await db.from("agenda_feeds").insert({ user_id: me, token: newToken(), scope: "me" });
      if (error) throw error;
      refresh();
      toast.success("Je agenda-adres is gemaakt");
    } catch (e: any) {
      toast.error(e?.message ?? "Het adres kan nu niet worden gemaakt");
    } finally {
      setBusy(false);
    }
  };

  const setScope = async (scope: Scope) => {
    if (!feed) return;
    setBusy(true);
    try {
      const { error } = await db.from("agenda_feeds").update({ scope, updated_at: new Date().toISOString() }).eq("user_id", me);
      if (error) throw error;
      refresh();
      toast.success(scope === "team" ? "Je telefoon toont het hele team" : "Je telefoon toont alleen jouw agenda");
    } catch (e: any) {
      toast.error(e?.message ?? "Dat kan nu niet worden opgeslagen");
    } finally {
      setBusy(false);
    }
  };

  const rotate = async () => {
    setBusy(true);
    try {
      const { error } = await db.from("agenda_feeds").update({ token: newToken(), updated_at: new Date().toISOString() }).eq("user_id", me);
      if (error) throw error;
      refresh();
      toast.success("Nieuw adres gemaakt — het oude adres werkt niet meer");
    } catch (e: any) {
      toast.error(e?.message ?? "Het adres kan nu niet worden vernieuwd");
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    if (!feed) return;
    const url = agendaFeedUrl(feed.token);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      toast.success("Adres gekopieerd");
    } catch {
      field.current?.select();
      document.execCommand("copy");
      toast.success("Adres gekopieerd");
    }
  };

  const url = feed ? agendaFeedUrl(feed.token) : "";

  return (
    <>
      <Button variant="outline" size="sm" className="h-8 rounded-md text-xs" onClick={() => setOpen(true)}>
        <Smartphone className="mr-1.5 h-3.5 w-3.5" aria-hidden />
        Koppelen aan je telefoon
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Agenda op je telefoon</DialogTitle>
            <DialogDescription className="text-sm">
              Je telefoon laat de HIBE-agenda meekijken: draaidagen, afspraken, vakanties, taken en montagedagen. Nieuwe items komen er vanzelf bij.
            </DialogDescription>
          </DialogHeader>

          {isLoading && <p className="text-sm text-muted-foreground">Je adres opzoeken…</p>}

          {!isLoading && !feed && (
            <div className="space-y-4">
              <p className="text-sm">
                Je hebt nog geen eigen adres. Eén druk op de knop maakt het aan; daarna plak je het op je telefoon.
              </p>
              <DialogFooter>
                <Button onClick={create} disabled={busy}>{busy ? "Maken…" : "Maak mijn agenda-adres"}</Button>
              </DialogFooter>
            </div>
          )}

          {feed && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="agenda-feed-url">Jouw agenda-adres</Label>
                <div className="flex gap-2">
                  <Input id="agenda-feed-url" ref={field} readOnly value={url} className="min-w-0 font-mono text-xs" onFocus={(e) => e.currentTarget.select()} />
                  <Button variant="outline" size="sm" className="h-9 shrink-0 rounded-md" onClick={copy}>
                    {copied ? <Check className="mr-1 h-3.5 w-3.5" aria-hidden /> : <Copy className="mr-1 h-3.5 w-3.5" aria-hidden />}
                    {copied ? "Gekopieerd" : "Kopieer"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Dit adres is persoonlijk. Iemand dat het heeft, ziet jouw agenda — deel het daarom niet.</p>
              </div>

              <div className="space-y-1.5">
                <Label>Wat staat er op je telefoon?</Label>
                <SegmentedControl
                  label="Wat er op je telefoon staat"
                  value={feed.scope}
                  onChange={(v) => setScope(v as Scope)}
                  options={[
                    { value: "me", label: "Alleen van jou" },
                    { value: "team", label: "Het hele team" },
                  ]}
                />
                <p className="text-xs text-muted-foreground">
                  {feed.scope === "team"
                    ? "Je telefoon toont de agenda van iedereen bij HIBE."
                    : "Je telefoon toont alleen wat voor jou is: jouw draaidagen, afspraken, taken en montages."}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Zet het op je iPhone</Label>
                <ol className="space-y-1.5 text-sm">
                  {STEPS.map((s, i) => (
                    <li key={s} className="flex gap-2">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-tag bg-muted text-xs font-medium tabular">{i + 1}</span>
                      <span className="min-w-0">{s}</span>
                    </li>
                  ))}
                </ol>
                <p className="text-xs text-muted-foreground">Op je Mac: open Kalender → Bestand → Nieuwe agenda-abonnement… en plak hetzelfde adres.</p>
              </div>

              <DialogFooter className="gap-2 sm:justify-between">
                <Button variant="ghost" size="sm" className="rounded-md text-xs" onClick={rotate} disabled={busy}>
                  Nieuw adres maken
                </Button>
                <Button variant="outline" size="sm" className="rounded-md" onClick={() => setOpen(false)}>
                  Dichtdoen
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
