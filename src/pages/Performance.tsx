import { useState } from "react";
import { MetricCard } from "@/components/MetricCard";
import { AIInsightsWidget } from "@/components/AIInsightsWidget";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { 
  Eye, 
  Heart, 
  MousePointer, 
  TrendingUp, 
  Download,
  BarChart3,
  Calendar,
  Filter,
  Play,
  MessageCircle,
  ExternalLink
} from "lucide-react";
import videoThumb1 from "@/assets/video-thumb-1.jpg";
import videoThumb2 from "@/assets/video-thumb-2.jpg";
import videoThumb3 from "@/assets/video-thumb-3.jpg";
import videoThumb4 from "@/assets/video-thumb-4.jpg";
import videoThumb5 from "@/assets/video-thumb-5.jpg";

// Sample data for daily performance (not cumulative)
const dailyData = [
  { day: '1', TikTok: 2400, Instagram: 1800, YouTube: 1200, Facebook: 600 },
  { day: '2', TikTok: 1900, Instagram: 1500, YouTube: 900, Facebook: 450 },
  { day: '3', TikTok: 3200, Instagram: 2100, YouTube: 1400, Facebook: 700 },
  { day: '4', TikTok: 2800, Instagram: 1900, YouTube: 1100, Facebook: 550 },
  { day: '5', TikTok: 4500, Instagram: 2800, YouTube: 1800, Facebook: 900 }, // Video viral
  { day: '6', TikTok: 2100, Instagram: 1600, YouTube: 1000, Facebook: 500 },
  { day: '7', TikTok: 3800, Instagram: 2400, YouTube: 1600, Facebook: 800 },
  { day: '8', TikTok: 2600, Instagram: 1700, YouTube: 1100, Facebook: 550 },
  { day: '9', TikTok: 2900, Instagram: 1800, YouTube: 1200, Facebook: 600 },
  { day: '10', TikTok: 3400, Instagram: 2200, YouTube: 1500, Facebook: 750 },
  { day: '11', TikTok: 2700, Instagram: 1700, YouTube: 1100, Facebook: 550 },
  { day: '12', TikTok: 6200, Instagram: 3800, YouTube: 2400, Facebook: 1200 }, // Grote piek
  { day: '13', TikTok: 3100, Instagram: 2000, YouTube: 1300, Facebook: 650 },
  { day: '14', TikTok: 2800, Instagram: 1900, YouTube: 1200, Facebook: 600 },
  { day: '15', TikTok: 4100, Instagram: 2600, YouTube: 1700, Facebook: 850 },
  { day: '16', TikTok: 2300, Instagram: 1500, YouTube: 1000, Facebook: 500 },
  { day: '17', TikTok: 3600, Instagram: 2300, YouTube: 1500, Facebook: 750 },
  { day: '18', TikTok: 2900, Instagram: 1800, YouTube: 1200, Facebook: 600 },
  { day: '19', TikTok: 5100, Instagram: 3200, YouTube: 2100, Facebook: 1050 }, // Instagram piek
  { day: '20', TikTok: 2700, Instagram: 1700, YouTube: 1100, Facebook: 550 },
  { day: '21', TikTok: 3300, Instagram: 2100, YouTube: 1400, Facebook: 700 },
  { day: '22', TikTok: 2600, Instagram: 1600, YouTube: 1000, Facebook: 500 },
  { day: '23', TikTok: 4200, Instagram: 2700, YouTube: 1800, Facebook: 900 },
  { day: '24', TikTok: 2800, Instagram: 1800, YouTube: 1200, Facebook: 600 },
  { day: '25', TikTok: 3700, Instagram: 2300, YouTube: 1500, Facebook: 750 },
  { day: '26', TikTok: 2400, Instagram: 1500, YouTube: 1000, Facebook: 500 },
  { day: '27', TikTok: 3900, Instagram: 2400, YouTube: 1600, Facebook: 800 },
  { day: '28', TikTok: 7300, Instagram: 4500, YouTube: 2900, Facebook: 1450 }, // Mega viral day
  { day: '29', TikTok: 3200, Instagram: 2000, YouTube: 1300, Facebook: 650 },
  { day: '30', TikTok: 2900, Instagram: 1800, YouTube: 1200, Facebook: 600 },
  { day: '31', TikTok: 3400, Instagram: 2200, YouTube: 1500, Facebook: 750 }
];

