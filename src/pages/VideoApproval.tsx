import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  MessageCircle, 
  Calendar,
  Clock,
  User
} from "lucide-react";
import videoApproval1 from "@/assets/video-approval-1.jpg";
import videoApproval2 from "@/assets/video-approval-2.jpg";
import videoApproval3 from "@/assets/video-approval-3.jpg";

const videos = [
  {
    id: 1,
    title: "Beste kniptechnieken voor krullend haar",
    uploadDate: "2024-01-15",
    duration: "0:45",
    status: "pending",
    feedback: [],
    thumbnail: videoApproval1
  },
  {
    id: 2,
    title: "Barbershop morning routine",
    uploadDate: "2024-01-14",
    duration: "1:23",
    status: "approved",
    feedback: [
      { timestamp: "0:15", comment: "Perfecte opening!", author: "Hibe Team" }
    ],
    thumbnail: videoApproval2
  },
  {
    id: 3,
    title: "Fade tutorial voor beginners",
    uploadDate: "2024-01-13",
    duration: "2:10",
    status: "feedback",
    feedback: [
      { timestamp: "0:45", comment: "Misschien iets langzamer uitleggen hier", author: "Hibe Team" },
      { timestamp: "1:30", comment: "Goede close-up shot!", author: "Hibe Team" }
    ],
    thumbnail: videoApproval3
  }
];

export default function VideoApproval() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-success text-success-foreground';
      case 'feedback':
        return 'bg-warning text-warning-foreground';
      case 'rejected':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Goedgekeurd';
      case 'feedback':
        return 'Feedback nodig';
      case 'rejected':
        return 'Afgekeurd';
      default:
        return 'Wacht op goedkeuring';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
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
            <span className="text-sm text-muted-foreground">1 wacht op feedback</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-success rounded-full"></div>
            <span className="text-sm text-muted-foreground">2 goedgekeurd</span>
          </div>
        </div>
      </div>

      {/* Videos List */}
      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {videos.map((video) => (
              <div key={video.id} className="p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-4">
                  {/* Video Thumbnail */}
                  <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 relative">
                    <img 
                      src={video.thumbnail} 
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <Play className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  
                  {/* Video Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-medium text-foreground truncate">{video.title}</h3>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className={`w-2 h-2 rounded-full ${
                          video.status === 'approved' ? 'bg-success' :
                          video.status === 'feedback' ? 'bg-warning' :
                          video.status === 'rejected' ? 'bg-destructive' : 'bg-muted-foreground'
                        }`}></div>
                        <span className="text-sm text-muted-foreground">
                          {getStatusText(video.status)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(video.uploadDate).toLocaleDateString('nl-NL')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {video.duration}
                      </span>
                    </div>
                    
                    {/* Inline Feedback */}
                    {video.feedback.length > 0 && (
                      <div className="mt-2 p-2 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Laatste feedback:</p>
                        <p className="text-sm">{video.feedback[video.feedback.length - 1].comment}</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {video.status === 'pending' ? (
                      <>
                        <Button size="sm" className="bg-success hover:bg-success/90">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Goedkeuren
                        </Button>
                        <Button size="sm" variant="outline" className="border-destructive text-destructive hover:bg-destructive/10">
                          <XCircle className="h-3 w-3 mr-1" />
                          Afkeuren
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button size="sm" variant="outline">
                          <Play className="h-3 w-3 mr-1" />
                          Bekijk
                        </Button>
                        <Button size="sm" variant="outline">
                          <MessageCircle className="h-3 w-3 mr-1" />
                          Feedback
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}