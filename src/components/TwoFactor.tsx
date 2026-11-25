import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export function TwoFactor({ challenge = false, onVerified }: { challenge?: boolean; onVerified?: () => void }) {
  const [factors, setFactors] = useState<{ id: string; status: string }[]>([]);
  const [setup, setSetup] = useState<{ id: string; qr: string } | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const refresh = async () => {
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) return toast.error(error.message);
    setFactors(data.totp);
  };
  useEffect(() => { refresh(); }, []);
  const verified = factors.find(f => f.status === "verified");
  const enroll = async () => {
    setBusy(true);
    // An abandoned, unverified enrollment must not prevent a fresh attempt.
    for (const factor of factors.filter(f => f.status !== "verified")) await supabase.auth.mfa.unenroll({ factorId: factor.id });
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "HIBE Hub" });
    setBusy(false);
    if (error) return toast.error(error.message);
    setSetup({ id: data.id, qr: data.totp.qr_code });
  };
  const verify = async () => {
    const id = setup?.id ?? verified?.id;
    if (!id) return;
    setBusy(true);
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: id, code });
    setBusy(false);
    if (error) return toast.error("De code klopt niet of is verlopen.");
    setCode(""); setSetup(null); await refresh();
    toast.success(challenge ? "Inloggen bevestigd" : "Tweestapsverificatie staat aan");
    onVerified?.();
  };
  const disable = async () => {
    if (!verified || !window.confirm("Tweestapsverificatie uitschakelen?")) return;
    setBusy(true);
    const { error } = await supabase.auth.mfa.unenroll({ factorId: verified.id });
    setBusy(false);
    if (error) return toast.error(error.message);
    await refresh(); toast.success("Tweestapsverificatie uitgeschakeld");
  };
  return <section className="space-y-3 border-t border-border pt-5">
    <h2 className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-5 w-5" />Tweestapsverificatie</h2>
    <p className="text-sm text-muted-foreground">{challenge ? "Vul de code uit je authenticator-app in om in te loggen." : verified ? "Je account is beschermd met een extra inlogcode." : "Bescherm je account met een extra code uit je authenticator-app."}</p>
    {setup && <><img src={setup.qr} alt="QR-code voor je authenticator" className="h-48 w-48" /><p className="text-sm text-muted-foreground">Scan de QR-code met je authenticator-app en bevestig met de zescijferige code.</p></>}
    {(setup || challenge) ? <div className="flex flex-wrap items-end gap-2"><div className="space-y-1"><Label htmlFor="mfa-code">Inlogcode</Label><Input id="mfa-code" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0,6))} inputMode="numeric" autoComplete="one-time-code" className="w-40" /></div><Button onClick={verify} disabled={busy || code.length !== 6}>Bevestigen</Button></div> : verified ? <Button variant="outline" onClick={disable} disabled={busy}>2FA uitschakelen</Button> : <Button variant="outline" onClick={enroll} disabled={busy}>2FA inschakelen</Button>}
  </section>;
}