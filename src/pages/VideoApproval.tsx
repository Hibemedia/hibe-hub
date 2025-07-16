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

const videos = [
  {
    id: 1,
    title: "Beste kniptechnieken voor krullend haar",
    uploadDate: "2024-01-15",
    duration: "0:45",
    status: "pending",
    feedback: [],
    thumbnail: "🎬"
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
    thumbnail: "🎬"
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
    thumbnail: "🎬"
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
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
            1 wacht op feedback
          </Badge>
          <Badge variant="outline" className="bg-success/10 text-success border-success/20">
            2 goedgekeurd
          </Badge>
        </div>
      </div>

      {/* Videos Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {videos.map((video) => (
          <Card key={video.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{video.title}</CardTitle>
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {new Date(video.uploadDate).toLocaleDateString('nl-NL')}
                    <Clock className="h-3 w-3 ml-2" />
                    {video.duration}
                  </div>
                </div>
                <Badge className={getStatusColor(video.status)}>
                  {getStatusText(video.status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {/* Video Thumbnail */}
              <div className="w-full h-32 bg-gradient-primary rounded-lg flex items-center justify-center mb-4">
                <div className="text-4xl">{video.thumbnail}</div>
                <Play className="absolute h-8 w-8 text-white opacity-80" />
              </div>

              {/* Feedback Section */}
              {video.feedback.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                    <MessageCircle className="h-3 w-3" />
                    Feedback
                  </h4>
                  <div className="space-y-2">
                    {video.feedback.map((feedback, index) => (
                      <div key={index} className="p-2 bg-muted rounded-lg">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                          <User className="h-3 w-3" />
                          {feedback.author}
                          <span className="ml-auto">{feedback.timestamp}</span>
                        </div>
                        <p className="text-sm">{feedback.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add Feedback */}
              {video.status === 'pending' && (
                <div className="space-y-3">
                  <Textarea 
                    placeholder="Voeg je feedback toe..."
                    className="min-h-[80px]"
                  />
                  <div className="flex gap-2">
                    <Button className="flex-1 bg-success hover:bg-success/90">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Goedkeuren
                    </Button>
                    <Button variant="outline" className="flex-1 border-destructive text-destructive hover:bg-destructive/10">
                      <XCircle className="h-4 w-4 mr-2" />
                      Afkeuren
                    </Button>
                  </div>
                </div>
              )}

              {/* Actions for approved/feedback videos */}
              {video.status !== 'pending' && (
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1">
                    <Play className="h-4 w-4 mr-2" />
                    Bekijk Video
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Feedback
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}