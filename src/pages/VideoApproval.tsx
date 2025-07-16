import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Save,
  Filter,
  Edit2,
  Trash2
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
    durationSeconds: 165,
    status: "pending",
    thumbnail: videoApproval1,
    comments: [
      { id: 1, timestamp: 15, comment: "Goede opening, duidelijke uitleg!", author: "Sarah M.", time: "14:30", editable: false },
      { id: 2, timestamp: 45, comment: "Misschien iets langzamer hier?", author: "Mike J.", time: "14:32", editable: false }
    ]
  },
  {
    id: 2,
    title: "Barbershop morning routine",
    filename: "morning_routine_barbershop.mp4",
    uploadDate: "2024-01-14",
    duration: "1:23",
    durationSeconds: 83,
    status: "approved",
    thumbnail: videoApproval2,
    comments: [
      { id: 1, timestamp: 10, comment: "Perfecte opening!", author: "Hibe Team", time: "09:15", editable: false },
      { id: 2, timestamp: 35, comment: "Mooie close-up shots", author: "Sarah M.", time: "09:18", editable: false }
    ]
  },
  {
    id: 3,
    title: "Fade tutorial voor beginners",
    filename: "fade_tutorial_beginners.mp4",
    uploadDate: "2024-01-13",
    duration: "3:10",
    durationSeconds: 190,
    status: "rejected",
    thumbnail: videoApproval3,
    comments: [
      { id: 1, timestamp: 25, comment: "Heel goed uitgelegd!", author: "Mike J.", time: "11:20", editable: false },
      { id: 2, timestamp: 90, comment: "Deze overgang is perfect", author: "Sarah M.", time: "11:22", editable: false },
      { id: 3, timestamp: 150, comment: "Geluidskwaliteit is niet optimaal", author: "Hibe Team", time: "11:25", editable: false }
    ]
  },
  {
    id: 4,
    title: "Trending kapsel deze week",
    filename: "trending_hairstyle_week.mp4",
    uploadDate: "2024-01-12",
    duration: "1:58",
    durationSeconds: 118,
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
    durationSeconds: 140,
    status: "approved",
    thumbnail: videoApproval6,
    comments: [
      { id: 1, timestamp: 30, comment: "Hele goede tips!", author: "Sarah M.", time: "16:45", editable: false }
    ]
  }
];

const reviewer = {
  name: "Sarah Martinez",
  role: "Senior Content Reviewer",
  avatar: "SM"
};

const statusFilters = [
  { value: "all", label: "Alles", count: 5 },
  { value: "approved", label: "Goedgekeurd", count: 2 },
  { value: "rejected", label: "Afgekeurd", count: 1 },
  { value: "pending", label: "In beoordeling", count: 2 }
];

