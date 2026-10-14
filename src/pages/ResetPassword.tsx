import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    supabase.auth.getSession().then(({ data: { session } }) => { if (session) setReady(true); });
    return () => data.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return toast.error("Gebruik minstens 8 tekens");
    if (password !== confirm) return toast.error("De wachtwoorden zijn niet gelijk");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Je nieuwe wachtwoord is opgeslagen");
    navigate("/");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <form onSubmit={submit} className="w-full max-w-md space-y-5 rounded-lg bg-card p-6 md:p-10">
        <h1 className="wordmark text-4xl md:text-5xl">Nieuw wachtwoord</h1>
        {!ready ? (
          <p className="text-sm text-muted-foreground">
            Open deze pagina via de link in je e-mail. Is de link verlopen? Vraag op de inlogpagina een nieuwe aan.
          </p>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="pw">Nieuw wachtwoord</Label>
              <Input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pw2">Herhaal wachtwoord</Label>
              <Input id="pw2" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>Opslaan</Button>
          </>
        )}
      </form>
    </div>
  );
}
