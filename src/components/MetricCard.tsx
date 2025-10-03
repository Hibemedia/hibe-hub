import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  className?: string;
}

export function MetricCard({ 
  title, 
  value, 
  change, 
  changeType, 
  icon: Icon,
  className 
}: MetricCardProps) {
  const getChangeColor = () => {
    switch (changeType) {
      case 'positive':
        return 'text-success';
      case 'negative':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <Card className={cn(
      "relative overflow-hidden group border-2 hover-card backdrop-blur-sm",
      className
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
          {title}
        </CardTitle>
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-primary group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
          <Icon className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-foreground mb-2 tracking-tight">{value}</div>
        <p className={cn("text-xs font-bold uppercase tracking-wide", getChangeColor())}>
          {change}
        </p>
      </CardContent>
    </Card>
  );
}