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
  Award,
  CheckCircle,
  Clock
} from "lucide-react";

export default function Dashboard() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welkom terug, <span className="font-medium">Barbershop Amsterdam</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="accent" className="shadow-lg">
            <Award className="h-3 w-3 mr-1" />
            3 nieuwe medailles
          </Badge>
          <Button className="bg-gradient-primary hover:bg-gradient-to-r hover:from-primary-dark hover:to-primary shadow-primary">
            <Download className="h-4 w-4 mr-2" />
            Download Rapport
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

      {/* Platform Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Overzicht</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">TikTok</h3>
                <Badge className="bg-black text-white">Trending</Badge>
              </div>
              <div className="text-2xl font-bold text-foreground">456K</div>
              <p className="text-sm text-muted-foreground">+24% deze maand</p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">Instagram</h3>
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">Stabiel</Badge>
              </div>
              <div className="text-2xl font-bold text-foreground">234K</div>
              <p className="text-sm text-muted-foreground">+8% deze maand</p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">YouTube Shorts</h3>
                <Badge className="bg-red-500 text-white">Groeiend</Badge>
              </div>
              <div className="text-2xl font-bold text-foreground">123K</div>
              <p className="text-sm text-muted-foreground">+31% deze maand</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* AI Insights */}
        <AIInsightsWidget />
        
        {/* Top Videos */}
        <TopVideos />
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recente Activiteit</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-3 border rounded-lg">
              <div className="w-8 h-8 bg-success/10 rounded-full flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-success" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Video "Fade tutorial voor beginners" goedgekeurd</p>
                <p className="text-xs text-muted-foreground">2 uur geleden</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-3 border rounded-lg">
              <div className="w-8 h-8 bg-warning/10 rounded-full flex items-center justify-center">
                <Clock className="h-4 w-4 text-warning" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Nieuwe contentdag gepland voor 15 december</p>
                <p className="text-xs text-muted-foreground">1 dag geleden</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-3 border rounded-lg">
              <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center">
                <Award className="h-4 w-4 text-accent" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Medaille "100K Views" behaald!</p>
                <p className="text-xs text-muted-foreground">3 dagen geleden</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}