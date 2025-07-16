import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Eye, Heart, MessageCircle, Calendar } from "lucide-react";
import { useState } from "react";

const topVideos = [
  {
    id: 1,
    title: "Beste kniptechnieken voor krullend haar",
    platform: "TikTok",
    views: "125K",
    likes: "8.2K",
    comments: "342",
    thumbnail: "🎬"
  },
  {
    id: 2,
    title: "Barbershop morning routine",
    platform: "Instagram",
    views: "89K",
    likes: "5.1K",
    comments: "198",
    thumbnail: "🎬"
  },
  {
    id: 3,
    title: "Fade tutorial voor beginners",
    platform: "YouTube",
    views: "67K",
    likes: "4.3K",
    comments: "156",
    thumbnail: "🎬"
  },
  {
    id: 4,
    title: "Trending kapsel deze week",
    platform: "TikTok",
    views: "45K",
    likes: "2.8K",
    comments: "89",
    thumbnail: "🎬"
  },
  {
    id: 5,
    title: "Grooming tips voor mannen",
    platform: "Instagram",
    views: "32K",
    likes: "1.9K",
    comments: "67",
    thumbnail: "🎬"
  }
];

export function TopVideos() {
  const [selectedMonth, setSelectedMonth] = useState("december-2024");

  const months = [
    { value: "december-2024", label: "December 2024" },
    { value: "november-2024", label: "November 2024" },
    { value: "oktober-2024", label: "Oktober 2024" },
    { value: "september-2024", label: "September 2024" },
    { value: "augustus-2024", label: "Augustus 2024" },
    { value: "juli-2024", label: "Juli 2024" }
  ];

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'TikTok':
        return 'bg-black text-white';
      case 'Instagram':
        return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white';
      case 'YouTube':
        return 'bg-red-500 text-white';
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
        <div className="space-y-2">
          {topVideos.map((video, index) => (
            <div key={video.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-center w-6 h-6 bg-muted rounded-full text-xs font-bold">
                {index + 1}
              </div>
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center text-lg">
                {video.thumbnail}
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
                      {video.views}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="h-2 w-2" />
                      {video.likes}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}