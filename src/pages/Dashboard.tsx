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
    <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto animate-fade-in-up">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
          Dashboard 📊
        </h1>
        <p className="text-sm text-muted-foreground font-medium">Jouw prestaties in één oogopslag</p>
      </div>

      {/* AI Welcome Message */}
      <DashboardWelcome 
        customerName="Barbershop Amsterdam" 
        metrics={metrics}
      />

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
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
      <Card className="border-2">
        <CardHeader className="border-b border-border pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold">Platform Overzicht 🚀</CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate("/performance")}
              className="text-xs h-8"
            >
              Bekijk alles
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="group p-3 rounded-xl bg-gradient-to-br from-card to-muted/30 border-2 border-border hover-card cursor-pointer">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 text-background" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                  </svg>
                </div>
                <h3 className="font-bold text-xs text-foreground uppercase tracking-wide">TikTok</h3>
                <Badge variant="outline" className="text-[10px] ml-auto border-primary bg-primary/10 text-primary font-bold px-2 py-0">
                  🔥 HOT
                </Badge>
              </div>
              <div className="text-2xl font-bold mb-0.5 text-foreground">456K</div>
              <p className="text-[11px] text-muted-foreground font-semibold">+24% deze maand 📈</p>
            </div>
            
            <div className="group p-3 rounded-xl bg-gradient-to-br from-card to-muted/30 border-2 border-border hover-card cursor-pointer">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Instagram className="w-4 h-4 text-white" strokeWidth={2} />
                </div>
                <h3 className="font-bold text-xs text-foreground uppercase tracking-wide">Instagram</h3>
                <Badge variant="outline" className="text-[10px] ml-auto border-muted-foreground/30 text-muted-foreground font-bold px-2 py-0">
                  ✨ COOL
                </Badge>
              </div>
              <div className="text-2xl font-bold mb-0.5 text-foreground">234K</div>
              <p className="text-[11px] text-muted-foreground font-semibold">+8% deze maand 💫</p>
            </div>
            
            <div className="group p-3 rounded-xl bg-gradient-to-br from-card to-muted/30 border-2 border-border hover-card cursor-pointer">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Youtube className="w-4 h-4 text-white" strokeWidth={2} />
                </div>
                <h3 className="font-bold text-xs text-foreground uppercase tracking-wide">YouTube</h3>
                <Badge variant="outline" className="text-[10px] ml-auto border-primary bg-primary/10 text-primary font-bold px-2 py-0">
                  🚀 UP
                </Badge>
              </div>
              <div className="text-2xl font-bold mb-0.5 text-foreground">123K</div>
              <p className="text-[11px] text-muted-foreground font-semibold">+31% deze maand 🎯</p>
            </div>
            
            <div className="group p-3 rounded-xl bg-gradient-to-br from-card to-muted/30 border-2 border-border hover-card cursor-pointer">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Facebook className="w-4 h-4 text-white" strokeWidth={2} />
                </div>
                <h3 className="font-bold text-xs text-foreground uppercase tracking-wide">Facebook</h3>
                <Badge variant="outline" className="text-[10px] ml-auto border-success/30 bg-success/10 text-success font-bold px-2 py-0">
                  💪 GROW
                </Badge>
              </div>
              <div className="text-2xl font-bold mb-0.5 text-foreground">89K</div>
              <p className="text-[11px] text-muted-foreground font-semibold">+15% deze maand 💚</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Video Approval Widget - Full Width */}
      <Card 
        className="cursor-pointer hover-card border-2"
        onClick={handleVideoApprovalClick}
      >
        <CardHeader className="border-b border-border pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm font-bold">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                <PlayCircle className="h-3.5 w-3.5 text-primary-foreground" strokeWidth={2.5} />
              </div>
              Video's nog goed te keuren ✅
            </CardTitle>
            <Badge variant="outline" className="text-xs border-primary bg-primary/10 text-primary font-bold px-2.5 py-0.5">
              3 video's
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 p-2.5 bg-muted/30 rounded-lg border border-border hover:bg-muted/50 transition-colors">
              <div className="w-11 h-11 rounded-lg overflow-hidden shrink-0">
                <img 
                  src={dashboardVideo1} 
                  alt="Fade tutorial voor beginners"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <p className="font-bold text-xs text-foreground">Fade tutorial voor beginners 💈</p>
                <p className="text-[11px] text-muted-foreground">Geüpload 2 uur geleden</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 p-2.5 bg-muted/30 rounded-lg border border-border hover:bg-muted/50 transition-colors">
              <div className="w-11 h-11 rounded-lg overflow-hidden shrink-0">
                <img 
                  src={dashboardVideo2} 
                  alt="Trending kapsel deze week"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <p className="font-bold text-xs text-foreground">Trending kapsel deze week ✂️</p>
                <p className="text-[11px] text-muted-foreground">Geüpload 4 uur geleden</p>
              </div>
            </div>
            <Button 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs h-9 mt-1"
              onClick={(e) => {
                e.stopPropagation();
                handleVideoApprovalClick();
              }}
            >
              <PlayCircle className="h-3.5 w-3.5 mr-1.5" strokeWidth={2.5} />
              Bekijk alle video's
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Two Column Layout for Medals and Top Videos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Medailles Widget */}
        <MedaillesWidget />
        
        {/* Top Videos */}
        <TopVideos />
      </div>
    </div>
  );
}
