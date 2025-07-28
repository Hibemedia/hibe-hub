import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Edit } from 'lucide-react';
import type { UserProfile, UserRole } from '@/lib/auth/useAuth';

export default function AdminUsers() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    role: 'klant' as UserRole,
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Fout",
        description: "Kon gebruikers niet laden.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createUser = async () => {
    if (!profile || profile.role !== 'admin') {
      toast({
        title: "Geen toegang",
        description: "Alleen admins kunnen gebruikers aanmaken.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: {
          data: {
            role: newUser.role,
          },
        },
      });

      if (error) throw error;

      toast({
        title: "Gebruiker aangemaakt",
        description: `${newUser.email} is succesvol aangemaakt.`,
      });

      setNewUser({ email: '', password: '', role: 'klant' });
      setDialogOpen(false);
      fetchUsers();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: "Fout",
        description: error.message || "Kon gebruiker niet aanmaken.",
        variant: "destructive",
      });
    }
  };

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    if (!profile || profile.role !== 'admin') {
      toast({
        title: "Geen toegang",
        description: "Alleen admins kunnen rollen wijzigen.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Rol bijgewerkt",
        description: "De gebruikersrol is succesvol gewijzigd.",
      });

      fetchUsers();
    } catch (error: any) {
      console.error('Error updating user role:', error);
      toast({
        title: "Fout",
        description: "Kon gebruikersrol niet wijzigen.",
        variant: "destructive",
      });
    }
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'manager':
        return 'default';
      case 'klant':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gebruikersbeheer</h1>
          <p className="text-muted-foreground">Beheer alle gebruikers van het platform</p>
        </div>
        
        {profile?.role === 'admin' && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Nieuwe Gebruiker
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nieuwe Gebruiker Aanmaken</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mailadres</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="gebruiker@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Wachtwoord</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Rol</Label>
                  <Select value={newUser.role} onValueChange={(value: UserRole) => setNewUser({ ...newUser, role: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="klant">Klant</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={createUser} className="w-full">
                  Gebruiker Aanmaken
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Alle Gebruikers</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>E-mailadres</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Aangemaakt</TableHead>
                <TableHead>Acties</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString('nl-NL')}
                  </TableCell>
                  <TableCell>
                    {profile?.role === 'admin' && (
                      <Select
                        value={user.role}
                        onValueChange={(newRole: UserRole) => updateUserRole(user.id, newRole)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="klant">Klant</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}