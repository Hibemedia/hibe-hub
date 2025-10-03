import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface RealtimeMetricCardProps {
  title: string;
  metricType: 'followers' | 'engagement' | 'performance' | 'overview';
  icon: LucideIcon;
  className?: string;
  selectedBlogId: number | null;
  selectedBrandName: string;
}

export function RealtimeMetricCard({ 
  title, 
  metricType,
  icon: Icon,
  className,
  selectedBlogId,
  selectedBrandName
}: RealtimeMetricCardProps) {
  const [value, setValue] = useState<string>("0");
  const [change, setChange] = useState<string>("+0%");
  const [changeType, setChangeType] = useState<'positive' | 'negative' | 'neutral'>('neutral');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedBlogId) {
      loadMetricData();
    }
  }, [selectedBlogId, metricType]);

  const loadMetricData = async () => {
    if (!selectedBlogId) return;

    setLoading(true);
    setError(null);
    
    try {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 30);

      const startDate = start.toISOString().split('T')[0];
      const endDate = end.toISOString().split('T')[0];

      console.log(`Loading ${metricType} data for blog ${selectedBlogId} (${selectedBrandName})`);

      const { data, error } = await supabase.functions.invoke('metricool-stats', {
        body: {
          blogId: selectedBlogId,
          type: metricType,
          start: startDate,
          end: endDate
        }
      });

      if (error) {
        console.error(`Error loading ${metricType} data:`, error);
        setError(`API Error: ${error.message || 'Unknown error'}`);
        return;
      }

      if (!data || !data.success) {
        console.error(`Invalid response for ${metricType}:`, data);
        setError(data?.error || 'Invalid response from API');
        return;
      }

      console.log(`${metricType} data loaded successfully:`, data);

      if (data.data && Array.isArray(data.data) && data.data.length > 0) {
        const latestData = data.data[data.data.length - 1];
        const previousData = data.data[data.data.length - 2];

        if (latestData) {
          const currentValue = latestData.value || latestData.count || 0;
          setValue(formatValue(currentValue));

          if (previousData) {
            const prevValue = previousData.value || previousData.count || 0;
            const growth = prevValue > 0 ? ((currentValue - prevValue) / prevValue) * 100 : 0;
            setChange(`${growth >= 0 ? '+' : ''}${growth.toFixed(1)}% vs vorige periode`);
            setChangeType(growth >= 0 ? 'positive' : 'negative');
          }
        }
      } else {
        console.warn(`No data available for ${metricType}`);
        setError('Geen data beschikbaar');
      }
    } catch (err) {
      console.error(`Error loading ${metricType} data:`, err);
      setError(`Fout bij laden: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const formatValue = (value: number) => {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M';
    } else if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'K';
    }
    return value.toString();
  };

  const getChangeColor = () => {
    switch (changeType) {
      case 'positive':
        return 'text-success';
      case 'negative':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <Card className={cn("hover:shadow-md transition-shadow duration-200", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">
          {loading ? "..." : error ? "Error" : value}
        </div>
        <p className={cn("text-xs", error ? "text-destructive" : getChangeColor())}>
          {loading ? "Laden..." : error ? error : change}
        </p>
      </CardContent>
    </Card>
  );
}