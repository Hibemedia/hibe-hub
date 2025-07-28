import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

export default function AdminRegister() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<string>('admin');
  const [loading, setLoading] = useState(false);
  const [debugOutput, setDebugOutput] = useState<string>('');
  const { toast } = useToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setDebugOutput('');

    try {
      console.log('🚀 Starting user registration...', { email, role });
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: role
          }
        }
      });

      const output = {
        timestamp: new Date().toISOString(),
        email,
        role,
        data,
        error,
        success: !error
      };

      setDebugOutput(JSON.stringify(output, null, 2));
      console.log('📊 Admin registration result:', output);

      if (error) {
        toast({
          title: "Registratie mislukt",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Gebruiker geregistreerd",
          description: `${role.charAt(0).toUpperCase() + role.slice(1)} ${email} succesvol aangemaakt`,
        });
        setEmail('');
        setPassword('');
      }
    } catch (err) {
      const errorOutput = {
        timestamp: new Date().toISOString(),
        error: err,
        success: false
      };
      setDebugOutput(JSON.stringify(errorOutput, null, 2));
      console.error('❌ Registration error:', err);
      toast({
        title: "Onverwachte fout",
        description: "Er is een onverwachte fout opgetreden",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <Alert>
          <AlertDescription>
            ⚠️ <strong>DEBUG PAGINA</strong> - Tijdelijk voor ontwikkeling. Verwijder deze pagina in productie.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Gebruiker Registratie Debug</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <Label htmlFor="role">Rol</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecteer een rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="klant">Klant</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="gebruiker@hibemedia.com"
                />
              </div>
              
              <div>
                <Label htmlFor="password">Wachtwoord</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Minimaal 6 karakters"
                  minLength={6}
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Registreren...' : `Registreer ${role.charAt(0).toUpperCase() + role.slice(1)}`}
              </Button>
            </form>
          </CardContent>
        </Card>

        {debugOutput && (
          <Card>
            <CardHeader>
              <CardTitle>Debug Output</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded text-sm overflow-auto">
                {debugOutput}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}