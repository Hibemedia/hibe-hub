import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, Star, Target, TrendingUp, Users, Eye } from "lucide-react";

const medals = [
  {
    id: 1,
    title: "100K Views",
    description: "Eerste video met 100.000+ views",
    icon: Eye,
    achieved: true,
    achievedDate: "2024-01-15",
    rarity: "gold"
  },
  {
    id: 2,
    title: "Engagement King",
    description: "10%+ engagement rate behaald",
    icon: Users,
    achieved: true,
    achievedDate: "2024-01-10",
    rarity: "silver"
  },
  {
    id: 3,
    title: "Trending Star",
    description: "Video in trending geplaatst",
    icon: TrendingUp,
    achieved: true,
    achievedDate: "2024-01-08",
    rarity: "bronze"
  },
  {
    id: 4,
    title: "Viral Hit",
    description: "1 miljoen views bereikt",
    icon: Target,
    achieved: false,
    progress: 75,
    rarity: "platinum"
  },
  {
    id: 5,
    title: "Consistency Master",
    description: "30 dagen op rij content gepost",
    icon: Star,
    achieved: false,
    progress: 20,
    rarity: "gold"
  }
];

export function MedaillesWidget() {
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'platinum':
        return 'bg-gradient-to-r from-purple-400 to-purple-600 text-white';
      case 'gold':
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
      case 'silver':
        return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
      case 'bronze':
        return 'bg-gradient-to-r from-orange-400 to-orange-600 text-white';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const achievedMedals = medals.filter(medal => medal.achieved);
  const inProgressMedals = medals.filter(medal => !medal.achieved);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5 text-accent" />
          Medailles
          <Badge variant="accent" className="ml-auto">
            {achievedMedals.length}/{medals.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Achieved Medals */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Behaald</h4>
            <div className="grid grid-cols-3 gap-2">
              {achievedMedals.map((medal) => (
                <div key={medal.id} className="text-center p-2 border rounded-lg bg-muted/20">
                  <div className={`w-8 h-8 rounded-full mx-auto mb-1 flex items-center justify-center ${getRarityColor(medal.rarity)}`}>
                    <medal.icon className="h-4 w-4" />
                  </div>
                  <p className="text-xs font-medium truncate">{medal.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(medal.achievedDate).toLocaleDateString('nl-NL', { 
                      day: 'numeric', 
                      month: 'short' 
                    })}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* In Progress */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">In Progress</h4>
            <div className="space-y-2">
              {inProgressMedals.map((medal) => (
                <div key={medal.id} className="flex items-center gap-3 p-2 border rounded-lg">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center opacity-60 ${getRarityColor(medal.rarity)}`}>
                    <medal.icon className="h-3 w-3" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{medal.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1 bg-muted rounded-full">
                        <div 
                          className="h-1 bg-primary rounded-full transition-all duration-500"
                          style={{ width: `${medal.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{medal.progress}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}