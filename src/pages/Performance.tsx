import { MetricCard } from "@/components/MetricCard";
import { AIInsightsWidget } from "@/components/AIInsightsWidget";
import { TopVideos } from "@/components/TopVideos";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
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

// Sample data for the monthly performance chart
const monthlyData = [
  { day: '1', TikTok: 12000, Instagram: 8000, YouTube: 5000, Facebook: 3000 },
  { day: '3', TikTok: 15000, Instagram: 9500, YouTube: 6200, Facebook: 3500 },
  { day: '5', TikTok: 18000, Instagram: 11000, YouTube: 7500, Facebook: 4000 },
  { day: '7', TikTok: 22000, Instagram: 13000, YouTube: 8800, Facebook: 4500 },
  { day: '9', TikTok: 25000, Instagram: 15000, YouTube: 10000, Facebook: 5000 },
  { day: '11', TikTok: 28000, Instagram: 16500, YouTube: 11500, Facebook: 5500 },
  { day: '13', TikTok: 32000, Instagram: 18000, YouTube: 13000, Facebook: 6000 },
  { day: '15', TikTok: 35000, Instagram: 20000, YouTube: 14500, Facebook: 6500 },
  { day: '17', TikTok: 38000, Instagram: 22000, YouTube: 16000, Facebook: 7000 },
  { day: '19', TikTok: 42000, Instagram: 24000, YouTube: 17500, Facebook: 7500 },
  { day: '21', TikTok: 45000, Instagram: 26000, YouTube: 19000, Facebook: 8000 },
  { day: '23', TikTok: 48000, Instagram: 28000, YouTube: 20500, Facebook: 8500 },
  { day: '25', TikTok: 52000, Instagram: 30000, YouTube: 22000, Facebook: 9000 },
  { day: '27', TikTok: 55000, Instagram: 32000, YouTube: 23500, Facebook: 9500 },
  { day: '29', TikTok: 58000, Instagram: 34000, YouTube: 25000, Facebook: 10000 },
  { day: '31', TikTok: 62000, Instagram: 36000, YouTube: 26500, Facebook: 10500 }
];

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

      {/* Monthly Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Maandelijkse Performance per Platform
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
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
                  tickFormatter={(value) => `${value/1000}K`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                  formatter={(value) => [`${value.toLocaleString()} views`, '']}
                  labelFormatter={(label) => `Dag ${label}`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="TikTok" 
                  stroke="#000000" 
                  strokeWidth={3}
                  dot={{ fill: '#000000', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="Instagram" 
                  stroke="#E1306C" 
                  strokeWidth={3}
                  dot={{ fill: '#E1306C', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="YouTube" 
                  stroke="#FF0000" 
                  strokeWidth={3}
                  dot={{ fill: '#FF0000', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="Facebook" 
                  stroke="#1877F2" 
                  strokeWidth={3}
                  dot={{ fill: '#1877F2', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
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