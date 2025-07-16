import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { ClientVideoList } from '@/components/client/ClientVideoList';
import { ClientMetricoolStats } from '@/components/client/ClientMetricoolStats';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ClientPortal = () => {
  const { user, logout, isClient } = useAuth();

  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Client Portal</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {user?.full_name || user?.email}
            </span>
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="metrics" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="videos">Videos</TabsTrigger>
          </TabsList>

          <TabsContent value="metrics" className="mt-6">
            <ClientMetricoolStats />
          </TabsContent>

          <TabsContent value="videos" className="mt-6">
            <ClientVideoList />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ClientPortal;