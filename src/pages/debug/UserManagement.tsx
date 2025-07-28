import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Trash2, RefreshCw } from 'lucide-react';

interface User {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      console.log('🔍 Fetching all users...');
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('📊 Users data:', { data, error });

      if (error) {
        toast({
          title: "Fout bij ophalen gebruikers",
          description: error.message,
          variant: "destructive"
        });
      } else {
        setUsers(data || []);
        toast({
          title: "Gebruikers geladen",
          description: `${data?.length || 0} gebruikers gevonden`,
        });
      }
    } catch (err) {
      console.error('❌ Error fetching users:', err);
      toast({
        title: "Onverwachte fout",
        description: "Kon gebruikers niet ophalen",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId: string, email: string) => {
    if (!confirm(`Weet je zeker dat je gebruiker ${email} volledig wilt verwijderen?\n\nDit verwijdert de gebruiker uit zowel public.users als auth.users.`)) {
      return;
    }

    setDeleteLoading(userId);
    try {
      console.log('🗑️ Deleting user:', { userId, email });

      let authDeleted = false;
      let publicDeleted = false;

      // Try to delete from auth.users first (requires service role key)
      try {
        const { error: authError } = await supabase.auth.admin.deleteUser(userId);
        if (!authError) {
          authDeleted = true;
          console.log('✅ Auth user deleted successfully');
        } else {
          console.warn('⚠️ Auth delete failed:', authError.message);
        }
      } catch (authErr) {
        console.warn('⚠️ Auth delete failed with exception:', authErr);
      }

      // Delete from public.users table
      const { error: publicError } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (!publicError) {
        publicDeleted = true;
        console.log('✅ Public user deleted successfully');
      } else {
        throw new Error(`Public users delete error: ${publicError.message}`);
      }

      // Show appropriate success message
      if (authDeleted && publicDeleted) {
        toast({
          title: "✅ Gebruiker volledig verwijderd",
          description: `${email} succesvol verwijderd uit zowel auth.users als public.users`,
        });
      } else if (publicDeleted && !authDeleted) {
        toast({
          title: "⚠️ Gedeeltelijk verwijderd",
          description: `${email} verwijderd uit public.users. Auth verwijdering vereist service role key.`,
          variant: "destructive"
        });
      }

      // Refresh the user list
      await fetchUsers();
    } catch (err) {
      console.error('❌ Delete error:', err);
      toast({
        title: "❌ Verwijderen mislukt",
        description: err instanceof Error ? err.message : "Onbekende fout bij verwijderen",
        variant: "destructive"
      });
    } finally {
      setDeleteLoading(null);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Alert>
          <AlertDescription>
            ⚠️ <strong>DEBUG PAGINA</strong> - Tijdelijk voor ontwikkeling. Verwijder deze pagina in productie.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Gebruikersbeheer Debug</CardTitle>
            <Button 
              onClick={fetchUsers} 
              disabled={loading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Vernieuwen
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Gebruikers laden...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Geen gebruikers gevonden</p>
              </div>
            ) : (
              <div className="space-y-4">
                {users.map((user) => (
                  <div 
                    key={user.id} 
                    className="flex items-center justify-between p-4 border border-border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{user.email}</span>
                        <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'}>
                          {user.role}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        ID: {user.id}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Aangemaakt: {new Date(user.created_at).toLocaleString('nl-NL')}
                      </p>
                    </div>
                    <Button
                      onClick={() => deleteUser(user.id, user.email)}
                      disabled={deleteLoading === user.id}
                      variant="destructive"
                      size="sm"
                    >
                      {deleteLoading === user.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}