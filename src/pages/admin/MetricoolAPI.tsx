import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Save, RefreshCw, Clock } from "lucide-react";

interface MetricoolCredentials {
  id: string;
  access_token: string;
  user_id: string;
}

interface MetricoolBrand {
  id: string;
  brand_id: number;
  name: string;
  platforms: string[];
  synced_at: string;
  created_at: string;
  updated_at: string;
}

export default function MetricoolAPI() {
  const { hasRole } = useAuth();
  const [credentials, setCredentials] = useState<MetricoolCredentials | null>(null);
  const [accessToken, setAccessToken] = useState("");
  const [userId, setUserId] = useState("");
  const [brands, setBrands] = useState<MetricoolBrand[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Load existing credentials and brands - always call this hook
  useEffect(() => {
    if (hasRole('admin')) {
      loadCredentials();
      loadStoredBrands();
    }
  }, [hasRole]);

  // Check if user is admin - moved after hooks
  if (!hasRole('admin')) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center">
              Je hebt geen toegang tot deze pagina. Alleen admins kunnen Metricool API instellingen beheren.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const loadCredentials = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('metricool_credentials')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error loading credentials:', error);
        return;
      }

      if (data) {
        setCredentials(data);
        setAccessToken(data.access_token);
        setUserId(data.user_id);
      }
    } catch (error) {
      console.error('Error loading credentials:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStoredBrands = async () => {
    try {
      const { data, error } = await supabase
        .from('metricool_brands')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error loading stored brands:', error);
        return;
      }

      // Convert platforms from JSONB to string array
      const processedBrands = (data || []).map(brand => ({
        ...brand,
        platforms: Array.isArray(brand.platforms) ? brand.platforms as string[] : []
      })) as MetricoolBrand[];

      setBrands(processedBrands);
    } catch (error) {
      console.error('Error loading stored brands:', error);
    }
  };

  const saveCredentials = async () => {
    if (!accessToken || !userId) {
      toast.error("Vul beide velden in");
      return;
    }

    setSaving(true);
    try {
      let result;
      if (credentials) {
        // Update existing singleton row
        result = await supabase
          .from('metricool_credentials')
          .update({
            access_token: accessToken,
            user_id: userId,
            updated_at: new Date().toISOString()
          })
          .eq('id', credentials.id)
          .select()
          .single();
      } else {
        // Insert new singleton row (only one allowed due to unique constraint)
        result = await supabase
          .from('metricool_credentials')
          .insert({
            access_token: accessToken,
            user_id: userId,
            singleton_check: true // Required for singleton constraint
          })
          .select()
          .single();
      }

      if (result.error) {
        throw result.error;
      }

      setCredentials(result.data);
      toast.success("Credentials succesvol opgeslagen");
    } catch (error) {
      console.error('Error saving credentials:', error);
      toast.error("Fout bij opslaan van credentials");
    } finally {
      setSaving(false);
    }
  };

  const syncBrands = async () => {
    if (!credentials) {
      toast.error("Geen credentials beschikbaar");
      return;
    }

    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-metricool-brands');

      if (error) {
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      toast.success(`${data.brandsCount} merken succesvol gesynchroniseerd`);
      await loadStoredBrands(); // Reload brands after sync
    } catch (error) {
      console.error('Error syncing brands:', error);
      toast.error(`Fout bij synchroniseren: ${error.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('nl-NL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const maskToken = (token: string) => {
    if (token.length <= 8) return token;
    return `${token.slice(0, 4)}${'*'.repeat(token.length - 8)}${token.slice(-4)}`;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Metricool API</h1>
        <p className="text-muted-foreground">
          Beheer Metricool API credentials en synchroniseer merken
        </p>
      </div>

      {/* Token Management */}
      <Card>
        <CardHeader>
          <CardTitle>API Credentials</CardTitle>
          <CardDescription>
            Sla je Metricool API toegangsgegevens veilig op
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="access-token">REST API Access Token</Label>
            <Input
              id="access-token"
              type="password"
              placeholder="Voer je access token in"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
            />
            {credentials && accessToken && (
              <p className="text-xs text-muted-foreground">
                Huidige token: {maskToken(credentials.access_token)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="user-id">User ID</Label>
            <Input
              id="user-id"
              placeholder="Voer je user ID in"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
          </div>

          <Button onClick={saveCredentials} disabled={saving || !accessToken || !userId}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Opslaan...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Credentials Opslaan
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Brand Synchronization */}
      {credentials && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Metricool Merken</CardTitle>
                <CardDescription>
                  Overzicht van gesynchroniseerde merken en hun platformen
                </CardDescription>
              </div>
              <Button onClick={syncBrands} disabled={syncing} variant="outline">
                {syncing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Synchroniseren...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Brands Synchroniseren
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {brands.length > 0 ? (
              <div className="space-y-4">
                {brands.map((brand) => (
                  <div key={brand.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{brand.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>Laatst gesynchroniseerd: {formatDate(brand.synced_at)}</span>
                        </div>
                      </div>
                      <Badge variant="secondary">
                        {brand.platforms?.length || 0} platformen
                      </Badge>
                    </div>
                    
                    {brand.platforms && brand.platforms.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {brand.platforms.map((platform, index) => (
                          <Badge key={index} variant="outline">
                            {platform}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  Nog geen merken gesynchroniseerd. Klik op "Brands Synchroniseren" om te beginnen.
                </p>
                <Button 
                  onClick={syncBrands} 
                  disabled={syncing}
                  variant="outline"
                >
                  {syncing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Synchroniseren...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Eerste Synchronisatie Starten
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}