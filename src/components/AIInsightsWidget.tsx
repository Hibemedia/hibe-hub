import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, TrendingUp, Clock, Users } from "lucide-react";

const sampleInsights = [
  {
    id: 1,
    title: "Optimale Posting Tijd",
    description: "Je video's presteren het best op donderdagmiddag tussen 14:00-16:00 uur.",
    type: "timing",
    icon: Clock,
    impact: "high"
  },
  {
    id: 2,
    title: "Content Prestaties",
    description: "Inhoud met persoonlijke verhalen genereert 3x meer saves dan salesgerichte content.",
    type: "content",
    icon: TrendingUp,
    impact: "medium"
  },
  {
    id: 3,
    title: "Engagement Groei",
    description: "Je engagement is deze maand 42% gestegen t.o.v. vorige maand.",
    type: "growth",
    icon: Users,
    impact: "high"
  }
];

export function AIInsightsWidget() {
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'bg-success text-success-foreground';
      case 'medium':
        return 'bg-warning text-warning-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          AI Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sampleInsights.map((insight) => (
            <div key={insight.id} className="border rounded-lg p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <insight.icon className="h-4 w-4 text-primary" />
                  <h4 className="font-medium text-foreground">{insight.title}</h4>
                </div>
                <Badge className={getImpactColor(insight.impact)}>
                  {insight.impact}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground ml-6">
                {insight.description}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}