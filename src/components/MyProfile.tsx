import { useEffect, useRef, useState } from "react";
import Cropper, { Area } from "react-easy-crop";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ImagePlus, UserCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { UserAuth } from "@/context/AuthContext.jsx";
import { useClient } from "@/context/ClientContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { UserAvatar } from "@/components/UserAvatar";
import { avatarFileError } from "@/lib/avatar";
import { toast } from "sonner";

const db = supabase as any;

/** Crop to a 256×256 PNG. */
async function cropTo256(src: string, area: Area): Promise<Blob> {
  const img = new Image(); img.src = src; await img.decode();
  const c = document.createElement("canvas"); c.width = 256; c.height = 256;
  c.getContext("2d")!.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, 256, 256);
  return new Promise((res) => c.toBlob((b) => res(b!), "image/png"));
}

export function MyProfile() {
  const { user } = UserAuth();
  const { isAdmin } = useClient();
  const qc = useQueryClient();
  const input = useRef<HTMLInputElement>(null);
  const [f, setF] = useState({ first_name: "", last_name: "", job_title: "" });
  const [avatar, setAvatar] = useState<string | null>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    db.from("users").select("first_name,last_name,job_title,full_name,avatar_url").eq("id", user.id).maybeSingle().then(({ data }: any) => {
      if (!data) return;
      const [fn, ...ln] = (data.full_name ?? "").split(" ");
      setF({ first_name: data.first_name ?? fn ?? "", last_name: data.last_name ?? ln.join(" "), job_title: data.job_title ?? "" });
      setAvatar(data.avatar_url);
    });
  }, [user?.id]);

  const pick = (file?: File) => {
    if (!file) return;
    const err = avatarFileError(file);
    if (err) return toast.error(err);
    setSrc(URL.createObjectURL(file)); setZoom(1); setCrop({ x: 0, y: 0 });
  };
  const refresh = () => { qc.invalidateQueries({ queryKey: ["visible-profiles"] }); qc.invalidateQueries({ queryKey: ["hibe-team"] }); qc.invalidateQueries({ queryKey: ["chat-team"] }); qc.invalidateQueries({ queryKey: ["moment-crew"] }); };

  const save = async () => {
    if (!user?.id) return;
    setBusy(true);
    let avatar_url = avatar;
    if (src && area) {
      const blob = await cropTo256(src, area);
      const path = `${user.id}/avatar-${Date.now()}.png`;
      const { error } = await supabase.storage.from("avatars").upload(path, blob, { contentType: "image/png" });
      if (error) { setBusy(false); return toast.error("Uploaden mislukt: " + error.message); }
      if (avatar?.startsWith("storage:avatars/")) supabase.storage.from("avatars").remove([avatar.slice(16)]);
      avatar_url = `storage:avatars/${path}`;
    }
    const full_name = `${f.first_name.trim()} ${f.last_name.trim()}`.trim() || null;
    const { error } = await db.from("users").update({ first_name: f.first_name.trim() || null, last_name: f.last_name.trim() || null, job_title: f.job_title.trim() || null, full_name, avatar_url }).eq("id", user.id);
    setBusy(false);
    if (error) return toast.error("Opslaan mislukt: " + error.message);
    setAvatar(avatar_url); setSrc(null); refresh();
    toast.success("Je profiel is opgeslagen");
  };
  const remove = async () => {
    if (!user?.id) return;
    if (src) { setSrc(null); return; }
    const { error } = await db.from("users").update({ avatar_url: null }).eq("id", user.id);
    if (error) return toast.error(error.message);
    if (avatar?.startsWith("storage:avatars/")) supabase.storage.from("avatars").remove([avatar.slice(16)]);
    setAvatar(null); refresh(); toast.success("Foto verwijderd");
  };

  const name = `${f.first_name} ${f.last_name}`.trim() || user?.email || "?";
  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><UserCircle className="h-5 w-5" />Mijn profiel</CardTitle></CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-[260px_1fr]">
        <div className="space-y-3">
          {src ? (
            <>
              <div className="relative h-56 w-full overflow-hidden rounded-lg bg-muted">
                <Cropper image={src} crop={crop} zoom={zoom} aspect={1} cropShape="round" showGrid={false} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={(_, px) => setArea(px)} />
              </div>
              <Slider aria-label="Zoom" min={1} max={3} step={0.05} value={[zoom]} onValueChange={(v) => setZoom(v[0])} />
            </>
          ) : (
            <button type="button" onClick={() => input.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
              onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files[0]); }}
              className={`flex w-full flex-col items-center gap-3 rounded-lg border border-dashed p-5 text-sm text-muted-foreground transition-colors ${drag ? "border-foreground bg-muted" : "border-border hover:bg-muted"}`}>
              <UserAvatar userId={user?.id} name={name} url={avatar} size={112} />
              <span className="flex items-center gap-1.5"><ImagePlus className="h-4 w-4" />Klik of sleep een foto (JPG/PNG, max 5 MB)</span>
            </button>
          )}
          <input ref={input} type="file" accept="image/jpeg,image/png" className="hidden" onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={save} disabled={busy}>Opslaan</Button>
            <Button size="sm" variant="outline" onClick={() => input.current?.click()}>Andere foto</Button>
            <Button size="sm" variant="ghost" onClick={remove} disabled={!src && !avatar}>Verwijderen</Button>
          </div>
          {isAdmin && (
            <p role="note" className="flex gap-2 rounded-lg bg-warning/15 p-3 text-sm font-medium text-foreground">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
              Let op: klanten zien deze foto ook, onder andere bij draaidagen en bij opmerkingen op video's.
            </p>
          )}
        </div>
        <div className="grid content-start gap-4 sm:grid-cols-2">
          <div className="space-y-2"><Label htmlFor="pf-fn">Voornaam</Label><Input id="pf-fn" value={f.first_name} maxLength={80} onChange={(e) => setF({ ...f, first_name: e.target.value })} /></div>
          <div className="space-y-2"><Label htmlFor="pf-ln">Achternaam</Label><Input id="pf-ln" value={f.last_name} maxLength={80} onChange={(e) => setF({ ...f, last_name: e.target.value })} /></div>
          <div className="space-y-2 sm:col-span-2"><Label htmlFor="pf-job">Functie</Label><Input id="pf-job" value={f.job_title} maxLength={80} placeholder="Bijv. editor, marketingmanager" onChange={(e) => setF({ ...f, job_title: e.target.value })} /></div>
        </div>
      </CardContent>
    </Card>
  );
}
