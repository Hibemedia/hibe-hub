import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface Client {
  id: string;
  email: string;
  role: string;
  created_at: string;
  profiles?: {
    full_name?: string;
  }[];
  metricool_config?: {
    blog_id: number;
    brand_name: string;
  }[];
}

export const ClientManagement = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newClient, setNewClient] = useState({
    email: '',
    password: '',
    full_name: '',
    blog_id: '',
    brand_name: ''
  });
  const { toast } = useToast();

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          email,
          role,
          created_at,
          profiles(full_name),
          metricool_config(blog_id, brand_name)
        `)
        .eq('role', 'client');

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast({
        title: "Error",
        description: "Failed to load clients",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleCreateClient = async () => {
    try {
      // First, create the user account in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newClient.email,
        password: newClient.password,
        options: {
          data: {
            full_name: newClient.full_name
          }
        }
      });

      if (authError) throw authError;

      // Then create the user record in our custom users table
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user?.id,
          email: newClient.email,
          role: 'client',
          password_hash: 'handled_by_auth' // Placeholder since auth handles this
        });

      if (userError) throw userError;

      // Create profile if full_name is provided
      if (newClient.full_name && authData.user?.id) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: authData.user.id,
            full_name: newClient.full_name
          });

        if (profileError) throw profileError;
      }

      // Create Metricool configuration if blog_id is provided
      if (newClient.blog_id && authData.user?.id) {
        const { error: configError } = await supabase
          .from('metricool_config')
          .insert({
            user_id_ref: authData.user.id,
            user_id: 2401844, // Fixed user ID for Metricool
            blog_id: parseInt(newClient.blog_id),
            brand_name: newClient.brand_name || 'Default Brand',
            client_id: authData.user.id
          });

        if (configError) throw configError;
      }

      toast({
        title: "Success",
        description: "Client created successfully"
      });

      setIsCreateDialogOpen(false);
      setNewClient({ email: '', password: '', full_name: '', blog_id: '', brand_name: '' });
      fetchClients();
    } catch (error: any) {
      console.error('Error creating client:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create client",
        variant: "destructive"
      });
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', clientId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Client deleted successfully"
      });

      fetchClients();
    } catch (error: any) {
      console.error('Error deleting client:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete client",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="flex justify-center py-8">Loading clients...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Client Management</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Client</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newClient.email}
                  onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                  placeholder="client@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={newClient.password}
                  onChange={(e) => setNewClient({ ...newClient, password: e.target.value })}
                  placeholder="Temporary password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={newClient.full_name}
                  onChange={(e) => setNewClient({ ...newClient, full_name: e.target.value })}
                  placeholder="Client's full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand_name">Brand Name</Label>
                <Input
                  id="brand_name"
                  value={newClient.brand_name}
                  onChange={(e) => setNewClient({ ...newClient, brand_name: e.target.value })}
                  placeholder="Brand name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="blog_id">Metricool Blog ID</Label>
                <Input
                  id="blog_id"
                  value={newClient.blog_id}
                  onChange={(e) => setNewClient({ ...newClient, blog_id: e.target.value })}
                  placeholder="4265125"
                />
              </div>
              <Button onClick={handleCreateClient} className="w-full">
                Create Client
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Clients</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Blog ID</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>{client.profiles?.[0]?.full_name || 'N/A'}</TableCell>
                  <TableCell>{client.email}</TableCell>
                  <TableCell>
                    {client.metricool_config?.[0]?.brand_name || 'N/A'}
                  </TableCell>
                  <TableCell>
                    {client.metricool_config?.[0]?.blog_id || 'N/A'}
                  </TableCell>
                  <TableCell>
                    {new Date(client.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleDeleteClient(client.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};