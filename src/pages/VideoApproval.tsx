import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  MessageCircle, 
  Calendar,
  Clock,
  User,
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Pause,
  Send,
  Save
} from "lucide-react";
import videoApproval1 from "@/assets/video-approval-1.jpg";
import videoApproval2 from "@/assets/video-approval-2.jpg";
import videoApproval3 from "@/assets/video-approval-3.jpg";
import videoApproval5 from "@/assets/video-approval-5.jpg";
import videoApproval6 from "@/assets/video-approval-6.jpg";

const videos = [
  {
    id: 1,
    title: "Beste kniptechnieken voor krullend haar",
    filename: "barbershop_curly_hair_techniques.mp4",
    uploadDate: "2024-01-15",
    duration: "2:45",
    status: "pending",
    thumbnail: videoApproval1,
    comments: [
      { id: 1, timestamp: 15, comment: "Goede opening, duidelijke uitleg!", author: "Sarah M.", time: "14:30" },
      { id: 2, timestamp: 45, comment: "Misschien iets langzamer hier?", author: "Mike J.", time: "14:32" }
    ]
  },
  {
    id: 2,
    title: "Barbershop morning routine",
    filename: "morning_routine_barbershop.mp4",
    uploadDate: "2024-01-14",
    duration: "1:23",
    status: "approved",
    thumbnail: videoApproval2,
    comments: [
      { id: 1, timestamp: 10, comment: "Perfecte opening!", author: "Hibe Team", time: "09:15" },
      { id: 2, timestamp: 35, comment: "Mooie close-up shots", author: "Sarah M.", time: "09:18" }
    ]
  },
  {
    id: 3,
    title: "Fade tutorial voor beginners",
    filename: "fade_tutorial_beginners.mp4",
    uploadDate: "2024-01-13",
    duration: "3:10",
    status: "feedback",
    thumbnail: videoApproval3,
    comments: [
      { id: 1, timestamp: 25, comment: "Heel goed uitgelegd!", author: "Mike J.", time: "11:20" },
      { id: 2, timestamp: 90, comment: "Deze overgang is perfect", author: "Sarah M.", time: "11:22" },
      { id: 3, timestamp: 150, comment: "Misschien wat meer licht?", author: "Hibe Team", time: "11:25" }
    ]
  },
  {
    id: 4,
    title: "Trending kapsel deze week",
    filename: "trending_hairstyle_week.mp4",
    uploadDate: "2024-01-12",
    duration: "1:58",
    status: "pending",
    thumbnail: videoApproval5,
    comments: []
  },
  {
    id: 5,
    title: "Grooming tips voor mannen",
    filename: "mens_grooming_tips.mp4",
    uploadDate: "2024-01-11",
    duration: "2:20",
    status: "approved",
    thumbnail: videoApproval6,
    comments: [
      { id: 1, timestamp: 30, comment: "Hele goede tips!", author: "Sarah M.", time: "16:45" }
    ]
  }
];

const reviewer = {
  name: "Sarah Martinez",
  role: "Senior Content Reviewer",
  avatar: "SM"
};

