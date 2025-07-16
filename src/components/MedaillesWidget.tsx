import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, Star, Target, TrendingUp, Users, Eye } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Medal {
  id: number;
  title: string;
  description: string;
  icon: any;
  achieved: boolean;
  achievedDate?: string;
  progress?: number;
  rarity: string;
  threshold: number;
  currentValue: number;
}

interface PerformanceData {
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  engagementRate: number;
  followerGrowth: number;
  topVideoViews: number;
  averageViews: number;
  contentFrequency: number;
}

interface MedaillesWidgetProps {
  selectedBlogId: number | null;
  selectedBrandName: string;
}

export function MedaillesWidget({ selectedBlogId, selectedBrandName }: MedaillesWidgetProps) {
  const [medals, setMedals] = useState<Medal[]>([]);
  const [loading, setLoading] = useState(false);
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);

  // Define medal thresholds
  const createMedals = (data: PerformanceData): Medal[] => [
    {
      id: 1,
      title: "100K Views",
      description: "Eerste video met 100.000+ views",
      icon: Eye,
      achieved: data.topVideoViews >= 100000,
      achievedDate: data.topVideoViews >= 100000 ? new Date().toISOString() : undefined,
      rarity: "gold",
      threshold: 100000,
      currentValue: data.topVideoViews,
      progress: Math.min((data.topVideoViews / 100000) * 100, 100)
    },
    {
      id: 2,
      title: "Engagement King",
      description: "10%+ engagement rate behaald",
      icon: Users,
      achieved: data.engagementRate >= 10,
      achievedDate: data.engagementRate >= 10 ? new Date().toISOString() : undefined,
      rarity: "silver",
      threshold: 10,
      currentValue: data.engagementRate,
      progress: Math.min((data.engagementRate / 10) * 100, 100)
    },
    {
      id: 3,
      title: "Trending Star",
      description: "50K+ gemiddelde views",
      icon: TrendingUp,
      achieved: data.averageViews >= 50000,
      achievedDate: data.averageViews >= 50000 ? new Date().toISOString() : undefined,
      rarity: "bronze",
      threshold: 50000,
      currentValue: data.averageViews,
      progress: Math.min((data.averageViews / 50000) * 100, 100)
    },
    {
      id: 4,
      title: "Viral Hit",
      description: "1 miljoen views bereikt",
      icon: Target,
      achieved: data.totalViews >= 1000000,
      achievedDate: data.totalViews >= 1000000 ? new Date().toISOString() : undefined,
      rarity: "platinum",
      threshold: 1000000,
      currentValue: data.totalViews,
      progress: Math.min((data.totalViews / 1000000) * 100, 100)
    },
    {
      id: 5,
      title: "Consistency Master",
      description: "30+ posts deze maand",
      icon: Star,
      achieved: data.contentFrequency >= 30,
      achievedDate: data.contentFrequency >= 30 ? new Date().toISOString() : undefined,
      rarity: "gold",
      threshold: 30,
      currentValue: data.contentFrequency,
      progress: Math.min((data.contentFrequency / 30) * 100, 100)
    }
  ];

  useEffect(() => {
    if (selectedBlogId) {
      loadPerformanceData();
    }
  }, [selectedBlogId]);

  const loadPerformanceData = async () => {
    if (!selectedBlogId) return;

    setLoading(true);

    try {
      // Get performance data for the current month
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const startDate = start.toISOString().split('T')[0];
      const endDate = end.toISOString().split('T')[0];

      const { data, error } = await supabase.functions.invoke('metricool-stats', {
        body: {
          blogId: selectedBlogId,
          type: 'performance',
          start: startDate,
          end: endDate
        }
      });

      if (error) {
        console.error('Error loading performance data:', error);
        return;
      }

      if (data.success && data.data) {
        // Transform the data to match our interface
        const perfData: PerformanceData = {
          totalViews: data.data.totalViews || 0,
          totalLikes: data.data.totalLikes || 0,
          totalComments: data.data.totalComments || 0,
          engagementRate: data.data.engagementRate || 0,
          followerGrowth: data.data.followerGrowth || 0,
          topVideoViews: data.data.topVideoViews || 0,
          averageViews: data.data.averageViews || 0,
          contentFrequency: data.data.contentFrequency || 0
        };

        setPerformanceData(perfData);
        setMedals(createMedals(perfData));
      }
    } catch (err) {
      console.error('Error loading performance data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'platinum':
        return 'bg-gradient-to-r from-purple-400 to-purple-600 text-white';
      case 'gold':
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
      case 'silver':
        return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
      case 'bronze':
        return 'bg-gradient-to-r from-orange-400 to-orange-600 text-white';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const achievedMedals = medals.filter(medal => medal.achieved);
  const inProgressMedals = medals.filter(medal => !medal.achieved);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5 text-accent" />
          Medailles - {selectedBrandName}
          <Badge variant="default" className="ml-auto">
            {achievedMedals.length}/{medals.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="text-center py-4">
            <div className="text-sm text-muted-foreground">Laden...</div>
          </div>
        )}

        {!loading && !selectedBlogId && (
          <div className="text-center py-4">
            <div className="text-sm text-muted-foreground">
              Selecteer een klant om medailles te zien
            </div>
          </div>
        )}

        {!loading && selectedBlogId && medals.length > 0 && (
          <div className="space-y-4">
            {/* Achieved Medals */}
            {achievedMedals.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Behaald</h4>
                <div className="grid grid-cols-3 gap-2">
                  {achievedMedals.map((medal) => (
                    <div key={medal.id} className="text-center p-2 border rounded-lg bg-muted/20">
                      <div className={`w-8 h-8 rounded-full mx-auto mb-1 flex items-center justify-center ${getRarityColor(medal.rarity)}`}>
                        <medal.icon className="h-4 w-4" />
                      </div>
                      <p className="text-xs font-medium truncate">{medal.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {medal.achievedDate && new Date(medal.achievedDate).toLocaleDateString('nl-NL', { 
                          day: 'numeric', 
                          month: 'short' 
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* In Progress */}
            {inProgressMedals.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">In Progress</h4>
                <div className="space-y-2">
                  {inProgressMedals.map((medal) => (
                    <div key={medal.id} className="flex items-center gap-3 p-2 border rounded-lg">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center opacity-60 ${getRarityColor(medal.rarity)}`}>
                        <medal.icon className="h-3 w-3" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{medal.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-1 bg-muted rounded-full">
                            <div 
                              className="h-1 bg-primary rounded-full transition-all duration-500"
                              style={{ width: `${medal.progress || 0}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">{Math.round(medal.progress || 0)}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}