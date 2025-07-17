import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      console.log('Signup attempt for:', email);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/admin/login`
        }
      });

      console.log('Signup result:', data, error);

      if (error) throw error;

      if (data.user) {
        setSuccess(true);
        console.log('User created successfully, checking if trigger created public.users record...');
        
        // Check if the trigger created the public.users record
        setTimeout(async () => {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single();
          
          console.log('Public.users record check:', userData, userError);
          
          if (userData) {
            console.log('✅ on_auth_user_created trigger worked! User record created in public.users');
          } else {
            console.log('❌ on_auth_user_created trigger failed! No record in public.users');
          }
        }, 2000);

        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/admin/login');
        }, 3000);
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      setError(error.message || 'Er is een fout opgetreden bij het registreren');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">H</span>
              </div>
            </div>
            <CardTitle className="text-2xl text-center text-green-600">Registratie Succesvol!</CardTitle>
            <CardDescription className="text-center">
              Je account is aangemaakt. Je wordt doorgestuurd naar de login pagina...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-800">
                Account succesvol aangemaakt voor {email}. 
                Controleer de console voor debug informatie over de database trigger.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">H</span>
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Registreer Account</CardTitle>
          <CardDescription className="text-center">
            Tijdelijke registratiepagina voor testing
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
                disabled={loading}
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
                disabled={loading}
                minLength={6}
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Bezig met registreren...' : 'Registreren'}
            </Button>
            
            <div className="text-center text-sm">
              <Button
                variant="link"
                onClick={() => navigate('/admin/login')}
                className="text-primary hover:underline"
              >
                ← Terug naar login
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}