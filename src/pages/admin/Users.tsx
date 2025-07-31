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
import { UserPlus, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import type { UserProfile, UserRole } from '@/lib/auth/useAuth';

interface MetricoolBrand {
  id: number;
  label: string;
  title: string;
}

export default function AdminUsers() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [brands, setBrands] = useState<MetricoolBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [newUser, setNewUser] = useState<{
    email: string;
    password: string;
    role: UserRole;
    metricool_brand_id: number | null;
  }>({
    email: '',
    password: '',
    role: 'klant',
    metricool_brand_id: null,
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  useEffect(() => {
    fetchUsers();
    fetchBrands();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          metricool_brands:metricool_brand_id (
            id,
            label,
            title
          )
        `)
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

  const fetchBrands = async () => {
    try {
      const { data, error } = await supabase
        .from('metricool_brands')
        .select('id, label, title')
        .order('label', { ascending: true });

      if (error) throw error;
      setBrands(data || []);
    } catch (error) {
      console.error('Error fetching brands:', error);
      toast({
        title: "Fout",
        description: "Kon brands niet laden.",
        variant: "destructive",
      });
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
            metricool_brand_id: newUser.metricool_brand_id,
          },
        },
      });

      if (error) throw error;

      toast({
        title: "Gebruiker aangemaakt",
        description: `${newUser.email} is succesvol aangemaakt.`,
      });

      setNewUser({ email: '', password: '', role: 'klant', metricool_brand_id: null });
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

  const updateUserBrand = async (userId: string, brandId: number | null) => {
    if (!profile || profile.role !== 'admin') {
      toast({
        title: "Geen toegang",
        description: "Alleen admins kunnen brands wijzigen.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('users')
        .update({ metricool_brand_id: brandId } as any)
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Brand bijgewerkt",
        description: "De brand-koppeling is succesvol gewijzigd.",
      });

      fetchUsers();
    } catch (error: any) {
      console.error('Error updating user brand:', error);
      toast({
        title: "Fout",
        description: "Kon brand-koppeling niet wijzigen.",
        variant: "destructive",
      });
    }
  };

  const deleteUser = async () => {
    if (!profile || profile.role !== 'admin' || !userToDelete) {
      toast({
        title: "Geen toegang",
        description: "Alleen admins kunnen gebruikers verwijderen.",
        variant: "destructive",
      });
      return;
    }

    if (deleteConfirmText !== 'VERWIJDEREN') {
      toast({
        title: "Bevestiging vereist",
        description: "Typ 'VERWIJDEREN' om te bevestigen.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Use the new edge function for secure deletion
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId: userToDelete.id }
      });

      if (error) {
        console.error('Error calling delete-user function:', error);
        throw error;
      }

      if (data?.error) {
        console.error('Error from delete-user function:', data.error);
        if (data.partial_success) {
          toast({
            title: "Gedeeltelijk verwijderd",
            description: `${userToDelete.email}: ${data.error}`,
            variant: "destructive",
          });
        } else {
          throw new Error(data.error);
        }
      } else {
        toast({
          title: "Gebruiker verwijderd",
          description: `${userToDelete.email} is succesvol verwijderd uit alle systemen.`,
        });
      }

      setDeleteDialogOpen(false);
      setUserToDelete(null);
      setDeleteConfirmText('');
      fetchUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: "Fout",
        description: error.message || "Kon gebruiker niet verwijderen.",
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
                {newUser.role === 'klant' && (
                  <div className="space-y-2">
                    <Label htmlFor="brand">Metricool Brand</Label>
                    <Select 
                      value={newUser.metricool_brand_id?.toString() || 'none'} 
                      onValueChange={(value) => setNewUser({ ...newUser, metricool_brand_id: value === 'none' ? null : parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecteer een brand" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Geen brand</SelectItem>
                        {brands.map((brand) => (
                          <SelectItem key={brand.id} value={brand.id.toString()}>
                            {brand.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
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
                <TableHead>Brand</TableHead>
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
                    {user.role === 'klant' ? (
                      profile?.role === 'admin' ? (
                        <Select
                          value={user.metricool_brand_id?.toString() || 'none'}
                          onValueChange={(value) => updateUserBrand(user.id, value === 'none' ? null : parseInt(value))}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Selecteer brand" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Geen brand</SelectItem>
                            {brands.map((brand) => (
                              <SelectItem key={brand.id} value={brand.id.toString()}>
                                {brand.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="text-sm">
                          {(user as any).metricool_brands?.label || 
                           (user as any).metricool_brands?.title || 
                           (user.metricool_brand_id ? `Brand ${user.metricool_brand_id}` : 'Geen brand')}
                        </div>
                      )
                    ) : (
                      <span className="text-muted-foreground">N.v.t.</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString('nl-NL')}
                  </TableCell>
                  <TableCell>
                    {profile?.role === 'admin' && (
                      <div className="flex items-center gap-2">
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
                        
                        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => setUserToDelete(user)}
                              className="h-8 w-8 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Gebruiker verwijderen</AlertDialogTitle>
                              <AlertDialogDescription className="space-y-2">
                                <p>Weet je zeker dat je gebruiker <strong>{userToDelete?.email}</strong> wilt verwijderen?</p>
                                <p className="text-destructive font-medium">Deze actie kan niet ongedaan worden gemaakt.</p>
                                <div className="mt-4">
                                  <Label htmlFor="delete-confirm">Typ 'VERWIJDEREN' om te bevestigen:</Label>
                                  <Input
                                    id="delete-confirm"
                                    value={deleteConfirmText}
                                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                                    placeholder="VERWIJDEREN"
                                    className="mt-2"
                                  />
                                </div>
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={() => {
                                setDeleteConfirmText('');
                                setUserToDelete(null);
                              }}>
                                Annuleren
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={deleteUser}
                                disabled={deleteConfirmText !== 'VERWIJDEREN'}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Definitief verwijderen
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
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