export default function VideoApproval() {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-success';
      case 'feedback':
        return 'bg-warning';
      case 'rejected':
        return 'bg-destructive';
      default:
        return 'bg-muted-foreground';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Goedgekeurd';
      case 'feedback':
        return 'Feedback gegeven';
      case 'rejected':
        return 'Afgekeurd';
      default:
        return 'Wacht op goedkeuring';
    }
  };

  const openVideoReview = (video) => {
    setSelectedVideo(video);
    setIsFullscreen(true);
    setCurrentTime(0);
  };

  const closeVideoReview = () => {
    setIsFullscreen(false);
    setSelectedVideo(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setNewComment("");
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVideoClick = () => {
    if (isPlaying) {
      togglePlayPause();
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const addComment = () => {
    if (newComment.trim() && selectedVideo) {
      const comment = {
        id: Date.now(),
        timestamp: Math.floor(currentTime),
        comment: newComment.trim(),
        author: reviewer.name,
        time: new Date().toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
      };
      
      // In real app, this would update the database
      console.log('Adding comment:', comment);
      setNewComment("");
    }
  };

  const navigateVideo = (direction) => {
    if (!selectedVideo) return;
    
    const currentIndex = videos.findIndex(v => v.id === selectedVideo.id);
    let newIndex;
    
    if (direction === 'next') {
      newIndex = currentIndex < videos.length - 1 ? currentIndex + 1 : 0;
    } else {
      newIndex = currentIndex > 0 ? currentIndex - 1 : videos.length - 1;
    }
    
    setSelectedVideo(videos[newIndex]);
    setCurrentTime(0);
    setIsPlaying(false);
  };

  const approveVideo = () => {
    if (selectedVideo) {
      console.log('Approving video:', selectedVideo.id);
      // In real app, update status in database
      closeVideoReview();
    }
  };

  const currentVideoIndex = selectedVideo ? videos.findIndex(v => v.id === selectedVideo.id) : -1;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Video Goedkeuring</h1>
            <p className="text-muted-foreground mt-1">
              Bekijk en geef feedback op je video's
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-warning rounded-full"></div>
              <span className="text-sm text-muted-foreground">
                {videos.filter(v => v.status === 'pending').length} wacht op goedkeuring
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-success rounded-full"></div>
              <span className="text-sm text-muted-foreground">
                {videos.filter(v => v.status === 'approved').length} goedgekeurd
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Video Grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <motion.div
              key={video.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group cursor-pointer"
              onClick={() => openVideoReview(video)}
            >
              <Card className="overflow-hidden border-2 hover:border-primary/50 transition-colors">
                <div className="relative">
                  <div className="aspect-video bg-black">
                    <img 
                      src={video.thumbnail} 
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="bg-white/90 rounded-full p-3">
                      <Play className="h-6 w-6 text-gray-800" />
                    </div>
                  </div>
                  <div className="absolute top-2 right-2">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(video.status)}`}></div>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                    {video.duration}
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-medium text-sm mb-2 line-clamp-2">{video.title}</h3>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                    <span>{video.filename}</span>
                    <span>{new Date(video.uploadDate).toLocaleDateString('nl-NL')}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {getStatusText(video.status)}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MessageCircle className="h-3 w-3" />
                      {video.comments.length}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Fullscreen Review Modal */}
      <AnimatePresence>
        {isFullscreen && selectedVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-50 flex"
          >
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 bg-black/80 backdrop-blur-sm p-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeVideoReview}
                  className="text-white hover:bg-white/20"
                >
                  <X className="h-4 w-4" />
                </Button>
                <div className="text-white">
                  <h2 className="font-medium">{selectedVideo.filename}</h2>
                  <p className="text-sm text-white/70">
                    {currentVideoIndex + 1} van {videos.length}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateVideo('prev')}
                  className="text-white hover:bg-white/20"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateVideo('next')}
                  className="text-white hover:bg-white/20"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  onClick={approveVideo}
                  className="bg-success hover:bg-success/90"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Goedgekeurd
                </Button>
              </div>
            </div>

            {/* Video Player */}
            <div className="flex-1 flex items-center justify-center p-20">
              <div className="relative max-w-4xl w-full aspect-video bg-black rounded-lg overflow-hidden">
                <img 
                  src={selectedVideo.thumbnail} 
                  alt={selectedVideo.title}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={handleVideoClick}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={togglePlayPause}
                    className="bg-black/50 hover:bg-black/70 text-white rounded-full"
                  >
                    {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8" />}
                  </Button>
                </div>
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="bg-black/70 text-white px-3 py-1 rounded text-sm">
                    {formatTime(currentTime)} / {selectedVideo.duration}
                  </div>
                </div>
              </div>
            </div>

            {/* Side Panel */}
            <motion.div
              initial={{ x: 400 }}
              animate={{ x: 0 }}
              exit={{ x: 400 }}
              className="w-80 bg-card border-l border-border flex flex-col h-full"
            >
              {/* Reviewer Profile */}
              <div className="p-4 border-b">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>{reviewer.avatar}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{reviewer.name}</div>
                    <div className="text-sm text-muted-foreground">{reviewer.role}</div>
                  </div>
                </div>
              </div>

              {/* Comment Input */}
              <div className="p-4 border-b">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Timestamp: {formatTime(currentTime)}</span>
                  </div>
                  <Textarea
                    placeholder="Voeg je commentaar toe..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[80px] resize-none"
                  />
                  <div className="flex gap-2">
                    <Button 
                      onClick={addComment}
                      disabled={!newComment.trim()}
                      className="flex-1"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Opslaan
                    </Button>
                    <Button variant="outline" onClick={() => setNewComment("")}>
                      Annuleren
                    </Button>
                  </div>
                </div>
              </div>

              {/* Comments List */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                  {selectedVideo.comments.map((comment) => (
                    <div key={comment.id} className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium">{formatTime(comment.timestamp)}</span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-muted-foreground">{comment.author}</span>
                        <span className="text-muted-foreground ml-auto">{comment.time}</span>
                      </div>
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <p className="text-sm">{comment.comment}</p>
                      </div>
                    </div>
                  ))}
                  {selectedVideo.comments.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nog geen commentaren</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}