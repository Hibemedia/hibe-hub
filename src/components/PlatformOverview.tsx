import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface PlatformData {
  platform: string;
  followers: number;
  growth: number;
  status: 'trending' | 'stable' | 'growing';
}

interface PlatformOverviewProps {
  selectedBlogId: number | null;
}

export function PlatformOverview({ selectedBlogId }: PlatformOverviewProps) {
  const [platformData, setPlatformData] = useState<PlatformData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedBlogId) {
      loadPlatformData();
    } else {
      setPlatformData([]);
    }
  }, [selectedBlogId]);

  const loadPlatformData = async () => {
    if (!selectedBlogId) return;

    setLoading(true);
    try {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 30);

      const startDate = start.toISOString().split('T')[0];
      const endDate = end.toISOString().split('T')[0];

      // Fetch followers data for each platform
      const platforms = [
        { name: 'TikTok', key: 'tiktok' },
        { name: 'Instagram', key: 'instagram' },
        { name: 'YouTube Shorts', key: 'youtube' }
      ];

      const platformPromises = platforms.map(async (platform) => {
        try {
          const { data, error } = await supabase.functions.invoke('metricool-stats', {
            body: {
              blogId: selectedBlogId,
              type: 'followers',
              start: startDate,
              end: endDate,
              platform: platform.key
            }
          });

          if (error) {
            console.error(`Error loading ${platform.name} data:`, error);
            return null;
          }

          if (data?.success && data.data && data.data.length > 0) {
            const latestData = data.data[data.data.length - 1];
            const previousData = data.data[data.data.length - 2];
            
            const currentValue = latestData.value || latestData.followers || 0;
            const prevValue = previousData?.value || previousData?.followers || 0;
            const growth = prevValue > 0 ? ((currentValue - prevValue) / prevValue) * 100 : 0;

            let status: 'trending' | 'stable' | 'growing' = 'stable';
            if (growth > 20) status = 'trending';
            else if (growth > 10) status = 'growing';

            return {
              platform: platform.name,
              followers: currentValue,
              growth: Math.round(growth),
              status
            };
          }
        } catch (err) {
          console.error(`Error loading ${platform.name} data:`, err);
        }
        return null;
      });

      const results = await Promise.all(platformPromises);
      const validData = results.filter(Boolean) as PlatformData[];
      setPlatformData(validData);
    } catch (err) {
      console.error('Error loading platform data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatFollowers = (count: number) => {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'M';
    } else if (count >= 1000) {
      return (count / 1000).toFixed(0) + 'K';
    }
    return count.toString();
  };

  const getBadgeColor = (status: string) => {
    switch (status) {
      case 'trending':
        return 'bg-black text-white';
      case 'stable':
        return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white';
      case 'growing':
        return 'bg-red-500 text-white';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'trending':
        return 'Trending';
      case 'stable':
        return 'Stabiel';
      case 'growing':
        return 'Groeiend';
      default:
        return 'Stabiel';
    }
  };

  if (!selectedBlogId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Platform Overzicht</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-muted-foreground">Selecteer een klant om platform data te zien</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Platform Overzicht</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-3 text-center py-6">
              <p className="text-muted-foreground">Laden van platform data...</p>
            </div>
          ) : platformData.length > 0 ? (
            platformData.map((platform, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{platform.platform}</h3>
                  <Badge className={getBadgeColor(platform.status)}>
                    {getStatusText(platform.status)}
                  </Badge>
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {formatFollowers(platform.followers)}
                </div>
                <p className="text-sm text-muted-foreground">
                  {platform.growth >= 0 ? '+' : ''}{platform.growth}% deze maand
                </p>
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center py-6">
              <p className="text-muted-foreground">Geen platform data beschikbaar</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}