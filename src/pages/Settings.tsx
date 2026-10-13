import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { User, Bell, Shield, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { UserAuth } from "@/context/AuthContext.jsx";
import { toast } from "sonner";

export default function Settings() {
  const { user } = UserAuth();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [notify, setNotify] = useState(true);
  const [saving, setSaving] = useState(false);
  const [current, setCurrent] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [pwBusy, setPwBusy] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    supabase.from("profiles_settings").select("full_name,phone,notify_new_video").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        if (data) { setFullName(data.full_name ?? ""); setPhone(data.phone ?? ""); setNotify(data.notify_new_video); }
      });
  }, [user?.id]);

  const save = async () => {
    if (!user?.id) return;
    if (phone && !/^[+0-9 ()-]{6,20}$/.test(phone)) return toast.error("Telefoonnummer is ongeldig");
    setSaving(true);
    const { error } = await supabase.from("profiles_settings").upsert({
      user_id: user.id, full_name: fullName.trim() || null, phone: phone.trim() || null,
      notify_new_video: notify, updated_at: new Date().toISOString(),
    });
    setSaving(false);
    if (error) toast.error("Opslaan mislukt: " + error.message);
    else toast.success("Je instellingen zijn opgeslagen");
  };

  const changePassword = async () => {
    if (pw.length < 8) return toast.error("Gebruik minstens 8 tekens");
    if (pw !== pw2) return toast.error("De nieuwe wachtwoorden zijn niet gelijk");
    setPwBusy(true);
    // deno-lint-ignore no-explicit-any
    const { error } = await supabase.auth.updateUser({ password: pw, current_password: current } as any);
    setPwBusy(false);
    if (error) return toast.error("Wachtwoord wijzigen mislukt: " + error.message);
    setCurrent(""); setPw(""); setPw2("");
    toast.success("Je wachtwoord is gewijzigd");
  };

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="wordmark">Instellingen</h1>
          <p className="text-muted-foreground mt-1">Beheer je account en voorkeuren</p>
        </div>
        <Button onClick={save} disabled={saving}><Save className="h-4 w-4 mr-2" />Opslaan</Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-5 w-5" />Account</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2"><Label htmlFor="name">Naam</Label><Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={200} /></div>
          <div className="space-y-2"><Label htmlFor="phone">Telefoonnummer</Label><Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} /></div>
          <div className="space-y-2 md:col-span-2"><Label>E-mailadres</Label><Input value={user?.email ?? ""} disabled /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" />E-mailvoorkeuren</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Label htmlFor="notify">Mail me bij een nieuwe video ter goedkeuring</Label>
            <Switch id="notify" checked={notify} onCheckedChange={setNotify} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" />Wachtwoord wijzigen</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input type="password" placeholder="Huidig wachtwoord" value={current} onChange={(e) => setCurrent(e.target.value)} />
          <Input type="password" placeholder="Nieuw wachtwoord" value={pw} onChange={(e) => setPw(e.target.value)} />
          <Input type="password" placeholder="Herhaal nieuw wachtwoord" value={pw2} onChange={(e) => setPw2(e.target.value)} />
          <Button variant="outline" onClick={changePassword} disabled={pwBusy}>Wachtwoord wijzigen</Button>
        </CardContent>
      </Card>
    </div>
  );
}
