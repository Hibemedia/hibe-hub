import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Login attempt for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('Login result:', data, error);

      if (error) {
        setError(error.message);
        return;
      }

      if (data.user) {
        const { data: session } = await supabase.auth.getSession();
        console.log('Session data:', session);

        // Get user profile to determine redirect
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', data.user.id)
          .single();

        toast({
          title: "Ingelogd",
          description: "Je bent succesvol ingelogd.",
        });

        // Redirect based on role
        if (profile?.role === 'admin' || profile?.role === 'manager') {
          navigate('/admin/dashboard', { replace: true });
        } else {
          navigate(from, { replace: true });
        }
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setError('Er is een fout opgetreden bij het inloggen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">H</span>
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Klanten Login</CardTitle>
          <CardDescription className="text-center">
            Log in om toegang te krijgen tot je portal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">E-mailadres</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="je@email.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Wachtwoord</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? 'Inloggen...' : 'Inloggen'}
            </Button>
          </form>
          
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              Medewerker? {' '}
              <Link to="/admin/login" className="text-primary hover:underline">
                Admin Login
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}