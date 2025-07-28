import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface MetricoolCredentials {
  access_token: string;
  user_id: string;
}

interface MetricoolBrand {
  id: string;
  brand_id: number;
  name: string;
  platforms: any; // JSON field from database
  synced_at: string;
}

export default function MetricoolAPI() {
  const [credentials, setCredentials] = useState<MetricoolCredentials | null>(null);
  const [brands, setBrands] = useState<MetricoolBrand[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);
  const { toast } = useToast();

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<MetricoolCredentials>();

  // Load existing credentials and brands
  useEffect(() => {
    loadCredentials();
    loadBrands();
  }, []);

  const loadCredentials = async () => {
    try {
      const { data, error } = await supabase
        .from('metricool_credentials')
        .select('access_token, user_id')
        .single();

      if (data && !error) {
        setCredentials(data);
        setValue('access_token', '***' + data.access_token.slice(-4));
        setValue('user_id', data.user_id);
      }
    } catch (error) {
      console.log('No existing credentials found');
    }
  };

  const loadBrands = async () => {
    try {
      const { data, error } = await supabase
        .from('metricool_brands')
        .select('*')
        .order('name');

      if (data && !error) {
        setBrands(data);
      }
    } catch (error) {
      console.error('Error loading brands:', error);
    }
  };

  const onSubmit = async (data: MetricoolCredentials) => {
    setIsLoading(true);
    try {
      // If access token is masked, use the existing one
      const tokenToSave = data.access_token.startsWith('***') 
        ? credentials?.access_token 
        : data.access_token;

      const { error } = await supabase
        .from('metricool_credentials')
        .upsert({
          singleton_check: true,
          access_token: tokenToSave || data.access_token,
          user_id: data.user_id
        });

      if (error) throw error;

      toast({
        title: "Succes",
        description: "Metricool credentials zijn opgeslagen",
      });

      loadCredentials();
    } catch (error: any) {
      toast({
        title: "Fout",
        description: `Kon credentials niet opslaan: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const syncBrands = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('sync-metricool-brands');
      
      if (error) throw error;

      setSyncResult(data);
      
      if (data?.success) {
        toast({
          title: "Synchronisatie succesvol",
          description: data.message,
        });
        loadBrands();
      } else {
        throw new Error(data?.error || 'Onbekende fout tijdens synchronisatie');
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Kon brands niet synchroniseren';
      toast({
        title: "Synchronisatie mislukt",
        description: errorMessage,
        variant: "destructive",
      });
      setSyncResult({ success: false, error: errorMessage });
    } finally {
      setIsSyncing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('nl-NL');
  };

  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      instagram: "bg-pink-100 text-pink-800",
      facebook: "bg-blue-100 text-blue-800", 
      tiktok: "bg-gray-100 text-gray-800",
      linkedin: "bg-blue-100 text-blue-800",
      youtube: "bg-red-100 text-red-800",
      twitter: "bg-sky-100 text-sky-800",
    };
    return colors[platform.toLowerCase()] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Metricool API</h1>
        <p className="text-muted-foreground">
          Beheer de Metricool API integratie en synchroniseer brands
        </p>
      </div>

      {/* Credentials Form */}
      <Card>
        <CardHeader>
          <CardTitle>API Credentials</CardTitle>
          <CardDescription>
            Stel de globale Metricool API credentials in. Deze worden gebruikt door alle admins.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="access_token">Access Token</Label>
              <Input
                id="access_token"
                type="password"
                placeholder="Voer je Metricool access token in"
                {...register('access_token', { required: 'Access token is verplicht' })}
              />
              {errors.access_token && (
                <p className="text-sm text-destructive">{errors.access_token.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="user_id">User ID</Label>
              <Input
                id="user_id"
                placeholder="Voer je Metricool user ID in"
                {...register('user_id', { required: 'User ID is verplicht' })}
              />
              {errors.user_id && (
                <p className="text-sm text-destructive">{errors.user_id.message}</p>
              )}
            </div>

            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Opslaan
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Sync Section */}
      <Card>
        <CardHeader>
          <CardTitle>Brands Synchronisatie</CardTitle>
          <CardDescription>
            Haal de nieuwste brands en platformen op uit Metricool
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={syncBrands} 
            disabled={isSyncing || !credentials}
            variant="outline"
          >
            {isSyncing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {!isSyncing && <RefreshCw className="mr-2 h-4 w-4" />}
            Synchroniseer Brands
          </Button>

          {!credentials && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Configureer eerst de API credentials voordat je kunt synchroniseren.
              </AlertDescription>
            </Alert>
          )}

          {syncResult && (
            <Alert variant={syncResult.success ? "default" : "destructive"}>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {syncResult.success ? syncResult.message : syncResult.error}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Brands List */}
      <Card>
        <CardHeader>
          <CardTitle>Gesynchroniseerde Brands</CardTitle>
          <CardDescription>
            Overzicht van alle brands opgehaald uit Metricool
          </CardDescription>
        </CardHeader>
        <CardContent>
          {brands.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nog geen brands gesynchroniseerd. Klik op "Synchroniseer Brands" om te beginnen.
            </p>
          ) : (
            <div className="space-y-4">
              {brands.map((brand) => (
                <div key={brand.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <h3 className="font-medium">{brand.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Brand ID: {brand.brand_id} • Gesynchroniseerd: {formatDate(brand.synced_at)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {brand.platforms?.map((platform) => (
                      <Badge 
                        key={platform} 
                        variant="secondary"
                        className={getPlatformColor(platform)}
                      >
                        {platform}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}