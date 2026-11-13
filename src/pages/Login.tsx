import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import logo from "@/assets/hibe-logo.png";
import photo from "@/assets/hibe-contentdag-login.jpg.asset.json";
import { UserAuth } from "@/context/AuthContext.jsx";
import { supabase } from "@/integrations/supabase/client";

const Login = () => {
  const {user, signInUser} = UserAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from;
  useEffect(() => { if (user) navigate(from ?? "/", { replace: true }); }, [user]); // eslint-disable-line react-hooks/exhaustive-deps
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const result = await signInUser(email,password);
      if(result.success){
        const { data: role } = await supabase.from("user_roles").select("role").eq("user_id", result.session.user.id).eq("role", "admin").maybeSingle();
        navigate(from && (role ? from.startsWith("/hibe") : !from.startsWith("/hibe")) ? from : role ? "/hibe" : "/");
      } else {
        setError("E-mailadres of wachtwoord klopt niet.");
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };
  const [sent, setSent] = useState(false);
  const [forgotBusy, setForgotBusy] = useState(false);
  const handleForgot = async () => {
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) { setError("Vul eerst je e-mailadres in, dan sturen we je een resetlink."); document.getElementById("email")?.focus(); return; }
    setError(null); setForgotBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` });
    setForgotBusy(false);
    if (error) setError(/rate|seconds/i.test(error.message) ? "Er is net al een resetmail verstuurd. Probeer het over een minuut opnieuw." : "Versturen lukte niet: " + error.message);
    else setSent(true);
  };

  return (
    <div className="min-h-screen bg-background p-2 pb-8 md:p-3 md:pb-10">
      <header className="relative h-[340px] overflow-hidden rounded-lg bg-foreground text-background md:h-[430px]">
        <img src={photo.url} alt="" width={1920} height={1282} className="absolute inset-0 h-full w-full object-cover object-[center_40%] grayscale" fetchPriority="high" />
        <div className="absolute inset-0 bg-[image:var(--login-overlay)]" />
        <div className="relative mx-auto flex max-w-6xl items-center justify-between px-5 py-5 md:px-8 md:py-7">
          <div className="flex items-center gap-3"><img src={logo} alt="HIBE" className="h-7 w-auto md:h-8" /><span className="border-l border-background/30 pl-3 text-sm font-medium">Hub</span></div>
          <span className="flex items-center gap-2 text-xs font-medium"><span className="h-1.5 w-1.5 rounded-full bg-lime" />Klant & team</span>
        </div>
        <div className="relative mx-auto max-w-lg px-6 pt-7 text-center md:pt-9">
          <h1 className="text-4xl font-semibold md:text-5xl">Welkom bij HIBE</h1>
          <p className="mt-3 text-sm text-background/80 md:text-base">Goed je weer te zien.</p>
        </div>
      </header>
      <main className="relative mx-auto -mt-24 w-full max-w-[440px] px-4 md:-mt-36">
      <div className="rounded-lg border border-border bg-card p-6 md:p-8">
        <img src={logo} alt="HIBE" width={400} height={225} className="mx-auto mb-5 h-10 w-auto brightness-0 dark:invert" />
        <h2 className="text-center text-2xl font-semibold">{sent ? "Controleer je inbox" : "Inloggen"}</h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">{sent ? "Je resetlink is onderweg." : "Jouw HIBE-account"}</p>
        {sent ? (
          <div className="mt-8 space-y-4">
            <p className="rounded-lg bg-popover p-4 text-sm">Als <span className="font-semibold">{email}</span> bij ons bekend is, staat er nu een e-mail met een resetlink in je inbox. Open de link om een nieuw wachtwoord in te stellen.</p>
            <Button variant="outline" onClick={() => setSent(false)}>Terug naar inloggen</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mailadres</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 pl-10" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Wachtwoord</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 pl-10 pr-12" required />
                <Button variant="ghost" size="icon" type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Verberg wachtwoord" : "Toon wachtwoord"} className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <Button variant="link" type="button" onClick={handleForgot} disabled={forgotBusy} className="h-auto p-0 text-sm font-medium underline underline-offset-4">
              {forgotBusy ? "Versturen…" : "Wachtwoord vergeten?"}
            </Button>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="h-12 w-full text-base" disabled={isLoading}>
              {isLoading ? "Inloggen…" : <>Inloggen <ArrowRight className="h-4 w-4" /></>}
            </Button>
          </form>
        )}
      </div>
      <p className="mt-6 text-center text-xs text-muted-foreground">HIBE Media · Samen maken we het.</p>
      </main>
    </div>
  );
};

export default Login;
