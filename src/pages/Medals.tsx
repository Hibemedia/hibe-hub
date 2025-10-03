import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
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
  Trophy,
  Share2,
  Facebook,
  Twitter,
  Linkedin,
  Sparkles
} from "lucide-react";

const allMedals = [
  {
    id: 1,
    title: "100K Views 🎯",
    description: "Eerste video met 100.000+ views",
    motivation: "Wat een prestatie! Je content wordt gezien! 🚀",
    icon: Eye,
    achieved: true,
    achievedDate: "2024-01-15",
    rarity: "gold",
    category: "Views"
  },
  {
    id: 2,
    title: "Engagement King 👑",
    description: "10%+ engagement rate behaald",
    motivation: "Je publiek is verliefd op je content! ❤️",
    icon: Users,
    achieved: true,
    achievedDate: "2024-01-10",
    rarity: "silver",
    category: "Engagement"
  },
  {
    id: 3,
    title: "Trending Star ⭐",
    description: "Video in trending geplaatst",
    motivation: "Je bent officieel trending! Keep going! 🔥",
    icon: TrendingUp,
    achieved: true,
    achievedDate: "2024-01-08",
    rarity: "bronze",
    category: "Trending"
  },
  {
    id: 4,
    title: "Viral Hit 💥",
    description: "1 miljoen views bereikt",
    motivation: "Zo dichtbij! Blijf doorgaan, viral komt eraan!",
    icon: Target,
    achieved: false,
    progress: 75,
    rarity: "platinum",
    category: "Views"
  },
  {
    id: 5,
    title: "Consistency Master 📅",
    description: "30 dagen op rij content gepost",
    motivation: "Consistentie is de sleutel! Je bent op de goede weg!",
    icon: Star,
    achieved: false,
    progress: 20,
    rarity: "gold",
    category: "Consistency"
  },
  {
    id: 6,
    title: "Love Magnet 💕",
    description: "50.000+ likes verzameld",
    motivation: "Nog een klein beetje! Je content spreekt aan!",
    icon: Heart,
    achieved: false,
    progress: 85,
    rarity: "silver",
    category: "Engagement"
  },
  {
    id: 7,
    title: "Content Creator 🎬",
    description: "100 video's gepubliceerd",
    motivation: "Blijf creëren! Elk video is een kans om te groeien!",
    icon: PlayCircle,
    achieved: false,
    progress: 45,
    rarity: "bronze",
    category: "Content"
  },
  {
    id: 8,
    title: "Anniversary 🎉",
    description: "1 jaar samenwerking",
    motivation: "Wat een reis samen! Nog veel meer te komen!",
    icon: Calendar,
    achieved: false,
    progress: 60,
    rarity: "gold",
    category: "Milestone"
  }
];

