import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Save, ExternalLink } from "lucide-react";

interface MetricoolCredentials {
  id: string;
  access_token: string;
  user_id: string;
}

interface MetricoolBrand {
  id: string;
  name: string;
  platforms: {
    id: string;
    name: string;
    type: string;
  }[];
}

export default function MetricoolAPI() {
  const { hasRole } = useAuth();
  const [credentials, setCredentials] = useState<MetricoolCredentials | null>(null);
  const [accessToken, setAccessToken] = useState("");
  const [userId, setUserId] = useState("");
  const [brands, setBrands] = useState<MetricoolBrand[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fetchingBrands, setFetchingBrands] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  // Load existing credentials - always call this hook
  useEffect(() => {
    if (hasRole('admin')) {
      loadCredentials();
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
        // Auto-fetch brands if credentials exist
        fetchBrands(data.access_token, data.user_id);
      }
    } catch (error) {
      console.error('Error loading credentials:', error);
    } finally {
      setLoading(false);
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
        // Update existing
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
        // Insert new
        result = await supabase
          .from('metricool_credentials')
          .insert({
            access_token: accessToken,
            user_id: userId
          })
          .select()
          .single();
      }

      if (result.error) {
        throw result.error;
      }

      setCredentials(result.data);
      toast.success("Credentials succesvol opgeslagen");
      
      // Fetch brands with new credentials
      fetchBrands(accessToken, userId);
    } catch (error) {
      console.error('Error saving credentials:', error);
      toast.error("Fout bij opslaan van credentials");
    } finally {
      setSaving(false);
    }
  };

  const fetchBrands = async (token: string, uid: string) => {
    setFetchingBrands(true);
    setBrands([]);
    setDebugInfo(null);
    
    const fetchUrl = `https://app.metricool.com/api/v1/brands?userId=${uid}`;
    
    try {
      const response = await fetch(fetchUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setDebugInfo({
        url: fetchUrl,
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
        requestHeaders: {
          'Authorization': `Bearer ${token.slice(0, 10)}...`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        if (response.status === 403) {
          errorMessage += ' - Toegang geweigerd. Controleer je toegangstoken.';
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      setDebugInfo(prev => ({ ...prev, responseData: data }));
      
      if (data.success && data.data) {
        setBrands(data.data);
        toast.success(`${data.data.length} merken gevonden`);
      } else {
        throw new Error('Ongeldig response formaat');
      }
    } catch (error) {
      console.error('Error fetching brands:', error);
      
      let userFriendlyError = error.message;
      let isCorsError = false;
      
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        userFriendlyError = 'CORS Error: De Metricool API blokkeert verzoeken vanuit de browser. Dit is een beveiligingsmaatregel van Metricool.';
        isCorsError = true;
      } else if (error.message.includes('403')) {
        userFriendlyError = 'De Metricool API reageerde met een fout (403 Forbidden). Controleer je toegangstoken of probeer het later opnieuw.';
      }
      
      setDebugInfo(prev => ({ 
        ...prev, 
        error: error.message,
        errorType: error.name,
        isCorsError,
        userFriendlyError
      }));
      
      toast.error(userFriendlyError);
    } finally {
      setFetchingBrands(false);
    }
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
          Beheer Metricool API credentials en bekijk gekoppelde merken
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

      {/* Brand Validation */}
      {credentials && (
        <Card>
          <CardHeader>
            <CardTitle>Gekoppelde Merken</CardTitle>
            <CardDescription>
              Overzicht van beschikbare merken en hun platformen
            </CardDescription>
          </CardHeader>
          <CardContent>
            {fetchingBrands ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Merken ophalen...</span>
              </div>
            ) : brands.length > 0 ? (
              <div className="space-y-4">
                {brands.map((brand) => (
                  <div key={brand.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-lg">{brand.name}</h3>
                      <Badge variant="secondary">
                        {brand.platforms?.length || 0} platformen
                      </Badge>
                    </div>
                    
                    {brand.platforms && brand.platforms.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {brand.platforms.map((platform) => (
                          <Badge key={platform.id} variant="outline">
                            {platform.name}
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
                  Nog geen merken gevonden. Controleer je credentials.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => fetchBrands(accessToken, userId)}
                  disabled={!accessToken || !userId}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Opnieuw proberen
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Debug Information */}
      {debugInfo && (
        <Card>
          <CardHeader>
            <CardTitle>Debug Informatie</CardTitle>
            <CardDescription>
              Technische details van de laatste API-call
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm font-mono">
              <div>
                <strong>URL:</strong> {debugInfo.url}
              </div>
              <div>
                <strong>Status:</strong> {debugInfo.status} ({debugInfo.statusText})
              </div>
              <div>
                <strong>Success:</strong> {debugInfo.ok ? 'Ja' : 'Nee'}
              </div>
              {debugInfo.error && (
                <div className="text-red-600">
                  <strong>Error:</strong> {debugInfo.error} ({debugInfo.errorType})
                </div>
              )}
              {debugInfo.responseData && (
                <div>
                  <strong>Response Data:</strong>
                  <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                    {JSON.stringify(debugInfo.responseData, null, 2)}
                  </pre>
                </div>
              )}
              {debugInfo.headers && (
                <div>
                  <strong>Response Headers:</strong>
                  <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                    {JSON.stringify(debugInfo.headers, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}