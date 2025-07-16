import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Play, MessageSquare, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Video {
  id: string;
  title: string;
  url: string;
  platform: string;
  status: string;
  caption?: string;
  created_at: string;
}

interface VideoFeedback {
  id: string;
  timestamp_seconds: number;
  comment: string;
  created_at: string;
  created_by: string;
}

export const ClientVideoList = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [videoFeedback, setVideoFeedback] = useState<VideoFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchVideos = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVideos(data || []);
    } catch (error) {
      console.error('Error fetching videos:', error);
      toast({
        title: "Error",
        description: "Failed to load videos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchVideoFeedback = async (videoId: string) => {
    setFeedbackLoading(true);
    try {
      const { data, error } = await supabase
        .from('video_feedback')
        .select('*')
        .eq('video_id', videoId)
        .order('timestamp_seconds', { ascending: true });

      if (error) throw error;
      setVideoFeedback(data || []);
    } catch (error) {
      console.error('Error fetching feedback:', error);
      toast({
        title: "Error",
        description: "Failed to load feedback",
        variant: "destructive"
      });
    } finally {
      setFeedbackLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500';
      case 'rejected': return 'bg-red-500';
      case 'revision': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      case 'revision': return 'Needs Revision';
      default: return 'Under Review';
    }
  };

  const formatTimestamp = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <div className="flex justify-center py-8">Loading videos...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">My Videos</h2>
        <div className="text-sm text-muted-foreground">
          {videos.length} video{videos.length !== 1 ? 's' : ''}
        </div>
      </div>

      {videos.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">No videos uploaded yet.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Video Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Upload Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {videos.map((video) => (
                  <TableRow key={video.id}>
                    <TableCell className="font-medium">{video.title}</TableCell>
                    <TableCell className="capitalize">{video.platform}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(video.status)}>
                        {getStatusText(video.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(video.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open(video.url, '_blank')}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedVideo(video);
                                fetchVideoFeedback(video.id);
                              }}
                            >
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Feedback for "{video.title}"</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              {video.caption && (
                                <div>
                                  <h4 className="font-medium mb-2">Caption:</h4>
                                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                                    {video.caption}
                                  </p>
                                </div>
                              )}
                              
                              <div>
                                <h4 className="font-medium mb-2">Feedback:</h4>
                                {feedbackLoading ? (
                                  <div className="text-center py-4">Loading feedback...</div>
                                ) : videoFeedback.length === 0 ? (
                                  <p className="text-sm text-muted-foreground">No feedback yet.</p>
                                ) : (
                                  <div className="space-y-3">
                                    {videoFeedback.map((feedback) => (
                                      <div key={feedback.id} className="border rounded p-3">
                                        <div className="flex items-center gap-2 mb-2">
                                          <Clock className="h-4 w-4 text-muted-foreground" />
                                          <span className="text-sm font-medium">
                                            {formatTimestamp(feedback.timestamp_seconds)}
                                          </span>
                                          <span className="text-xs text-muted-foreground">
                                            {new Date(feedback.created_at).toLocaleString()}
                                          </span>
                                        </div>
                                        <p className="text-sm">{feedback.comment}</p>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};