export default function VideoApproval() {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [videoStatus, setVideoStatus] = useState("");
  const [editingComment, setEditingComment] = useState(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const videoRef = useRef(null);

  const filteredVideos = videos.filter(video => {
    if (statusFilter === "all") return true;
    return video.status === statusFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-success';
      case 'rejected':
        return 'bg-destructive';
      default:
        return 'bg-warning';
    }
  };

  const getStatusBorder = (status: string) => {
    switch (status) {
      case 'approved':
        return 'border-success';
      case 'rejected':
        return 'border-destructive';
      default:
        return 'border-warning';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return { text: '✅ Goedgekeurd', className: 'bg-success text-success-foreground' };
      case 'rejected':
        return { text: '❌ Afgekeurd', className: 'bg-destructive text-destructive-foreground' };
      default:
        return { text: '⏳ In beoordeling', className: 'bg-warning text-warning-foreground' };
    }
  };

  const openVideoReview = (video) => {
    setSelectedVideo(video);
    setIsFullscreen(true);
    setCurrentTime(0);
    setVideoStatus(video.status);
    setVideoDuration(video.durationSeconds);
  };

  const closeVideoReview = () => {
    setIsFullscreen(false);
    setSelectedVideo(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setNewComment("");
    setEditingComment(null);
    setVideoStatus("");
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

  const jumpToTimestamp = (timestamp) => {
    setCurrentTime(timestamp);
    if (videoRef.current) {
      videoRef.current.currentTime = timestamp;
    }
  };

  const updateVideoStatus = (newStatus) => {
    setVideoStatus(newStatus);
    // In real app, update in database
    console.log('Updating video status:', selectedVideo.id, newStatus);
  };

  const addComment = () => {
    if (newComment.trim() && selectedVideo) {
      const comment = {
        id: Date.now(),
        timestamp: Math.floor(currentTime),
        comment: newComment.trim(),
        author: reviewer.name,
        time: new Date().toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }),
        editable: true
      };
      
      // In real app, this would update the database
      console.log('Adding comment:', comment);
      setNewComment("");
    }
  };

  const editComment = (commentId, newText) => {
    console.log('Editing comment:', commentId, newText);
    setEditingComment(null);
  };

  const deleteComment = (commentId) => {
    console.log('Deleting comment:', commentId);
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
      <div className="p-6 border-b border-border bg-card">
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
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-destructive rounded-full"></div>
              <span className="text-sm text-muted-foreground">
                {videos.filter(v => v.status === 'rejected').length} afgekeurd
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="px-6 pb-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground mr-2">Filter:</span>
          {statusFilters.map((filter) => (
            <Button
              key={filter.value}
              variant={statusFilter === filter.value ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(filter.value)}
              className="h-8"
            >
              {filter.label} ({filter.count})
            </Button>
          ))}
        </div>
      </div>

      {/* Video Grid */}
      <div className="px-6 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map((video) => (
            <motion.div
              key={video.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group cursor-pointer"
              onClick={() => openVideoReview(video)}
            >
              <Card className={`overflow-hidden border-2 ${getStatusBorder(video.status)} hover:border-primary/50 transition-colors`}>
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
                      <Play className="h-6 w-6 text-neutral-800" />
                    </div>
                  </div>
                  <div className="absolute top-2 left-2">
                    <Badge className={getStatusBadge(video.status).className}>
                      {getStatusBadge(video.status).text}
                    </Badge>
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
                    <Badge variant="outline" className="text-xs">
                      {video.status === 'approved' ? 'Goedgekeurd' : 
                       video.status === 'rejected' ? 'Afgekeurd' : 'In beoordeling'}
                    </Badge>
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
            className="fixed inset-0 bg-neutral-900 z-50 flex"
          >
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 bg-neutral-800/95 backdrop-blur-sm p-6 flex items-center justify-between z-10 border-b border-neutral-700">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeVideoReview}
                  className="text-neutral-300 hover:bg-neutral-700 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </Button>
                <div className="text-white">
                  <h2 className="font-medium text-lg">{selectedVideo.filename}</h2>
                  <p className="text-sm text-neutral-400">
                    {currentVideoIndex + 1} van {videos.length}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateVideo('prev')}
                  className="text-white hover:bg-neutral-700"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateVideo('next')}
                  className="text-white hover:bg-neutral-700"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-neutral-700"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  onClick={approveVideo}
                  className="bg-green-600 hover:bg-green-700 text-white"
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
                
                {/* Timeline with markers */}
                <div className="absolute bottom-0 left-0 right-0 bg-black/90 p-4">
                  <div className="relative">
                    <div className="w-full h-1 bg-neutral-600 rounded-full mb-2">
                      <div 
                        className="h-full bg-orange-500 rounded-full transition-all duration-100"
                        style={{ width: `${(currentTime / videoDuration) * 100}%` }}
                      />
                      {/* Comment markers */}
                      {selectedVideo.comments.map((comment) => (
                        <div
                          key={comment.id}
                          className="absolute top-0 w-2 h-2 bg-orange-500 rounded-full transform -translate-y-1/2 cursor-pointer hover:scale-125 transition-transform"
                          style={{ left: `${(comment.timestamp / videoDuration) * 100}%` }}
                          onClick={() => jumpToTimestamp(comment.timestamp)}
                          title={`${formatTime(comment.timestamp)}: ${comment.comment}`}
                        />
                      ))}
                    </div>
                    <div className="flex justify-between text-neutral-300 text-sm">
                      <span>{formatTime(currentTime)}</span>
                      <span>{selectedVideo.duration}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Side Panel */}
            <motion.div
              initial={{ x: 400 }}
              animate={{ x: 0 }}
              exit={{ x: 400 }}
              className="w-80 bg-neutral-800 border-l border-neutral-700 flex flex-col h-full"
            >
              {/* Status Badge - More space at top */}
              <div className="p-6 pt-32 border-b border-neutral-700">
                <Select value={videoStatus} onValueChange={updateVideoStatus}>
                  <SelectTrigger className="w-full bg-neutral-900 border-neutral-600 text-white">
                    <SelectValue placeholder="Status wijzigen" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-900 border-neutral-600 text-white shadow-lg z-50">
                    <SelectItem value="pending">⏳ In beoordeling</SelectItem>
                    <SelectItem value="approved">✅ Goedgekeurd</SelectItem>
                    <SelectItem value="rejected">❌ Afgekeurd</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Reviewer Profile */}
              <div className="p-6 border-b border-neutral-700">
                <div className="flex items-center gap-3">
                  <Avatar className="bg-neutral-700">
                    <AvatarFallback className="bg-neutral-700 text-white">{reviewer.avatar}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium text-white">{reviewer.name}</div>
                    <div className="text-sm text-neutral-400">{reviewer.role}</div>
                  </div>
                </div>
              </div>

              {/* Comment Input */}
              <div className="p-6 border-b border-neutral-700">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-neutral-300">
                    <Clock className="h-4 w-4" />
                    <span>Timestamp: {formatTime(currentTime)}</span>
                  </div>
                  <Textarea
                    placeholder="Voeg je commentaar toe..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[80px] resize-none bg-neutral-900 border-neutral-600 text-white placeholder-neutral-400"
                  />
                  <div className="flex gap-2">
                    <Button 
                      onClick={addComment}
                      disabled={!newComment.trim()}
                      className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Opslaan
                    </Button>
                    <Button variant="outline" onClick={() => setNewComment("")} className="border-white text-white hover:bg-white/10">
                      Annuleren
                    </Button>
                  </div>
                </div>
              </div>

              {/* Comments List */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  {selectedVideo.comments.map((comment) => (
                    <motion.div 
                      key={comment.id} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-2"
                    >
                      <div className="flex items-center gap-2 text-sm">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => jumpToTimestamp(comment.timestamp)}
                          className="h-auto p-1 hover:bg-neutral-700 text-orange-500"
                        >
                          <Clock className="h-3 w-3 text-orange-500 mr-1" />
                          <span className="font-medium text-orange-500">{formatTime(comment.timestamp)}</span>
                        </Button>
                        <span className="text-neutral-400">•</span>
                        <span className="text-neutral-300">{comment.author}</span>
                        <span className="text-neutral-400 ml-auto">{comment.time}</span>
                      </div>
                      <div className="bg-neutral-900 p-3 rounded-lg group">
                        {editingComment === comment.id ? (
                          <div className="space-y-2">
                            <Textarea
                              defaultValue={comment.comment}
                              className="min-h-[60px] resize-none bg-neutral-800 border-neutral-600 text-white"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && e.ctrlKey) {
                                  editComment(comment.id, (e.target as HTMLTextAreaElement).value);
                                } else if (e.key === 'Escape') {
                                  setEditingComment(null);
                                }
                              }}
                            />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => editComment(comment.id, "")} className="bg-orange-500 hover:bg-orange-600">
                                <Save className="h-3 w-3 mr-1" />
                                Opslaan
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingComment(null)} className="border-neutral-600 text-neutral-300 hover:bg-neutral-700">
                                Annuleren
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between">
                            <p className="text-sm flex-1 text-neutral-100">{comment.comment}</p>
                            {comment.editable && (
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditingComment(comment.id)}
                                  className="h-6 w-6 p-0 hover:bg-neutral-700 text-neutral-300"
                                >
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteComment(comment.id)}
                                  className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-neutral-700"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                  {selectedVideo.comments.length === 0 && (
                    <div className="text-center py-8 text-neutral-300">
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