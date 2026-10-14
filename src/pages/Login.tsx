import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo.png";
import { UserAuth } from "@/context/AuthContext.jsx";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Login = () => {
  const {user, signInUser} = UserAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  useEffect(() => { if (user) navigate("/", { replace: true }); }, [user]); // eslint-disable-line react-hooks/exhaustive-deps
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const result = await signInUser(email,password);
      if(result.success){
        const { data: role } = await supabase.from("user_roles").select("role").eq("user_id", result.session.user.id).eq("role", "admin").maybeSingle();
        navigate(role ? "/hibe" : "/");
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
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-lg bg-card p-6 md:p-10">
        <img src={logo} alt="HIBE Media" className="mb-8 h-8 w-auto" />
        <h1 className="wordmark text-5xl md:text-6xl">Inloggen</h1>
        <p className="mt-2 text-muted-foreground">Log in op het HIBE Klantportaal.</p>
        {sent ? (
          <div className="mt-8 space-y-4">
            <p className="rounded-2xl bg-popover p-4 text-sm">Als <span className="font-semibold">{email}</span> bij ons bekend is, staat er nu een e-mail met een resetlink in je inbox. Open de link om een nieuw wachtwoord in te stellen.</p>
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
                <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Verberg wachtwoord" : "Toon wachtwoord"} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <button type="button" onClick={handleForgot} disabled={forgotBusy} className="text-sm font-medium underline underline-offset-4">
              {forgotBusy ? "Versturen…" : "Wachtwoord vergeten?"}
            </button>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="h-12 w-full text-base" disabled={isLoading}>
              {isLoading ? "Inloggen…" : <>Inloggen <ArrowRight className="h-4 w-4" /></>}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
