import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Eye, Heart, MessageCircle } from "lucide-react";

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
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="h-5 w-5 text-primary" />
          Top 5 Best Presterende Video's
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {topVideos.map((video, index) => (
            <div key={video.id} className="flex items-center gap-4 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-center w-8 h-8 bg-muted rounded-full text-sm font-bold">
                {index + 1}
              </div>
              <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center text-2xl">
                {video.thumbnail}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-foreground truncate">{video.title}</h4>
                <Badge className={getPlatformColor(video.platform)}>
                  {video.platform}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {video.views}
                </div>
                <div className="flex items-center gap-1">
                  <Heart className="h-3 w-3" />
                  {video.likes}
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="h-3 w-3" />
                  {video.comments}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}