const performanceVideos = [
  {
    id: 1,
    title: "Beste kniptechnieken voor krullend haar",
    platform: "TikTok",
    views: "125K",
    likes: "8.2K",
    comments: "342",
    ctr: "4.2%",
    engagement: "12.8%",
    thumbnail: videoThumb1,
    url: "https://tiktok.com/video/1"
  },
  {
    id: 2,
    title: "Barbershop morning routine",
    platform: "Instagram",
    views: "89K",
    likes: "5.1K",
    comments: "198",
    ctr: "2.8%",
    engagement: "9.2%",
    thumbnail: videoThumb2,
    url: "https://instagram.com/reel/2"
  },
  {
    id: 3,
    title: "Fade tutorial voor beginners",
    platform: "YouTube",
    views: "67K",
    likes: "4.3K",
    comments: "156",
    ctr: "3.1%",
    engagement: "7.6%",
    thumbnail: videoThumb3,
    url: "https://youtube.com/watch?v=3"
  },
  {
    id: 4,
    title: "Trending kapsel deze week",
    platform: "TikTok",
    views: "45K",
    likes: "2.8K",
    comments: "89",
    ctr: "4.5%",
    engagement: "13.1%",
    thumbnail: videoThumb4,
    url: "https://tiktok.com/video/4"
  },
  {
    id: 5,
    title: "Grooming tips voor mannen",
    platform: "Instagram",
    views: "32K",
    likes: "1.9K",
    comments: "67",
    ctr: "3.0%",
    engagement: "8.5%",
    thumbnail: videoThumb5,
    url: "https://instagram.com/reel/5"
  }
];

