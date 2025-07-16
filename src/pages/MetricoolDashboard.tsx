import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { CalendarIcon, TrendingUp, Users, Eye, Heart, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricData {
  metric_date: string;
  metric_value: number;
  metric_name: string;
  platform: string;
}

interface PostData {
  post_id: string;
  platform: string;
  post_type: string;
  caption: string;
  published_at: string;
  metrics: any;
}

export default function MetricoolDashboard() {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date()
  });
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");
  const [metrics, setMetrics] = useState<MetricData[]>([]);
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    loadData();
  }, [dateRange, selectedPlatform]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load metrics
      let metricsQuery = supabase
        .from('metricool_metrics')
        .select('*')
        .eq('client_id', user.id)
        .gte('metric_date', dateRange.from.toISOString().split('T')[0])
        .lte('metric_date', dateRange.to.toISOString().split('T')[0]);

      if (selectedPlatform !== "all") {
        metricsQuery = metricsQuery.eq('platform', selectedPlatform);
      }

      const { data: metricsData, error: metricsError } = await metricsQuery;

      if (metricsError) {
        console.error('Error loading metrics:', metricsError);
      } else {
        setMetrics(metricsData || []);
      }

      // Load posts
      let postsQuery = supabase
        .from('metricool_posts')
        .select('*')
        .eq('client_id', user.id)
        .gte('published_at', dateRange.from.toISOString())
        .lte('published_at', dateRange.to.toISOString());

      if (selectedPlatform !== "all") {
        postsQuery = postsQuery.eq('platform', selectedPlatform);
      }

      const { data: postsData, error: postsError } = await postsQuery;

      if (postsError) {
        console.error('Error loading posts:', postsError);
      } else {
        setPosts(postsData || []);
      }

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatChartData = (metricName: string) => {
    const filteredData = metrics.filter(m => m.metric_name === metricName);
    
    const chartData = filteredData.map(item => ({
      date: format(new Date(item.metric_date), 'dd MMM', { locale: nl }),
      value: item.metric_value,
      fullDate: item.metric_date
    }));

    return chartData.sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime());
  };

  const getMetricIcon = (metricName: string) => {
    if (metricName.includes('Followers') || metricName.includes('subscribers')) {
      return <Users className="h-4 w-4" />;
    }
    if (metricName.includes('Views') || metricName.includes('views')) {
      return <Eye className="h-4 w-4" />;
    }
    if (metricName.includes('Likes') || metricName.includes('likes')) {
      return <Heart className="h-4 w-4" />;
    }
    return <TrendingUp className="h-4 w-4" />;
  };

  const getLatestValue = (metricName: string) => {
    const filteredData = metrics.filter(m => m.metric_name === metricName);
    if (filteredData.length === 0) return 0;
    
    const latest = filteredData.reduce((latest, current) => 
      new Date(current.metric_date) > new Date(latest.metric_date) ? current : latest
    );
    
    return latest.metric_value;
  };

  const getPlatformColor = (platform: string) => {
    const colors = {
      instagram: '#E4405F',
      tiktok: '#000000',
      facebook: '#1877F2',
      linkedin: '#0A66C2',
      youtube: '#FF0000'
    };
    return colors[platform] || '#6B7280';
  };

  const uniqueMetrics = [...new Set(metrics.map(m => m.metric_name))];
  const platforms = [...new Set(metrics.map(m => m.platform))];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Social Media Analytics</h1>
        
        <div className="flex gap-2">
          <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Platforms</SelectItem>
              {platforms.map(platform => (
                <SelectItem key={platform} value={platform}>
                  {platform.charAt(0).toUpperCase() + platform.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-80 justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.from && dateRange.to ? (
                  `${format(dateRange.from, 'dd MMM yyyy', { locale: nl })} - ${format(dateRange.to, 'dd MMM yyyy', { locale: nl })}`
                ) : (
                  <span>Selecteer periode</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange.from}
                selected={dateRange}
                onSelect={(range) => range?.from && range?.to && setDateRange({ from: range.from, to: range.to })}
                numberOfMonths={2}
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overzicht</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="posts">Posts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="animate-pulse">
                      <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                      <div className="h-8 bg-muted rounded w-1/2"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {uniqueMetrics.slice(0, 8).map((metric) => (
                <Card key={metric}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">{metric}</p>
                        <p className="text-2xl font-bold">{getLatestValue(metric).toLocaleString()}</p>
                      </div>
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        {getMetricIcon(metric)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {uniqueMetrics.map((metric) => (
              <Card key={metric}>
                <CardHeader>
                  <CardTitle className="text-lg">{metric}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={formatChartData(metric)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value) => [value.toLocaleString(), metric]}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="value" 
                          stroke="#2563eb" 
                          strokeWidth={2}
                          dot={{ fill: '#2563eb' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="posts" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {posts.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">Geen posts gevonden voor de geselecteerde periode</p>
                </CardContent>
              </Card>
            ) : (
              posts.map((post) => (
                <Card key={post.post_id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge 
                            variant="secondary" 
                            style={{ 
                              backgroundColor: `${getPlatformColor(post.platform)}20`,
                              color: getPlatformColor(post.platform)
                            }}
                          >
                            {post.platform}
                          </Badge>
                          <Badge variant="outline">{post.post_type}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(post.published_at), 'dd MMM yyyy HH:mm', { locale: nl })}
                          </span>
                        </div>
                        <p className="text-sm mb-3 line-clamp-3">{post.caption}</p>
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          {post.metrics.views && (
                            <div className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {post.metrics.views.toLocaleString()}
                            </div>
                          )}
                          {post.metrics.likes && (
                            <div className="flex items-center gap-1">
                              <Heart className="h-3 w-3" />
                              {post.metrics.likes.toLocaleString()}
                            </div>
                          )}
                          {post.metrics.comments && (
                            <div className="flex items-center gap-1">
                              <MessageCircle className="h-3 w-3" />
                              {post.metrics.comments.toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}