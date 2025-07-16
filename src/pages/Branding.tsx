import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Archive, 
  Download, 
  Search, 
  Filter,
  Calendar,
  Play,
  Image,
  FileText,
  Palette,
  Eye
} from "lucide-react";

const brandingFiles = [
  {
    id: 1,
    name: "Logo Package",
    type: "logo",
    size: "2.4 MB",
    lastModified: "2024-01-10",
    format: "ZIP"
  },
  {
    id: 2,
    name: "Brand Guidelines",
    type: "document",
    size: "1.2 MB",
    lastModified: "2024-01-08",
    format: "PDF"
  },
  {
    id: 3,
    name: "Color Palette",
    type: "colors",
    size: "145 KB",
    lastModified: "2024-01-05",
    format: "ASE"
  },
  {
    id: 4,
    name: "Font Files",
    type: "fonts",
    size: "892 KB",
    lastModified: "2024-01-03",
    format: "OTF"
  }
];

const archivedVideos = [
  {
    id: 1,
    title: "Beste kniptechnieken voor krullend haar",
    platform: "TikTok",
    publishDate: "2024-01-15",
    views: "125K",
    status: "published",
    thumbnail: "🎬"
  },
  {
    id: 2,
    title: "Barbershop morning routine",
    platform: "Instagram",
    publishDate: "2024-01-14",
    views: "89K",
    status: "published",
    thumbnail: "🎬"
  },
  {
    id: 3,
    title: "Fade tutorial voor beginners",
    platform: "YouTube",
    publishDate: "2024-01-13",
    views: "67K",
    status: "published",
    thumbnail: "🎬"
  },
  {
    id: 4,
    title: "Trending kapsel deze week",
    platform: "TikTok",
    publishDate: "2024-01-12",
    views: "45K",
    status: "scheduled",
    thumbnail: "🎬"
  }
];

export default function Branding() {
  const getFileIcon = (type: string) => {
    switch (type) {
      case 'logo':
        return Image;
      case 'document':
        return FileText;
      case 'colors':
        return Palette;
      case 'fonts':
        return FileText;
      default:
        return Archive;
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'TikTok':
        return 'bg-black text-white';
      case 'Instagram':
        return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white';
      case 'YouTube':
        return 'bg-red-500 text-white';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-success text-success-foreground';
      case 'scheduled':
        return 'bg-warning text-warning-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Branding & Archief</h1>
          <p className="text-muted-foreground mt-1">
            Jouw merkdocumenten en contentarchief
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button className="bg-gradient-primary hover:bg-gradient-to-r hover:from-primary-dark hover:to-primary shadow-primary">
            <Download className="h-4 w-4 mr-2" />
            Download Alles
          </Button>
        </div>
      </div>

      {/* Branding Files */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            Branding Materiaal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {brandingFiles.map((file) => {
              const IconComponent = getFileIcon(file.type);
              return (
                <div key={file.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <IconComponent className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground">{file.name}</h3>
                      <p className="text-sm text-muted-foreground">{file.format} • {file.size}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {new Date(file.lastModified).toLocaleDateString('nl-NL')}
                    </span>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Content Archive */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Archive className="h-5 w-5 text-primary" />
              Content Archief
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Zoek video's..."
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {archivedVideos.map((video) => (
              <div key={video.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="w-16 h-16 bg-gradient-primary rounded-lg flex items-center justify-center text-2xl">
                  {video.thumbnail}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-foreground">{video.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={getPlatformColor(video.platform)}>
                      {video.platform}
                    </Badge>
                    <Badge className={getStatusColor(video.status)}>
                      {video.status === 'published' ? 'Gepubliceerd' : 'Ingepland'}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-foreground">{video.views} views</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(video.publishDate).toLocaleDateString('nl-NL')}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Play className="h-4 w-4 mr-2" />
                    Bekijk
                  </Button>
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}