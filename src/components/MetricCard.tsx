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
      "relative overflow-hidden group border-0 shadow-md hover:shadow-lg transition-all duration-300",
      className
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4">
        <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          {title}
        </CardTitle>
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-sm group-hover:scale-110 transition-all duration-300">
          <Icon className="h-4 w-4 text-primary-foreground" strokeWidth={2.5} />
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="text-2xl font-bold text-foreground mb-1 tracking-tight">{value}</div>
        <p className={cn("text-[11px] font-bold uppercase tracking-wide", getChangeColor())}>
          {change}
        </p>
      </CardContent>
    </Card>
  );
}