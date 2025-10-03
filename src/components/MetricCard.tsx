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
  bgColor?: string;
}

export function MetricCard({ 
  title, 
  value, 
  change, 
  changeType, 
  icon: Icon,
  className,
  bgColor = "bg-white/80"
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
      "relative overflow-hidden group border-0 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300",
      bgColor,
      className
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 pt-5 px-5">
        <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
          {title}
        </CardTitle>
        <div className="w-11 h-11 rounded-2xl bg-primary flex items-center justify-center shadow-md group-hover:scale-110 transition-all duration-300">
          <Icon className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <div className="text-3xl font-bold text-foreground mb-2 tracking-tight">{value}</div>
        <p className={cn("text-xs font-bold uppercase tracking-wide", getChangeColor())}>
          {change}
        </p>
      </CardContent>
    </Card>
  );
}