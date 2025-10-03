import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Settings, Plus, Trash2, RefreshCw } from "lucide-react";

interface MetricoolBrand {
  id: number;
  label: string;
  platform?: string;
  tiktok?: string;
  instagram?: string;
  facebook?: string;
  youtube?: string;
  twitter?: string;
  pinterest?: string;
}

interface MetricoolConfig {
  id: string;
  client_id: string;
  blog_id: number;
  user_id: number;
  brand_name: string;
  is_active: boolean;
  created_at: string;
}

interface MetricoolSettings {
  id: string;
  user_token: string;
  user_id: number;
  is_active: boolean;
}

export default function MetricoolAdmin() {
  const [settings, setSettings] = useState<MetricoolSettings | null>(null);
  const [userToken, setUserToken] = useState("");
  const [userId, setUserId] = useState("");
  const [brands, setBrands] = useState<MetricoolBrand[]>([]);
  const [configs, setConfigs] = useState<MetricoolConfig[]>([]);
  const [selectedBrand, setSelectedBrand] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingBrands, setLoadingBrands] = useState(false);

  useEffect(() => {
    loadSettings();
    loadConfigs();
  }, []);

  // Automatically load brands when settings change
  useEffect(() => {
    if (settings && userId) {
      loadBrands();
    }
  }, [settings, userId]);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('metricool_settings')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading settings:', error);
        return;
      }

      if (data) {
        setSettings(data);
        setUserToken(data.user_token);
        setUserId(data.user_id.toString());
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const loadConfigs = async () => {
    try {
      const { data, error } = await supabase
        .from('metricool_config')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading configs:', error);
        return;
      }

      setConfigs(data || []);
    } catch (error) {
      console.error('Error loading configs:', error);
    }
  };

  const saveSettings = async () => {
    if (!userToken || !userId) {
      toast({
        title: "Fout",
        description: "Vul alle velden in",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const settingsData = {
        user_token: userToken,
        user_id: parseInt(userId),
        is_active: true
      };

      if (settings) {
        const { error } = await supabase
          .from('metricool_settings')
          .update(settingsData)
          .eq('id', settings.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('metricool_settings')
          .insert([settingsData]);

        if (error) throw error;
      }

      toast({
        title: "Succes",
        description: "Metricool instellingen opgeslagen",
      });

      loadSettings();
      // Automatically load brands after saving settings
      loadBrands();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Fout",
        description: "Kan instellingen niet opslaan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadBrands = async () => {
    if (!userId) {
      toast({
        title: "Fout",
        description: "Sla eerst de gebruikersinstellingen op",
        variant: "destructive",
      });
      return;
    }

    setLoadingBrands(true);
    try {
      const { data, error } = await supabase.functions.invoke('metricool-api', {
        body: {
          endpoint: '/admin/simpleProfiles',
          params: {
            userId: parseInt(userId)
          }
        }
      });

      if (error) throw error;

      if (data.success && data.data) {
        console.log('Brands loaded:', data.data);
        setBrands(data.data);
        toast({
          title: "Succes",
          description: `${data.data.length} merken geladen`,
        });
      } else {
        console.error('API returned error:', data);
        throw new Error(data.error || 'Onbekende fout');
      }
    } catch (error) {
      console.error('Error loading brands:', error);
      toast({
        title: "Fout",
        description: "Kan merken niet laden",
        variant: "destructive",
      });
    } finally {
      setLoadingBrands(false);
    }
  };

  const getPrimaryPlatform = (brand: MetricoolBrand): string => {
    if (brand.instagram) return 'Instagram';
    if (brand.tiktok) return 'TikTok';
    if (brand.facebook) return 'Facebook';
    if (brand.youtube) return 'YouTube';
    if (brand.twitter) return 'Twitter';
    if (brand.pinterest) return 'Pinterest';
    return 'Onbekend';
  };

  const addConfig = async () => {
    if (!selectedBrand) {
      toast({
        title: "Fout",
        description: "Selecteer een merk",
        variant: "destructive",
      });
      return;
    }

    const selectedBrandData = brands.find(b => b.id.toString() === selectedBrand);
    if (!selectedBrandData) return;

    // Use the brand ID as the client ID
    const brandClientId = selectedBrandData.id.toString();

    try {
      const { error } = await supabase
        .from('metricool_config')
        .insert([{
          client_id: brandClientId,
          blog_id: selectedBrandData.id,
          user_id: parseInt(userId),
          brand_name: selectedBrandData.label,
          is_active: true
        }]);

      if (error) throw error;

      toast({
        title: "Succes",
        description: "Configuratie toegevoegd",
      });

      setSelectedBrand("");
      loadConfigs();
    } catch (error) {
      console.error('Error adding config:', error);
      toast({
        title: "Fout",
        description: "Kan configuratie niet toevoegen",
        variant: "destructive",
      });
    }
  };

  const deleteConfig = async (id: string) => {
    try {
      const { error } = await supabase
        .from('metricool_config')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Succes",
        description: "Configuratie verwijderd",
      });

      loadConfigs();
    } catch (error) {
      console.error('Error deleting config:', error);
      toast({
        title: "Fout",
        description: "Kan configuratie niet verwijderen",
        variant: "destructive",
      });
    }
  };

  const runSync = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('metricool-sync');

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Succes",
          description: `Synchronisatie voltooid voor ${data.synced} configuraties`,
        });
      } else {
        throw new Error(data.error || 'Synchronisatie mislukt');
      }
    } catch (error) {
      console.error('Error running sync:', error);
      toast({
        title: "Fout",
        description: "Synchronisatie mislukt",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Metricool Admin</h1>
      </div>

      {/* Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle>API Instellingen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="userToken">User Token</Label>
            <Input
              id="userToken"
              type="password"
              placeholder="Metricool API Token"
              value={userToken}
              onChange={(e) => setUserToken(e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="userId">User ID</Label>
            <Input
              id="userId"
              type="number"
              placeholder="Metricool User ID"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={saveSettings} disabled={loading}>
              {loading ? "Opslaan..." : "Instellingen Opslaan"}
            </Button>
            <Button variant="outline" onClick={loadBrands} disabled={loadingBrands || !userId}>
              {loadingBrands ? "Laden..." : "Merken Laden"}
            </Button>
          </div>

          {/* Debug section */}
          {brands.length > 0 && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Debug - Geladen merken:</h4>
              <pre className="text-xs overflow-auto max-h-32">
                {JSON.stringify(brands, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Configuration Card */}
      <Card>
        <CardHeader>
          <CardTitle>Nieuwe Configuratie</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="brand">Merk</Label>
            <Select value={selectedBrand} onValueChange={setSelectedBrand}>
              <SelectTrigger>
                <SelectValue placeholder="Selecteer een merk" />
              </SelectTrigger>
              <SelectContent>
                {brands.map((brand) => (
                  <SelectItem key={brand.id} value={brand.id.toString()}>
                    {brand.label || 'Geen naam'} ({getPrimaryPlatform(brand)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={addConfig} disabled={!selectedBrand}>
            <Plus className="h-4 w-4 mr-2" />
            Configuratie Toevoegen
          </Button>
        </CardContent>
      </Card>

      {/* Configurations List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Actieve Configuraties</CardTitle>
            <Button onClick={runSync} disabled={loading}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Synchroniseren
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {configs.length === 0 ? (
            <p className="text-muted-foreground">Geen configuraties gevonden</p>
          ) : (
            <div className="space-y-2">
              {configs.map((config) => (
                <div key={config.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="font-medium">{config.brand_name}</div>
                      <div className="text-sm text-muted-foreground">
                        Klant: {config.client_id.substring(0, 8)}... | Blog ID: {config.blog_id}
                      </div>
                    </div>
                    <Badge variant={config.is_active ? "default" : "secondary"}>
                      {config.is_active ? "Actief" : "Inactief"}
                    </Badge>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteConfig(config.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}