export default function Performance() {
  const [selectedMonth, setSelectedMonth] = useState("december-2024");
  const [activePlatforms, setActivePlatforms] = useState({
    TikTok: true,
    Instagram: true,
    YouTube: true,
    Facebook: true
  });

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

  const handleVideoClick = (url: string) => {
    window.open(url, '_blank');
  };

  const platformColors = {
    TikTok: "#000000",
    Instagram: "#E1306C", 
    YouTube: "#FF0000",
    Facebook: "#1877F2"
  };

  const togglePlatform = (platform: string) => {
    setActivePlatforms(prev => ({
      ...prev,
      [platform]: !prev[platform]
    }));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Performance</h1>
          <p className="text-muted-foreground mt-1">
            Gedetailleerde prestatie-analyse van je content
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Periode
          </Button>
          <Button className="bg-gradient-primary hover:bg-gradient-to-r hover:from-primary-dark hover:to-primary shadow-primary">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Totaal Views"
          value="1.2M"
          change="+12% vs vorige maand"
          changeType="positive"
          icon={Eye}
        />
        <MetricCard
          title="Engagement Rate"
          value="8.4%"
          change="+2.1% vs vorige maand"
          changeType="positive"
          icon={Heart}
        />
        <MetricCard
          title="Click-Through Rate"
          value="3.2%"
          change="+0.8% vs vorige maand"
          changeType="positive"
          icon={MousePointer}
        />
        <MetricCard
          title="Organic Impressions"
          value="892K"
          change="+18% vs vorige maand"
          changeType="positive"
          icon={TrendingUp}
        />
      </div>

      {/* Monthly Performance Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Maandelijkse Performance per Platform
            </CardTitle>
            <div className="flex gap-2">
              {Object.entries(platformColors).map(([platform, color]) => (
                <Button
                  key={platform}
                  variant={activePlatforms[platform] ? "default" : "outline"}
                  size="sm"
                  onClick={() => togglePlatform(platform)}
                  className={activePlatforms[platform] ? "" : "opacity-50"}
                  style={activePlatforms[platform] ? { 
                    backgroundColor: color,
                    borderColor: color,
                    color: platform === 'TikTok' ? 'white' : 'white'
                  } : {}}
                >
                  {platform}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">
              💡 Tip: Pieken in de grafiek tonen dagen waarop video's viral gingen
            </p>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="day" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `${value >= 1000 ? (value/1000).toFixed(1)+'K' : value}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                  formatter={(value) => [`${value.toLocaleString()} views`, '']}
                  labelFormatter={(label) => `${label} januari 2024`}
                />
                <Legend />
                {activePlatforms.TikTok && (
                  <Line 
                    type="linear" 
                    dataKey="TikTok" 
                    stroke="#000000" 
                    strokeWidth={2}
                    dot={{ fill: '#000000', strokeWidth: 1, r: 2 }}
                    activeDot={{ r: 4, strokeWidth: 1 }}
                  />
                )}
                {activePlatforms.Instagram && (
                  <Line 
                    type="linear" 
                    dataKey="Instagram" 
                    stroke="#E1306C" 
                    strokeWidth={2}
                    dot={{ fill: '#E1306C', strokeWidth: 1, r: 2 }}
                    activeDot={{ r: 4, strokeWidth: 1 }}
                  />
                )}
                {activePlatforms.YouTube && (
                  <Line 
                    type="linear" 
                    dataKey="YouTube" 
                    stroke="#FF0000" 
                    strokeWidth={2}
                    dot={{ fill: '#FF0000', strokeWidth: 1, r: 2 }}
                    activeDot={{ r: 4, strokeWidth: 1 }}
                  />
                )}
                {activePlatforms.Facebook && (
                  <Line 
                    type="linear" 
                    dataKey="Facebook" 
                    stroke="#1877F2" 
                    strokeWidth={2}
                    dot={{ fill: '#1877F2', strokeWidth: 1, r: 2 }}
                    activeDot={{ r: 4, strokeWidth: 1 }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Platform Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Platform Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">TikTok</h3>
              </div>
              <div className="text-2xl font-bold text-foreground">456K</div>
              <p className="text-sm text-success">+24% deze maand</p>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Avg. CTR</span>
                  <span>4.2%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Engagement</span>
                  <span>12.8%</span>
                </div>
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">Instagram</h3>
              </div>
              <div className="text-2xl font-bold text-foreground">234K</div>
              <p className="text-sm text-success">+8% deze maand</p>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Avg. CTR</span>
                  <span>2.8%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Engagement</span>
                  <span>9.2%</span>
                </div>
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">YouTube Shorts</h3>
              </div>
              <div className="text-2xl font-bold text-foreground">123K</div>
              <p className="text-sm text-success">+31% deze maand</p>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Avg. CTR</span>
                  <span>3.1%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Engagement</span>
                  <span>7.6%</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Grid - AI Insights next to Top Videos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Videos */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5 text-primary" />
                  Top 5 Video's deze maand
                </CardTitle>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-48">
                    <Calendar className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border border-border shadow-lg z-50">
                    {months.map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {performanceVideos.map((video, index) => (
                  <div 
                    key={video.id} 
                    className="group border rounded-lg p-4 hover:shadow-lg transition-all duration-200 cursor-pointer hover:border-primary/50"
                    onClick={() => handleVideoClick(video.url)}
                  >
                    <div className="relative mb-3">
                      <div className="w-full h-32 rounded-lg overflow-hidden">
                        <img 
                          src={video.thumbnail} 
                          alt={video.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      </div>
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg flex items-center justify-center">
                        <div className="bg-white/90 rounded-full p-2">
                          <ExternalLink className="h-4 w-4 text-gray-800" />
                        </div>
                      </div>
                      <div className="absolute top-2 left-2 bg-primary/90 text-primary-foreground px-2 py-1 rounded text-xs font-bold">
                        #{index + 1}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                        {video.title}
                      </h3>
                      
                      <div className="flex items-center gap-2">
                        <Badge className={`${getPlatformColor(video.platform)} text-xs`}>
                          {video.platform}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          <span>{video.views}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          <span>{video.likes}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" />
                          <span>{video.comments}</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t">
                        <div>
                          <span className="text-muted-foreground">CTR:</span>
                          <span className="font-medium ml-1">{video.ctr}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Engagement:</span>
                          <span className="font-medium ml-1">{video.engagement}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* AI Insights */}
        <AIInsightsWidget />
      </div>
    </div>
  );
}