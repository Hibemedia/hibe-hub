import { DashboardWelcome } from "@/components/DashboardWelcome";
import { MetricCard } from "@/components/MetricCard";
import { MedaillesWidget } from "@/components/MedaillesWidget";
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
  Clock,
  PlayCircle,
  Play,
  Facebook,
  Instagram,
  Youtube
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import dashboardVideo1 from "@/assets/dashboard-video-1.jpg";
import dashboardVideo2 from "@/assets/dashboard-video-2.jpg";

export default function Dashboard() {
  const navigate = useNavigate();

  const handleVideoApprovalClick = () => {
    navigate("/video-approval");
  };

  const metrics = {
    totalViews: "1.2M",
    engagementRate: "8.4%",
    ctr: "3.2%",
    organicImpressions: "892K"
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-4xl font-black text-foreground tracking-tight">
          DASHBOARD
        </h1>
        <p className="text-base text-muted-foreground font-medium">Jouw prestaties in één oogopslag ✨</p>
      </div>

      {/* AI Welcome Message */}
      <DashboardWelcome 
        customerName="Barbershop Amsterdam" 
        metrics={metrics}
      />

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
      <Card className="border-2 hover:shadow-lg transition-all duration-300">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Platform Overzicht 🚀</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative p-4 rounded-xl bg-gradient-to-br from-black to-gray-900 text-white overflow-hidden group hover:scale-105 transition-transform duration-300">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/20 rounded-full blur-2xl group-hover:bg-primary/30 transition-colors"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                    </svg>
                  </div>
                  <h3 className="font-bold text-sm">TikTok</h3>
                  <Badge className="bg-accent text-accent-foreground font-bold text-xs shadow-accent ml-auto">Trending 🔥</Badge>
                </div>
                <div className="text-2xl font-black mb-1">456K</div>
                <p className="text-xs text-white/70 font-semibold">+24% deze maand</p>
              </div>
            </div>
            
            <div className="relative p-4 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 text-white overflow-hidden group hover:scale-105 transition-transform duration-300">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                    <Instagram className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-sm">Instagram</h3>
                  <Badge className="bg-white/20 text-white backdrop-blur-sm font-bold text-xs ml-auto">Stabiel ✓</Badge>
                </div>
                <div className="text-2xl font-black mb-1">234K</div>
                <p className="text-xs text-white/70 font-semibold">+8% deze maand</p>
              </div>
            </div>
            
            <div className="relative p-4 rounded-xl bg-gradient-to-br from-red-600 to-red-700 text-white overflow-hidden group hover:scale-105 transition-transform duration-300">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                    <Youtube className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-sm">YouTube Shorts</h3>
                </div>
                <div className="text-2xl font-black mb-1">123K</div>
                <p className="text-xs text-white/70 font-semibold">+31% deze maand</p>
              </div>
            </div>
            
            <div className="relative p-4 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white overflow-hidden group hover:scale-105 transition-transform duration-300">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                    <Facebook className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-sm">Facebook</h3>
                  <Badge className="bg-accent text-accent-foreground font-bold text-xs shadow-accent ml-auto">Groeiend 📈</Badge>
                </div>
                <div className="text-2xl font-black mb-1">89K</div>
                <p className="text-xs text-white/70 font-semibold">+15% deze maand</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Video Approval Widget - Full Width */}
      <Card 
        className="cursor-pointer hover:shadow-xl transition-all duration-300 border-2 border-primary/30 hover:border-primary/60 hover:-translate-y-0.5 bg-gradient-to-br from-primary/5 to-transparent"
        onClick={handleVideoApprovalClick}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg font-black">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center shadow-primary">
                <PlayCircle className="h-4 w-4 text-white" />
              </div>
              Video's nog goed te keuren
            </CardTitle>
            <Badge className="bg-gradient-to-r from-primary to-primary-light text-white font-bold text-xs px-3 py-1 shadow-primary">
              3 video's 🎬
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-3 p-3 bg-white/80 backdrop-blur-sm rounded-xl border-2 border-transparent hover:border-primary/30 transition-all duration-200 hover:shadow-md">
              <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 relative group">
                <img 
                  src={dashboardVideo1} 
                  alt="Fade tutorial voor beginners"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent flex items-center justify-center">
                  <div className="w-6 h-6 rounded-full bg-white/90 flex items-center justify-center">
                    <Play className="h-3 w-3 text-primary ml-0.5" />
                  </div>
                </div>
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm">Fade tutorial voor beginners</p>
                <p className="text-xs text-muted-foreground">Geüpload 2 uur geleden</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white/80 backdrop-blur-sm rounded-xl border-2 border-transparent hover:border-primary/30 transition-all duration-200 hover:shadow-md">
              <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 relative group">
                <img 
                  src={dashboardVideo2} 
                  alt="Trending kapsel deze week"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent flex items-center justify-center">
                  <div className="w-6 h-6 rounded-full bg-white/90 flex items-center justify-center">
                    <Play className="h-3 w-3 text-primary ml-0.5" />
                  </div>
                </div>
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm">Trending kapsel deze week</p>
                <p className="text-xs text-muted-foreground">Geüpload 4 uur geleden</p>
              </div>
            </div>
            <Button 
              className="w-full bg-gradient-to-r from-primary to-primary-light hover:from-primary-dark hover:to-primary text-white font-bold text-sm py-5 rounded-xl shadow-primary hover:shadow-lg transition-all duration-300 hover:scale-[1.01]"
              onClick={(e) => {
                e.stopPropagation();
                handleVideoApprovalClick();
              }}
            >
              <PlayCircle className="h-4 w-4 mr-2" />
              Bekijk alle video's
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Two Column Layout for Medals and Top Videos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Medailles Widget */}
        <MedaillesWidget />
        
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