import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Filter, Calendar, Download } from 'lucide-react';
import { useAuth } from '@/lib/auth/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface SocialAccount {
  id: string;
  platform: string;
  account_name: string;
  account_id: string;
}

export default function Performance() {
  const { profile } = useAuth();
  const [selectedChannel, setSelectedChannel] = useState<string>('all');
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSocialAccounts = async () => {
      if (!profile?.metricool_brand_id) return;

      try {
        const { data, error } = await supabase
          .from('social_accounts')
          .select('*')
          .eq('brand_id', profile.metricool_brand_id);

        if (error) {
          console.error('Error fetching social accounts:', error);
          return;
        }

        setSocialAccounts(data || []);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSocialAccounts();
  }, [profile?.metricool_brand_id]);

  const getPlatformIcon = (platform: string) => {
    const icons: Record<string, string> = {
      instagram: '📷',
      tiktok: '🎵',
      youtube: '📺',
      facebook: '👥',
      twitter: '🐦',
      linkedin: '💼',
    };
    return icons[platform.toLowerCase()] || '📱';
  };

  const formatPlatformName = (platform: string) => {
    const names: Record<string, string> = {
      instagram: 'Instagram',
      tiktok: 'TikTok',
      youtube: 'YouTube',
      facebook: 'Facebook',
      twitter: 'Twitter',
      linkedin: 'LinkedIn',
    };
    return names[platform.toLowerCase()] || platform;
  };

  return (
    <div className="container mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Performance</h1>
          <p className="text-muted-foreground mt-1">
            Gedetailleerde prestatie-analyse van je content
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Periode
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Social Media Channel Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Selecteer kanaal</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <RadioGroup 
              value={selectedChannel} 
              onValueChange={setSelectedChannel}
              className="flex flex-wrap gap-4"
            >
              {/* All Channels Option */}
              <div className="flex items-center space-x-2 p-4 border rounded-lg hover:border-primary/50 transition-colors">
                <RadioGroupItem value="all" id="all" />
                <Label 
                  htmlFor="all" 
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <span className="text-2xl">📊</span>
                  <div>
                    <div className="font-medium">Alle kanalen</div>
                    <div className="text-sm text-muted-foreground">
                      Gecombineerde data van alle platforms
                    </div>
                  </div>
                </Label>
              </div>

              {/* Individual Social Accounts */}
              {socialAccounts.map((account) => (
                <div 
                  key={account.id} 
                  className="flex items-center space-x-2 p-4 border rounded-lg hover:border-primary/50 transition-colors"
                >
                  <RadioGroupItem value={account.id} id={account.id} />
                  <Label 
                    htmlFor={account.id} 
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <span className="text-2xl">
                      {getPlatformIcon(account.platform)}
                    </span>
                    <div>
                      <div className="font-medium">
                        {formatPlatformName(account.platform)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {account.account_name || account.account_id}
                      </div>
                    </div>
                  </Label>
                </div>
              ))}

              {socialAccounts.length === 0 && (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  Geen social media kanalen gevonden. 
                  Verbind eerst je accounts in de instellingen.
                </div>
              )}
            </RadioGroup>
          )}
        </CardContent>
      </Card>

      {/* Content will be added here based on selected channel */}
      {selectedChannel && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12 text-muted-foreground">
              <h3 className="text-lg font-medium mb-2">
                {selectedChannel === 'all' 
                  ? 'Alle kanalen geselecteerd' 
                  : `${socialAccounts.find(acc => acc.id === selectedChannel)?.platform} geselecteerd`
                }
              </h3>
              <p>Performance data wordt hier weergegeven...</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}