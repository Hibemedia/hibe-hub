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
  PlayCircle,
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
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto animate-fade-in-up">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
          📊 Dashboard
        </h1>
        <p className="text-sm text-muted-foreground font-medium">Jouw prestaties in één oogopslag</p>
      </div>

      {/* AI Welcome Message */}
      <DashboardWelcome 
        customerName="Barbershop Amsterdam" 
        metrics={metrics}
      />

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Totaal Views"
          value="1.2M"
          change="+12% vs vorige maand"
          changeType="positive"
          icon={Eye}
          bgColor="bg-[hsl(var(--pastel-blue))]"
        />
        <MetricCard
          title="Engagement Rate"
          value="8.4%"
          change="+2.1% vs vorige maand"
          changeType="positive"
          icon={Heart}
          bgColor="bg-[hsl(var(--pastel-pink))]"
        />
        <MetricCard
          title="Click-Through Rate"
          value="3.2%"
          change="+0.8% vs vorige maand"
          changeType="positive"
          icon={MousePointer}
          bgColor="bg-[hsl(var(--pastel-mint))]"
        />
        <MetricCard
          title="Organic Impressions"
          value="892K"
          change="+18% vs vorige maand"
          changeType="positive"
          icon={TrendingUp}
          bgColor="bg-[hsl(var(--pastel-yellow))]"
        />
      </div>

      {/* Platform Overview */}
      <Card className="border-0 shadow-md bg-white/80">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold">🚀 Platform Overzicht</CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate("/performance")}
              className="text-xs h-8 font-semibold"
            >
              Bekijk alles
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* TikTok - Purple tint */}
            <div className="group p-5 rounded-3xl bg-[hsl(var(--pastel-lavender))] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border-0">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-foreground flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-md">
                  <svg viewBox="0 0 24 24" className="w-6 h-6 text-background" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                  </svg>
                </div>
                <div className="text-xs font-bold text-success px-3 py-1.5 bg-white/80 rounded-xl shadow-sm">📈 +24%</div>
              </div>
              <h3 className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider">TikTok</h3>
              <div className="text-3xl font-bold text-foreground">456K</div>
            </div>
            
            {/* Instagram - Pink/Purple gradient tint */}
            <div className="group p-5 rounded-3xl bg-gradient-to-br from-[hsl(var(--pastel-pink))] to-[hsl(var(--pastel-lavender))] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border-0">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-md">
                  <Instagram className="w-6 h-6 text-white" strokeWidth={2} />
                </div>
                <div className="text-xs font-bold text-muted-foreground px-3 py-1.5 bg-white/80 rounded-xl shadow-sm">📊 +8%</div>
              </div>
              <h3 className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider">Instagram</h3>
              <div className="text-3xl font-bold text-foreground">234K</div>
            </div>
            
            {/* YouTube - Green tint */}
            <div className="group p-5 rounded-3xl bg-[hsl(var(--pastel-mint))] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border-0">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-red-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-md">
                  <Youtube className="w-6 h-6 text-white" strokeWidth={2} />
                </div>
                <div className="text-xs font-bold text-success px-3 py-1.5 bg-white/80 rounded-xl shadow-sm">🚀 +31%</div>
              </div>
              <h3 className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider">YouTube</h3>
              <div className="text-3xl font-bold text-foreground">123K</div>
            </div>
            
            {/* Facebook - Peach tint */}
            <div className="group p-5 rounded-3xl bg-[hsl(var(--pastel-peach))] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border-0">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-md">
                  <Facebook className="w-6 h-6 text-white" strokeWidth={2} />
                </div>
                <div className="text-xs font-bold text-success px-3 py-1.5 bg-white/80 rounded-xl shadow-sm">✨ +15%</div>
              </div>
              <h3 className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider">Facebook</h3>
              <div className="text-3xl font-bold text-foreground">89K</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Video Approval Widget - Full Width */}
      <Card 
        className="cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-0 shadow-md bg-white/80"
        onClick={handleVideoApprovalClick}
      >
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3 text-base font-bold">
              <div className="w-11 h-11 rounded-2xl bg-primary flex items-center justify-center shadow-md">
                <PlayCircle className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
              </div>
              🎬 Video's nog goed te keuren
            </CardTitle>
            <Badge variant="outline" className="text-sm border-0 bg-primary/10 text-primary font-bold px-4 py-2 rounded-xl shadow-sm">
              3 video's
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6 pt-0">
          <div className="space-y-3">
            <div className="flex items-center gap-4 p-4 bg-[hsl(var(--pastel-blue))] rounded-2xl hover:shadow-md transition-all">
              <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 shadow-sm">
                <img 
                  src={dashboardVideo1} 
                  alt="Fade tutorial voor beginners"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <p className="font-bold text-xs text-foreground">Fade tutorial voor beginners</p>
                <p className="text-[11px] text-muted-foreground">Geüpload 2 uur geleden</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-[hsl(var(--pastel-pink))] rounded-2xl hover:shadow-md transition-all">
              <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 shadow-sm">
                <img 
                  src={dashboardVideo2} 
                  alt="Trending kapsel deze week"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm text-foreground">Trending kapsel deze week</p>
                <p className="text-xs text-muted-foreground">Geüpload 4 uur geleden</p>
              </div>
            </div>
            <Button 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm h-12 rounded-2xl shadow-md mt-3"
              onClick={(e) => {
                e.stopPropagation();
                handleVideoApprovalClick();
              }}
            >
              <PlayCircle className="h-5 w-5 mr-2" strokeWidth={2.5} />
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
    </div>
  );
}
