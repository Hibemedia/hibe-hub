import { MetricCard } from "@/components/MetricCard";
import { AIInsightsWidget } from "@/components/AIInsightsWidget";
import { TopVideos } from "@/components/TopVideos";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Eye, 
  Heart, 
  MousePointer, 
  TrendingUp, 
  Download,
  BarChart3,
  Calendar,
  Filter
} from "lucide-react";

export default function Performance() {
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
                <Badge className="bg-black text-white">Trending</Badge>
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
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">Stabiel</Badge>
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
                <Badge className="bg-red-500 text-white">Groeiend</Badge>
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

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* AI Insights - Now on Performance page */}
        <AIInsightsWidget />
        
        {/* Top Videos */}
        <TopVideos />
      </div>
    </div>
  );
}