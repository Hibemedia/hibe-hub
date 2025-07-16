import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, MessageSquare, Play } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface Video {
  id: string;
  title: string;
  url: string;
  platform: string;
  status: string;
  caption?: string;
  created_at: string;
  client_id: string;
  users?: {
    email: string;
    profiles?: {
      full_name?: string;
    }[];
  };
}

interface Client {
  id: string;
  email: string;
  profiles?: {
    full_name?: string;
  }[];
}

export const VideoManagement = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [newVideo, setNewVideo] = useState({
    title: '',
    url: '',
    platform: '',
    caption: '',
    client_id: ''
  });
  const [feedback, setFeedback] = useState({
    timestamp_seconds: 0,
    comment: ''
  });
  const { toast } = useToast();

  const fetchVideos = async () => {
    try {
      const { data, error } = await supabase
        .from('videos')
        .select(`
          *,
          users!client_id(
            email,
            profiles(full_name)
          )
        `)
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

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          email,
          profiles(full_name)
        `)
        .eq('role', 'client');

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  useEffect(() => {
    fetchVideos();
    fetchClients();
  }, []);

  const handleCreateVideo = async () => {
    try {
      const { error } = await supabase
        .from('videos')
        .insert({
          title: newVideo.title,
          url: newVideo.url,
          platform: newVideo.platform,
          caption: newVideo.caption,
          client_id: newVideo.client_id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Video created successfully"
      });

      setIsCreateDialogOpen(false);
      setNewVideo({ title: '', url: '', platform: '', caption: '', client_id: '' });
      fetchVideos();
    } catch (error: any) {
      console.error('Error creating video:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create video",
        variant: "destructive"
      });
    }
  };

  const handleAddFeedback = async () => {
    if (!selectedVideo) return;

    try {
      const { data: currentUser } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('video_feedback')
        .insert({
          video_id: selectedVideo.id,
          timestamp_seconds: feedback.timestamp_seconds,
          comment: feedback.comment,
          created_by: currentUser.user?.id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Feedback added successfully"
      });

      setIsFeedbackDialogOpen(false);
      setFeedback({ timestamp_seconds: 0, comment: '' });
      setSelectedVideo(null);
    } catch (error: any) {
      console.error('Error adding feedback:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add feedback",
        variant: "destructive"
      });
    }
  };

  const handleUpdateVideoStatus = async (videoId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('videos')
        .update({ status: newStatus })
        .eq('id', videoId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Video status updated"
      });

      fetchVideos();
    } catch (error: any) {
      console.error('Error updating video status:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update video status",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500';
      case 'rejected': return 'bg-red-500';
      case 'revision': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return <div className="flex justify-center py-8">Loading videos...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Video Management</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Video
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload New Video</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="client">Client</Label>
                <Select value={newVideo.client_id} onValueChange={(value) => setNewVideo({ ...newVideo, client_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.profiles?.[0]?.full_name || client.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newVideo.title}
                  onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })}
                  placeholder="Video title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  value={newVideo.url}
                  onChange={(e) => setNewVideo({ ...newVideo, url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="platform">Platform</Label>
                <Select value={newVideo.platform} onValueChange={(value) => setNewVideo({ ...newVideo, platform: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="caption">Caption</Label>
                <Textarea
                  id="caption"
                  value={newVideo.caption}
                  onChange={(e) => setNewVideo({ ...newVideo, caption: e.target.value })}
                  placeholder="Video caption..."
                />
              </div>
              <Button onClick={handleCreateVideo} className="w-full">
                Upload Video
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Videos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {videos.map((video) => (
                <TableRow key={video.id}>
                  <TableCell className="font-medium">{video.title}</TableCell>
                  <TableCell>
                    {video.users?.profiles?.[0]?.full_name || video.users?.email}
                  </TableCell>
                  <TableCell className="capitalize">{video.platform}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(video.status)}>
                      {video.status}
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
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedVideo(video);
                          setIsFeedbackDialogOpen(true);
                        }}
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                      <Select 
                        value={video.status} 
                        onValueChange={(value) => handleUpdateVideoStatus(video.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="waiting">Waiting</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                          <SelectItem value="revision">Revision</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isFeedbackDialogOpen} onOpenChange={setIsFeedbackDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Feedback</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="timestamp">Timestamp (seconds)</Label>
              <Input
                id="timestamp"
                type="number"
                value={feedback.timestamp_seconds}
                onChange={(e) => setFeedback({ ...feedback, timestamp_seconds: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="comment">Comment</Label>
              <Textarea
                id="comment"
                value={feedback.comment}
                onChange={(e) => setFeedback({ ...feedback, comment: e.target.value })}
                placeholder="Add your feedback here..."
              />
            </div>
            <Button onClick={handleAddFeedback} className="w-full">
              Add Feedback
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};