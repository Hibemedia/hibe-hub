import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Award, 
  Star, 
  Target, 
  TrendingUp, 
  Users, 
  Eye,
  Heart,
  PlayCircle,
  Calendar,
  Trophy
} from "lucide-react";

const allMedals = [
  {
    id: 1,
    title: "100K Views",
    description: "Eerste video met 100.000+ views",
    icon: Eye,
    achieved: true,
    achievedDate: "2024-01-15",
    rarity: "gold",
    category: "Views"
  },
  {
    id: 2,
    title: "Engagement King",
    description: "10%+ engagement rate behaald",
    icon: Users,
    achieved: true,
    achievedDate: "2024-01-10",
    rarity: "silver",
    category: "Engagement"
  },
  {
    id: 3,
    title: "Trending Star",
    description: "Video in trending geplaatst",
    icon: TrendingUp,
    achieved: true,
    achievedDate: "2024-01-08",
    rarity: "bronze",
    category: "Trending"
  },
  {
    id: 4,
    title: "Viral Hit",
    description: "1 miljoen views bereikt",
    icon: Target,
    achieved: false,
    progress: 75,
    rarity: "platinum",
    category: "Views"
  },
  {
    id: 5,
    title: "Consistency Master",
    description: "30 dagen op rij content gepost",
    icon: Star,
    achieved: false,
    progress: 20,
    rarity: "gold",
    category: "Consistency"
  },
  {
    id: 6,
    title: "Love Magnet",
    description: "50.000+ likes verzameld",
    icon: Heart,
    achieved: false,
    progress: 85,
    rarity: "silver",
    category: "Engagement"
  },
  {
    id: 7,
    title: "Content Creator",
    description: "100 video's gepubliceerd",
    icon: PlayCircle,
    achieved: false,
    progress: 45,
    rarity: "bronze",
    category: "Content"
  },
  {
    id: 8,
    title: "Anniversary",
    description: "1 jaar samenwerking",
    icon: Calendar,
    achieved: false,
    progress: 60,
    rarity: "gold",
    category: "Milestone"
  }
];

export default function Medals() {
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

  const achievedMedals = allMedals.filter(medal => medal.achieved);
  const inProgressMedals = allMedals.filter(medal => !medal.achieved);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Medailles</h1>
          <p className="text-muted-foreground mt-1">
            Jouw behaalde prestaties en mijlpalen
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="accent" className="shadow-lg">
            <Trophy className="h-3 w-3 mr-1" />
            {achievedMedals.length}/{allMedals.length} behaald
          </Badge>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{achievedMedals.length}</div>
            <div className="text-sm text-muted-foreground">Behaald</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-warning">{inProgressMedals.length}</div>
            <div className="text-sm text-muted-foreground">In Progress</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-accent">{achievedMedals.filter(m => m.rarity === 'gold').length}</div>
            <div className="text-sm text-muted-foreground">Goud</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-success">
              {Math.round((achievedMedals.length / allMedals.length) * 100)}%
            </div>
            <div className="text-sm text-muted-foreground">Voltooid</div>
          </CardContent>
        </Card>
      </div>

      {/* Achieved Medals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-accent" />
            Behaalde Medailles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievedMedals.map((medal) => (
              <div key={medal.id} className="border rounded-lg p-4 bg-gradient-to-br from-muted/20 to-muted/10">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getRarityColor(medal.rarity)}`}>
                    <medal.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{medal.title}</h3>
                    <p className="text-sm text-muted-foreground">{medal.description}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">
                    {medal.category}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(medal.achievedDate).toLocaleDateString('nl-NL', { 
                      day: 'numeric', 
                      month: 'short',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* In Progress Medals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            In Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {inProgressMedals.map((medal) => (
              <div key={medal.id} className="border rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center opacity-60 ${getRarityColor(medal.rarity)}`}>
                    <medal.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{medal.title}</h3>
                    <p className="text-sm text-muted-foreground">{medal.description}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      {medal.category}
                    </Badge>
                    <span className="text-sm font-medium text-primary">{medal.progress}%</span>
                  </div>
                  <Progress value={medal.progress} className="h-2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}