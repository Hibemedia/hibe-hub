import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Eye, Heart, MessageCircle, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

import videoThumb1 from "@/assets/video-thumb-1.jpg";
import videoThumb2 from "@/assets/video-thumb-2.jpg";
import videoThumb3 from "@/assets/video-thumb-3.jpg";
import videoThumb4 from "@/assets/video-thumb-4.jpg";
import videoThumb5 from "@/assets/video-thumb-5.jpg";

interface Video {
  id: string;
  title: string;
  platform: string;
  views: number;
  likes: number;
  comments: number;
  thumbnail?: string;
  created_at: string;
}

const fallbackThumbnails = [videoThumb1, videoThumb2, videoThumb3, videoThumb4, videoThumb5];

interface TopVideosProps {
  selectedBlogId: number | null;
  selectedBrandName: string;
}

export function TopVideos({ selectedBlogId, selectedBrandName }: TopVideosProps) {
  const [selectedMonth, setSelectedMonth] = useState("december-2024");
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const months = [
    { value: "december-2024", label: "December 2024" },
    { value: "november-2024", label: "November 2024" },
    { value: "oktober-2024", label: "Oktober 2024" },
    { value: "september-2024", label: "September 2024" },
    { value: "augustus-2024", label: "Augustus 2024" },
    { value: "juli-2024", label: "Juli 2024" }
  ];

  useEffect(() => {
    if (selectedBlogId && selectedMonth) {
      loadTopVideos();
    }
  }, [selectedBlogId, selectedMonth]);

  const loadTopVideos = async () => {
    if (!selectedBlogId) return;

    setLoading(true);
    setError(null);

    try {
      // Get date range for selected month
      const [month, year] = selectedMonth.split('-');
      const monthIndex = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 
                         'juli', 'augustus', 'september', 'oktober', 'november', 'december'].indexOf(month);
      
      const start = new Date(parseInt(year), monthIndex, 1);
      const end = new Date(parseInt(year), monthIndex + 1, 0);

      const startDate = start.toISOString().split('T')[0];
      const endDate = end.toISOString().split('T')[0];

      const { data, error } = await supabase.functions.invoke('metricool-stats', {
        body: {
          blogId: selectedBlogId,
          type: 'top-videos',
          start: startDate,
          end: endDate
        }
      });

      if (error) {
        console.error('Error loading top videos:', error);
        setError('Fout bij het laden van video\'s');
        return;
      }

      if (data.success && data.data) {
        // Transform the data to match our interface
        const transformedVideos: Video[] = data.data.slice(0, 5).map((video: any, index: number) => ({
          id: video.id || `video-${index}`,
          title: video.title || video.caption || 'Geen titel',
          platform: video.platform || 'Onbekend',
          views: video.views || video.impressions || 0,
          likes: video.likes || video.reactions || 0,
          comments: video.comments || 0,
          thumbnail: video.thumbnail || fallbackThumbnails[index % fallbackThumbnails.length],
          created_at: video.created_at || video.publish_date || new Date().toISOString()
        }));
        
        setVideos(transformedVideos);
      } else {
        setError('Geen video\'s gevonden voor deze periode');
      }
    } catch (err) {
      console.error('Error loading top videos:', err);
      setError('Fout bij het laden van video\'s');
    } finally {
      setLoading(false);
    }
  };


  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'tiktok':
        return 'bg-black text-white';
      case 'instagram':
        return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white';
      case 'youtube':
        return 'bg-red-500 text-white';
      case 'facebook':
        return 'bg-blue-600 text-white';
      case 'twitter':
        return 'bg-sky-500 text-white';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Play className="h-4 w-4 text-primary" />
            Top 5 Video's deze maand
          </CardTitle>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-36">
              <Calendar className="h-3 w-3 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="pt-0">

        {/* Videos List */}
        <div className="space-y-2">
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

          {!loading && !error && videos.length === 0 && selectedBlogId && (
            <div className="text-center py-4">
              <div className="text-sm text-muted-foreground">
                Geen video's gevonden voor deze periode
              </div>
            </div>
          )}

          {!loading && !error && videos.length > 0 && (
            <>
              {videos.map((video, index) => (
                <div key={video.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-center w-6 h-6 bg-muted rounded-full text-xs font-bold">
                    {index + 1}
                  </div>
                  <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0">
                    <img 
                      src={video.thumbnail} 
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm text-foreground truncate">{video.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={`${getPlatformColor(video.platform)} text-xs px-1 py-0`}>
                        {video.platform}
                      </Badge>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="h-2 w-2" />
                          {formatNumber(video.views)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="h-2 w-2" />
                          {formatNumber(video.likes)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}

          {!selectedBlogId && (
            <div className="text-center py-4">
              <div className="text-sm text-muted-foreground">
                Selecteer een klant om de top video's te zien
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}