const Confetti = ({ show }: { show: boolean }) => {
  if (!show) return null;

  const confettiPieces = Array.from({ length: 50 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: Math.random() * 2,
    duration: 2 + Math.random() * 2,
    color: ['#FF6B35', '#F7931E', '#FDC830', '#37B7C3', '#088395'][Math.floor(Math.random() * 5)]
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {confettiPieces.map((piece) => (
        <motion.div
          key={piece.id}
          className="absolute w-2 h-2 rounded-full"
          style={{
            left: piece.left,
            backgroundColor: piece.color,
          }}
          initial={{ y: -20, opacity: 1, rotate: 0 }}
          animate={{
            y: window.innerHeight + 20,
            opacity: 0,
            rotate: 720,
          }}
          transition={{
            duration: piece.duration,
            delay: piece.delay,
            ease: "easeIn",
          }}
        />
      ))}
    </div>
  );
};

export default function Medals() {
  const [showConfetti, setShowConfetti] = useState(false);
  const [shareModal, setShareModal] = useState<number | null>(null);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'platinum':
        return 'bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-600 text-white';
      case 'gold':
        return 'bg-gradient-to-br from-yellow-400 via-yellow-500 to-amber-600 text-white';
      case 'silver':
        return 'bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500 text-white';
      case 'bronze':
        return 'bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 text-white';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getRarityGlow = (rarity: string) => {
    switch (rarity) {
      case 'platinum':
        return 'shadow-[0_0_30px_rgba(168,85,247,0.4)]';
      case 'gold':
        return 'shadow-[0_0_30px_rgba(251,191,36,0.4)]';
      case 'silver':
        return 'shadow-[0_0_30px_rgba(156,163,175,0.4)]';
      case 'bronze':
        return 'shadow-[0_0_30px_rgba(251,146,60,0.4)]';
      default:
        return '';
    }
  };

  const achievedMedals = allMedals.filter(medal => medal.achieved);
  const inProgressMedals = allMedals.filter(medal => !medal.achieved);

  const handleCelebrate = (medalId: number) => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 4000);
  };

  const shareToSocial = (platform: string, medal: any) => {
    const text = `🏆 Ik heb zojuist de "${medal.title}" medaille behaald! ${medal.motivation}`;
    const url = window.location.href;
    
    const shareUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
    };

    window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    setShareModal(null);
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <Confetti show={showConfetti} />

      {/* Header with motivation */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <h1 className="text-4xl font-black text-foreground tracking-tight">
          MEDAILLES 🏆
        </h1>
        <p className="text-lg text-muted-foreground font-medium">
          Jouw behaalde prestaties en mijlpalen - blijf groeien! 💪
        </p>
      </motion.div>

      {/* Stats Overview with motivational message */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Card className="hover-lift border-2 border-primary/20 hover:border-primary/40 bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="p-6 text-center">
              <div className="text-4xl font-black text-primary mb-1">{achievedMedals.length}</div>
              <div className="text-sm font-semibold text-muted-foreground">Behaald</div>
              <div className="text-xs text-primary mt-1">Geweldig! 🎉</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Card className="hover-lift border-2 border-warning/20 hover:border-warning/40 bg-gradient-to-br from-warning/5 to-transparent">
            <CardContent className="p-6 text-center">
              <div className="text-4xl font-black text-warning mb-1">{inProgressMedals.length}</div>
              <div className="text-sm font-semibold text-muted-foreground">In Progress</div>
              <div className="text-xs text-warning mt-1">Bijna daar! 🚀</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Card className="hover-lift border-2 border-accent/20 hover:border-accent/40 bg-gradient-to-br from-accent/5 to-transparent">
            <CardContent className="p-6 text-center">
              <div className="text-4xl font-black text-accent mb-1">
                {achievedMedals.filter(m => m.rarity === 'gold').length}
              </div>
              <div className="text-sm font-semibold text-muted-foreground">Gouden</div>
              <div className="text-xs text-accent mt-1">Top tier! ⭐</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Card className="hover-lift border-2 border-success/20 hover:border-success/40 bg-gradient-to-br from-success/5 to-transparent">
            <CardContent className="p-6 text-center">
              <div className="text-4xl font-black text-success mb-1">
                {Math.round((achievedMedals.length / allMedals.length) * 100)}%
              </div>
              <div className="text-sm font-semibold text-muted-foreground">Voltooid</div>
              <div className="text-xs text-success mt-1">Keep going! 💪</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Achieved Medals with Confetti */}
      <Card className="border-2 hover:shadow-xl transition-all duration-300">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Award className="h-6 w-6 text-accent" />
            Behaalde Medailles
            <Sparkles className="h-5 w-5 text-accent ml-auto" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {achievedMedals.map((medal, index) => (
              <motion.div
                key={medal.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05, rotate: 2 }}
                className="relative group"
              >
                <Card className={`border-2 hover-lift ${getRarityGlow(medal.rarity)} bg-gradient-to-br from-card to-muted/20`}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${getRarityColor(medal.rarity)} relative overflow-hidden group-hover:scale-110 transition-transform`}>
                        <medal.icon className="h-8 w-8 relative z-10" />
                        <div className="absolute inset-0 bg-white/20 shimmer"></div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-black text-foreground mb-1">{medal.title}</h3>
                        <p className="text-sm text-muted-foreground">{medal.description}</p>
                      </div>
                    </div>

                    {/* Motivational text */}
                    <div className="mb-4 p-3 bg-primary/5 rounded-lg border-l-4 border-primary">
                      <p className="text-sm font-semibold text-primary">{medal.motivation}</p>
                    </div>

                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="outline" className="text-xs font-bold">
                        {medal.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground font-medium">
                        {new Date(medal.achievedDate).toLocaleDateString('nl-NL', { 
                          day: 'numeric', 
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </div>

                    {/* Share buttons */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCelebrate(medal.id)}
                        className="flex-1 hover:bg-accent hover:text-accent-foreground hover:border-accent"
                      >
                        <Sparkles className="h-3 w-3 mr-1" />
                        Vier het!
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShareModal(medal.id)}
                        className="flex-1 hover:bg-primary hover:text-primary-foreground hover:border-primary"
                      >
                        <Share2 className="h-3 w-3 mr-1" />
                        Delen
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Share Modal */}
                <AnimatePresence>
                  {shareModal === medal.id && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
                      onClick={() => setShareModal(null)}
                    >
                      <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-card p-8 rounded-2xl shadow-2xl max-w-md w-full mx-4 border-2 border-border"
                      >
                        <h3 className="text-2xl font-black mb-2">Deel je prestatie! 🎉</h3>
                        <p className="text-muted-foreground mb-6">
                          Laat iedereen weten dat je {medal.title} hebt behaald!
                        </p>
                        <div className="space-y-3">
                          <Button
                            onClick={() => shareToSocial('facebook', medal)}
                            className="w-full bg-[#1877F2] hover:bg-[#1877F2]/90 text-white"
                            size="lg"
                          >
                            <Facebook className="h-5 w-5 mr-2" />
                            Delen op Facebook
                          </Button>
                          <Button
                            onClick={() => shareToSocial('twitter', medal)}
                            className="w-full bg-[#1DA1F2] hover:bg-[#1DA1F2]/90 text-white"
                            size="lg"
                          >
                            <Twitter className="h-5 w-5 mr-2" />
                            Delen op Twitter
                          </Button>
                          <Button
                            onClick={() => shareToSocial('linkedin', medal)}
                            className="w-full bg-[#0A66C2] hover:bg-[#0A66C2]/90 text-white"
                            size="lg"
                          >
                            <Linkedin className="h-5 w-5 mr-2" />
                            Delen op LinkedIn
                          </Button>
                          <Button
                            onClick={() => setShareModal(null)}
                            variant="outline"
                            className="w-full"
                            size="lg"
                          >
                            Sluiten
                          </Button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* In Progress Medals with Motivational Progress */}
      <Card className="border-2 hover:shadow-xl transition-all duration-300">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Target className="h-6 w-6 text-primary" />
            In Progress - Bijna daar! 🎯
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {inProgressMedals.map((medal, index) => (
              <motion.div
                key={medal.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                <Card className="border-2 border-dashed hover:border-primary/50 transition-colors hover-lift bg-gradient-to-br from-card to-muted/10">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center opacity-70 ${getRarityColor(medal.rarity)} relative`}>
                        <medal.icon className="h-7 w-7" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-black text-foreground mb-1">{medal.title}</h3>
                        <p className="text-sm text-muted-foreground">{medal.description}</p>
                      </div>
                    </div>

                    {/* Motivational text */}
                    <div className="mb-4 p-3 bg-warning/5 rounded-lg border-l-4 border-warning">
                      <p className="text-sm font-semibold text-warning">{medal.motivation}</p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs font-bold">
                          {medal.category}
                        </Badge>
                        <span className="text-lg font-black text-primary">{medal.progress}%</span>
                      </div>
                      <div className="relative">
                        <Progress value={medal.progress} className="h-3" />
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                          animate={{ x: ['-100%', '200%'] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        />
                      </div>
                      <p className="text-xs text-center text-muted-foreground font-medium">
                        {medal.progress < 30 && "Je bent goed op weg! 🌟"}
                        {medal.progress >= 30 && medal.progress < 70 && "Meer dan halfway daar! 💪"}
                        {medal.progress >= 70 && "Bijna! Je gaat het halen! 🔥"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
