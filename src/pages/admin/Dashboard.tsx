import { useAuth } from '@/lib/auth/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Video, Award, TrendingUp, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export default function AdminDashboard() {
  const { profile, signOut } = useAuth();

  const debugCurrentUser = async () => {
    try {
      const { data: user, error } = await supabase.auth.getUser();
      console.log('Current user debug:', { user, error });
      
      const { data: session } = await supabase.auth.getSession();
      console.log('Current session debug:', session);
    } catch (error) {
      console.error('Debug error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">H</span>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">Hibe Media Admin</h1>
                <p className="text-sm text-muted-foreground">
                  {profile?.role === 'admin' ? 'Administrator' : 'Manager'} - {profile?.email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={debugCurrentUser}>
                Debug User
              </Button>
              <Button variant="outline" onClick={signOut}>
                Uitloggen
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Admin Dashboard</h2>
          <p className="text-muted-foreground">
            Beheer alle aspecten van het Hibe Media platform
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Totaal Klanten</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">45</div>
              <p className="text-xs text-muted-foreground">
                +3 deze maand
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Totaal Videos</CardTitle>
              <Video className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">234</div>
              <p className="text-xs text-muted-foreground">
                +12 deze week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">
                Vereist actie
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Performance</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">94%</div>
              <p className="text-xs text-muted-foreground">
                Gemiddelde tevredenheid
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Recente Activiteiten</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Nieuwe video geüpload</p>
                    <p className="text-sm text-muted-foreground">Klant: Nike Nederland</p>
                  </div>
                  <span className="text-xs text-muted-foreground">2m geleden</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Video goedgekeurd</p>
                    <p className="text-sm text-muted-foreground">Klant: Adidas Benelux</p>
                  </div>
                  <span className="text-xs text-muted-foreground">15m geleden</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Nieuwe klant aangemeld</p>
                    <p className="text-sm text-muted-foreground">Puma Sports</p>
                  </div>
                  <span className="text-xs text-muted-foreground">1u geleden</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Snelle Acties</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Link to="/admin/users">
                  <Button variant="outline" className="w-full h-20 flex flex-col">
                    <Users className="h-6 w-6 mb-2" />
                    <span>Gebruikers</span>
                  </Button>
                </Link>
                <Link to="/video-approval">
                  <Button variant="outline" className="w-full h-20 flex flex-col">
                    <Video className="h-6 w-6 mb-2" />
                    <span>Video Goedkeuring</span>
                  </Button>
                </Link>
                <Link to="/performance">
                  <Button variant="outline" className="w-full h-20 flex flex-col">
                    <TrendingUp className="h-6 w-6 mb-2" />
                    <span>Performance</span>
                  </Button>
                </Link>
                <Link to="/settings">
                  <Button variant="outline" className="w-full h-20 flex flex-col">
                    <Settings className="h-6 w-6 mb-2" />
                    <span>Instellingen</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}