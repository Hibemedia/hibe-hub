import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, Users, Calendar, BarChart3 } from "lucide-react";
import { ClientSelector } from "./ClientSelector";

interface StatData {
  date: string;
  value: number;
}

interface MetricoolStatsProps {
  className?: string;
}

export function MetricoolStats({ className }: MetricoolStatsProps) {
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [selectedMetric, setSelectedMetric] = useState<string>("followers");
  const [statsData, setStatsData] = useState<StatData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedBlogId, setSelectedBlogId] = useState<number | null>(null);
  const [selectedBrandName, setSelectedBrandName] = useState<string>("");
  const [dataSource, setDataSource] = useState<string>('');
  const [note, setNote] = useState<string>('');

  const metrics = [
    { value: "followers", label: "Volgers", icon: Users },
    { value: "engagement", label: "Engagement", icon: TrendingUp },
    { value: "performance", label: "Performance", icon: BarChart3 },
    { value: "overview", label: "Overzicht", icon: BarChart3 },
  ];

  useEffect(() => {
    if (selectedBlogId && selectedMetric) {
      loadStats();
    }
  }, [selectedBlogId, selectedMetric]);

  const loadStats = async () => {
    if (!selectedBlogId) return;

    setLoading(true);
    setError(null);
    
    try {
      // Get current date range (last 30 days)
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 30);

      const startDate = start.toISOString().split('T')[0];
      const endDate = end.toISOString().split('T')[0];

      const { data, error } = await supabase.functions.invoke('metricool-stats', {
        body: {
          blogId: selectedBlogId,
          type: selectedMetric,
          start: startDate,
          end: endDate
        }
      });

      if (error) {
        console.error('Error loading stats:', error);
        setError('Fout bij het laden van statistieken');
        return;
      }

      if (data.success && data.data) {
        // Transform the data to the expected format
        const transformedData: StatData[] = data.data.map((item: any) => ({
          date: item.date || item.timestamp,
          value: item.value || item.count || 0
        }));
        
        setStatsData(transformedData);
        setDataSource(data.source || 'unknown');
        setNote(data.note || '');
      } else {
        setError(data.error || 'Geen data beschikbaar');
      }
    } catch (err) {
      console.error('Error loading stats:', err);
      setError('Fout bij het laden van statistieken');
    } finally {
      setLoading(false);
    }
  };

  const handleClientSelect = (blogId: number, brandName: string) => {
    setSelectedBlogId(blogId);
    setSelectedBrandName(brandName);
    setSelectedClient(blogId.toString());
  };

  const formatValue = (value: number) => {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M';
    } else if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'K';
    }
    return value.toString();
  };

  const getLatestValue = () => {
    if (statsData.length === 0) return 0;
    return statsData[statsData.length - 1]?.value || 0;
  };

  const getGrowth = () => {
    if (statsData.length < 2) return 0;
    const latest = statsData[statsData.length - 1]?.value || 0;
    const previous = statsData[statsData.length - 2]?.value || 0;
    if (previous === 0) return 0;
    return ((latest - previous) / previous) * 100;
  };

  const selectedMetricData = metrics.find(m => m.value === selectedMetric);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Real-time Metricool Statistieken
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Client Selection */}
        <ClientSelector 
          onClientSelect={handleClientSelect}
          selectedClient={selectedClient}
        />

        {/* Metric Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Statistiek</label>
          <Select value={selectedMetric} onValueChange={setSelectedMetric}>
            <SelectTrigger>
              <SelectValue placeholder="Selecteer een statistiek" />
            </SelectTrigger>
            <SelectContent>
              {metrics.map((metric) => (
                <SelectItem key={metric.value} value={metric.value}>
                  <div className="flex items-center gap-2">
                    <metric.icon className="h-4 w-4" />
                    {metric.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stats Display */}
        {selectedBlogId && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{selectedBrandName}</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedMetricData?.label} - Laatste 30 dagen
                </p>
                {/* Data source indicator */}
                <div className="flex items-center gap-2 mt-2">
                  <Badge 
                    variant={dataSource === 'api' ? 'default' : 
                            dataSource === 'cached' ? 'secondary' : 'outline'}
                    className="text-xs"
                  >
                    {dataSource === 'api' ? '🟢 Live Data' :
                     dataSource === 'cached' ? '🔵 Cached Data' :
                     '🟠 Mock Data'}
                  </Badge>
                  {note && (
                    <span className="text-xs text-muted-foreground">
                      {note}
                    </span>
                  )}
                </div>
              </div>
              {statsData.length > 0 && (
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    {formatValue(getLatestValue())}
                  </div>
                  <Badge 
                    variant={getGrowth() >= 0 ? "default" : "destructive"}
                    className="text-xs"
                  >
                    {getGrowth() >= 0 ? '+' : ''}{getGrowth().toFixed(1)}%
                  </Badge>
                </div>
              )}
            </div>

            {loading && (
              <div className="text-center py-4">
                <div className="text-sm text-muted-foreground">Laden...</div>
              </div>
            )}

            {error && (
              <div className="text-center py-4">
                <div className="text-sm text-destructive">{error}</div>
              </div>
            )}

            {!loading && !error && statsData.length > 0 && (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {statsData.slice(-10).reverse().map((stat, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{new Date(stat.date).toLocaleDateString('nl-NL')}</span>
                    </div>
                    <div className="font-medium">{formatValue(stat.value)}</div>
                  </div>
                ))}
              </div>
            )}

            {!loading && !error && statsData.length === 0 && selectedBlogId && (
              <div className="text-center py-4">
                <div className="text-sm text-muted-foreground">
                  Geen data beschikbaar voor deze periode
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}