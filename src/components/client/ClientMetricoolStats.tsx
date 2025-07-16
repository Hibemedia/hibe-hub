import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, Users, Eye, Heart, MessageCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface MetricoolConfig {
  id: string;
  blog_id: number;
  brand_name: string;
  is_active: boolean;
}

interface MetricoolStats {
  overview: {
    total_followers: number;
    total_engagement: number;
    total_views: number;
    total_likes: number;
  };
  platforms: {
    [key: string]: {
      followers: number;
      engagement: number;
      views: number;
    };
  };
  top_videos: Array<{
    title: string;
    views: number;
    likes: number;
    platform: string;
  }>;
}

export const ClientMetricoolStats = () => {
  const [config, setConfig] = useState<MetricoolConfig | null>(null);
  const [stats, setStats] = useState<MetricoolStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchConfig = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('metricool_config')
        .select('*')
        .eq('user_id_ref', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setConfig(data);
    } catch (error) {
      console.error('Error fetching config:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!config) return;

    setStatsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('metricool-stats', {
        body: { 
          period: selectedPeriod,
          blog_id: config.blog_id
        }
      });

      if (error) throw error;

      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast({
        title: "Error",
        description: "Failed to load statistics",
        variant: "destructive"
      });
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, [user]);

  useEffect(() => {
    if (config) {
      fetchStats();
    }
  }, [config, selectedPeriod]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  if (loading) {
    return <div className="flex justify-center py-8">Loading configuration...</div>;
  }

  if (!config) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">
            No Metricool configuration found. Please contact your administrator.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <p className="text-muted-foreground">Brand: {config.brand_name}</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            onClick={fetchStats} 
            disabled={statsLoading}
            variant="outline"
          >
            {statsLoading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {statsLoading ? (
        <div className="flex justify-center py-8">Loading statistics...</div>
      ) : stats ? (
        <div className="space-y-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Followers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(stats.overview.total_followers)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Across all platforms
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(stats.overview.total_views)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Last {selectedPeriod} days
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Engagement</CardTitle>
                <Heart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(stats.overview.total_engagement)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Likes, comments, shares
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(stats.overview.total_likes)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Last {selectedPeriod} days
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Platform Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Platform Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(stats.platforms).map(([platform, data]) => (
                  <div key={platform} className="border rounded p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium capitalize">{platform}</h4>
                      <Badge variant="outline">{formatNumber(data.followers)} followers</Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Views:</span>
                        <span>{formatNumber(data.views)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Engagement:</span>
                        <span>{formatNumber(data.engagement)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Videos */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Videos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.top_videos.map((video, index) => (
                  <div key={index} className="flex items-center justify-between border rounded p-3">
                    <div className="flex-1">
                      <h4 className="font-medium">{video.title}</h4>
                      <p className="text-sm text-muted-foreground capitalize">
                        {video.platform}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatNumber(video.views)} views</div>
                      <div className="text-sm text-muted-foreground">
                        {formatNumber(video.likes)} likes
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">
              No statistics available. Click refresh to load data.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};