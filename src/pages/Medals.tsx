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
  CheckCircle2,
  Clock,
  Sparkles
} from "lucide-react";

const allMedals = [
  {
    id: 1,
    title: "100K Views 🎯",
    description: "Eerste video met 100.000+ views",
    motivation: "Uitstekende prestatie! Je content wordt breed gezien. 🚀",
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
    motivation: "Je publiek reageert actief op je content. ❤️",
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
    motivation: "Je content heeft de trending pagina bereikt. 🔥",
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
    motivation: "Nog 25% te gaan tot deze mijlpaal. Blijf doorgaan! 🎯",
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
    motivation: "6 van 30 dagen voltooid. Consistentie is de sleutel! 💪",
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
    motivation: "Nog 7.500 likes te gaan. Bijna daar! 🌟",
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
    motivation: "45 van 100 video's gepubliceerd. Blijf creëren! 🎥",
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
    motivation: "7 maanden voltooid. Wat een reis samen! 🎊",
    icon: Calendar,
    achieved: false,
    progress: 60,
    rarity: "gold",
    category: "Milestone"
  }
];

const Confetti = ({ show }: { show: boolean }) => {
  if (!show) return null;

  const confettiColors = [
    '#FF6B35', // Orange
    '#F7931E', // Amber
    '#FDC830', // Yellow
    '#37B7C3', // Cyan
    '#088395', // Teal
    '#E74C3C', // Red
    '#9B59B6', // Purple
    '#3498DB', // Blue
    '#2ECC71', // Green
    '#F39C12', // Gold
  ];

  const confettiPieces = Array.from({ length: 60 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: Math.random() * 0.5,
    duration: 2.5 + Math.random() * 1.5,
    color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
    size: 6 + Math.random() * 8,
    rotation: Math.random() * 360
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {confettiPieces.map((piece) => (
        <motion.div
          key={piece.id}
          className="absolute rounded-sm"
          style={{
            left: piece.left,
            backgroundColor: piece.color,
            width: `${piece.size}px`,
            height: `${piece.size}px`,
            transform: `rotate(${piece.rotation}deg)`
          }}
          initial={{ y: -20, opacity: 0, scale: 0 }}
          animate={{
            y: window.innerHeight + 20,
            opacity: [0, 1, 1, 0],
            rotate: piece.rotation + 720,
            scale: [0, 1, 1, 0]
          }}
          transition={{
            duration: piece.duration,
            delay: piece.delay,
            ease: "easeOut",
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
        return 'bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-600';
      case 'gold':
        return 'bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600';
      case 'silver':
        return 'bg-gradient-to-br from-slate-300 via-gray-400 to-slate-500';
      case 'bronze':
        return 'bg-gradient-to-br from-orange-400 via-orange-500 to-amber-600';
      default:
        return 'bg-muted';
    }
  };

  const getRarityBadge = (rarity: string) => {
    switch (rarity) {
      case 'platinum':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'gold':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'silver':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'bronze':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const achievedMedals = allMedals.filter(medal => medal.achieved);
  const inProgressMedals = allMedals.filter(medal => !medal.achieved);

  const handleCelebrate = (medalId: number) => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 4000);
  };

  const shareToSocial = (platform: string, medal: any) => {
    const text = `Ik heb zojuist de "${medal.title}" medaille behaald bij Hibe Media!`;
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
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <Confetti show={showConfetti} />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-1"
      >
        <h1 className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight flex items-center gap-2">
          <Trophy className="h-7 w-7 text-amber-500" />
          Medailles 🏆
        </h1>
        <p className="text-sm text-muted-foreground">
          Jouw behaalde prestaties en mijlpalen ✨
        </p>
      </motion.div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Card className="border-border bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col gap-1">
                <span className="text-2xl md:text-3xl font-semibold text-foreground">
                  {achievedMedals.length} 🎉
                </span>
                <span className="text-xs md:text-sm text-muted-foreground">Behaald</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Card className="border-border bg-gradient-to-br from-amber-50 to-transparent">
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col gap-1">
                <span className="text-2xl md:text-3xl font-semibold text-foreground">
                  {inProgressMedals.length} 🎯
                </span>
                <span className="text-xs md:text-sm text-muted-foreground">In progress</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Card className="border-border bg-gradient-to-br from-amber-100 to-amber-50">
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col gap-1">
                <span className="text-2xl md:text-3xl font-semibold text-amber-900">
                  {achievedMedals.filter(m => m.rarity === 'gold').length} 🥇
                </span>
                <span className="text-xs md:text-sm text-amber-700">Gouden</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Card className="border-border bg-gradient-to-br from-green-50 to-transparent">
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col gap-1">
                <span className="text-2xl md:text-3xl font-semibold text-foreground">
                  {Math.round((achievedMedals.length / allMedals.length) * 100)}% 💪
                </span>
                <span className="text-xs md:text-sm text-muted-foreground">Voltooid</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Achieved Medals */}
      <Card className="border-border">
        <CardHeader className="border-b border-border bg-gradient-to-r from-amber-50/50 to-transparent">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg font-semibold">
            <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
            Behaalde Medailles 🎊
            <Sparkles className="h-4 w-4 text-amber-500 ml-auto" />
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievedMedals.map((medal, index) => (
              <motion.div
                key={medal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -4 }}
              >
                <Card className="border-border hover-card bg-gradient-to-br from-card to-muted/10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-200/20 to-transparent rounded-full blur-3xl"></div>
                  <CardContent className="p-4 md:p-5 relative">
                    <div className="flex items-start gap-3 mb-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${getRarityColor(medal.rarity)} text-white shadow-lg`}>
                        <medal.icon className="h-6 w-6" strokeWidth={2} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm text-foreground mb-0.5 truncate">
                          {medal.title}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {medal.description}
                        </p>
                      </div>
                    </div>

                    {/* Motivational text */}
                    <div className="mb-4 p-2.5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-md border border-green-200">
                      <p className="text-xs text-green-800 leading-relaxed font-medium">
                        {medal.motivation}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="outline" className={`text-xs border ${getRarityBadge(medal.rarity)}`}>
                        {medal.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(medal.achievedDate).toLocaleDateString('nl-NL', { 
                          day: 'numeric', 
                          month: 'short'
                        })}
                      </span>
                    </div>

                    {/* Share buttons */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleCelebrate(medal.id)}
                        className="flex-1 h-8 text-xs bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0"
                      >
                        <Sparkles className="h-3 w-3 mr-1" />
                        Vier het!
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShareModal(medal.id)}
                        className="flex-1 h-8 text-xs"
                      >
                        <Share2 className="h-3 w-3 mr-1" />
                        Delen
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* In Progress Medals */}
      <Card className="border-border">
        <CardHeader className="border-b border-border">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg font-semibold">
            <Clock className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
            In Progress 🚀
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {inProgressMedals.map((medal, index) => (
              <motion.div
                key={medal.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.01 }}
              >
                <Card className="border-border border-dashed hover-card bg-card">
                  <CardContent className="p-4 md:p-5">
                    <div className="flex items-start gap-3 mb-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getRarityColor(medal.rarity)} text-white opacity-60`}>
                        <medal.icon className="h-5 w-5" strokeWidth={2} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm text-foreground mb-0.5 truncate">
                          {medal.title}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {medal.description}
                        </p>
                      </div>
                    </div>

                    {/* Motivational text */}
                    <div className="mb-4 p-2.5 bg-blue-50 rounded-md border border-blue-200">
                      <p className="text-xs text-blue-800 leading-relaxed font-medium">
                        {medal.motivation}
                      </p>
                    </div>

                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className={`text-xs border ${getRarityBadge(medal.rarity)}`}>
                          {medal.category}
                        </Badge>
                        <span className="text-sm font-semibold text-foreground">
                          {medal.progress}%
                        </span>
                      </div>
                      <div className="relative">
                        <Progress value={medal.progress} className="h-2 bg-muted" />
                        <div className={`absolute top-0 left-0 h-2 rounded-full ${getRarityColor(medal.rarity)}`} style={{ width: `${medal.progress}%` }}></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Share Modal */}
      <AnimatePresence>
        {shareModal !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShareModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-lg shadow-xl max-w-md w-full p-6"
            >
              <h3 className="text-lg font-semibold mb-1">Deel je prestatie 🎉</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Laat anderen weten dat je {allMedals.find(m => m.id === shareModal)?.title} hebt behaald!
              </p>
              <div className="space-y-2">
                <Button
                  onClick={() => shareToSocial('facebook', allMedals.find(m => m.id === shareModal))}
                  className="w-full bg-[#1877F2] hover:bg-[#1877F2]/90 text-white border-0"
                  size="default"
                >
                  <Facebook className="h-4 w-4 mr-2" />
                  Delen op Facebook
                </Button>
                <Button
                  onClick={() => shareToSocial('twitter', allMedals.find(m => m.id === shareModal))}
                  className="w-full bg-[#1DA1F2] hover:bg-[#1DA1F2]/90 text-white border-0"
                  size="default"
                >
                  <Twitter className="h-4 w-4 mr-2" />
                  Delen op Twitter
                </Button>
                <Button
                  onClick={() => shareToSocial('linkedin', allMedals.find(m => m.id === shareModal))}
                  className="w-full bg-[#0A66C2] hover:bg-[#0A66C2]/90 text-white border-0"
                  size="default"
                >
                  <Linkedin className="h-4 w-4 mr-2" />
                  Delen op LinkedIn
                </Button>
                <Button
                  onClick={() => setShareModal(null)}
                  variant="outline"
                  className="w-full"
                  size="default"
                >
                  Sluiten
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
