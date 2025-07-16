import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Settings, Save } from 'lucide-react';

interface MetricoolSettings {
  id: string;
  user_id: number;
  user_token: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const AdminSettings = () => {
  const [settings, setSettings] = useState<MetricoolSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userToken, setUserToken] = useState('');
  const [userId, setUserId] = useState('2401844');
  const { toast } = useToast();

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('metricool_settings')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSettings(data);
        setUserToken(data.user_token);
        setUserId(data.user_id.toString());
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const settingsData = {
        user_id: parseInt(userId),
        user_token: userToken,
        is_active: true
      };

      if (settings) {
        // Update existing settings
        const { error } = await supabase
          .from('metricool_settings')
          .update(settingsData)
          .eq('id', settings.id);

        if (error) throw error;
      } else {
        // Create new settings
        const { error } = await supabase
          .from('metricool_settings')
          .insert(settingsData);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Settings saved successfully"
      });

      fetchSettings();
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-8">Loading settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-6 w-6" />
        <h2 className="text-2xl font-bold">Admin Settings</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Metricool Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="userId">User ID</Label>
            <Input
              id="userId"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="2401844"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="userToken">User Token</Label>
            <Input
              id="userToken"
              type="password"
              value={userToken}
              onChange={(e) => setUserToken(e.target.value)}
              placeholder="Enter Metricool user token"
            />
          </div>

          <Button onClick={handleSaveSettings} disabled={saving}>
            {saving ? (
              <>
                <Save className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Settings Status:</span>
              <span className="ml-2 text-green-600">
                {settings ? 'Configured' : 'Not configured'}
              </span>
            </div>
            <div>
              <span className="font-medium">Last Updated:</span>
              <span className="ml-2 text-muted-foreground">
                {settings ? new Date(settings.updated_at).toLocaleString() : 'Never'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};