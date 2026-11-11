import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Copy, Check } from "lucide-react";
import { setVideoStatus, BoardItem } from "@/hooks/useVideos";
import { whatsappText } from "@/lib/videos";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const portalLink = () => `${window.location.origin}/videos`;
export async function copyText(t: string) { try { await navigator.clipboard.writeText(t); toast.success("Gekopieerd"); } catch { toast.error("Kopiëren lukte niet"); } }

/** "Stuur X naar klant": moves all ready videos of one client, then offers the WhatsApp text. */
export function useSendToClient() {
  const qc = useQueryClient();
  const [done, setDone] = useState<{ name: string; count: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const send = async (name: string, batch: BoardItem[]) => {
    if (!batch.length) return;
    setBusy(true);
    try { for (const i of batch) await setVideoStatus(i.id, "client_review"); setDone({ name, count: batch.length }); }
    catch (e: any) { toast.error(e.message ?? "Versturen mislukt"); }
    setBusy(false); qc.invalidateQueries({ queryKey: ["video-items"] });
  };
  const dialog = <SentDialog done={done} onClose={() => setDone(null)} />;
  return { send, busy, dialog };
}

function SentDialog({ done, onClose }: { done: { name: string; count: number } | null; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  if (!done) return null;
  const text = whatsappText(done.name, done.count, portalLink());
  return (
    <Dialog open onOpenChange={(o) => { if (!o) { onClose(); setCopied(false); } }}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{done.count} video{done.count > 1 ? "'s" : ""} naar {done.name} gestuurd</DialogTitle>
          <DialogDescription>De video's staan nu op Ter controle bij klant.</DialogDescription></DialogHeader>
        <p className="rounded-md bg-muted p-3 text-sm">{text}</p>
        <Button onClick={async () => { await copyText(text); setCopied(true); }}>{copied ? <Check /> : <Copy />}Kopieer link voor WhatsApp</Button>
      </DialogContent>
    </Dialog>
  );
}
