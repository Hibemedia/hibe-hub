import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Link as LinkIcon, 
  Plus, 
  Edit, 
  BarChart3, 
  Eye,
  ExternalLink,
  Copy,
  Settings,
  Trash2,
  Instagram,
  Globe,
  Phone,
  Mail,
  MapPin,
  Calendar,
  User,
  Camera,
  Save,
  Smartphone
} from "lucide-react";

// Mock data for existing profiles
const linkInBioProfiles = [
  {
    id: 1,
    name: "Barbershop Amsterdam",
    username: "barbershop-amsterdam",
    bio: "Premium barbershop in het hart van Amsterdam. Boek je afspraak nu!",
    profileImage: "https://images.unsplash.com/photo-1560472355-536de3962603?w=400&h=400&fit=crop&crop=face",
    clicks: "3.2K",
    views: "18.3K",
    status: "active",
    links: [
      { id: 1, label: "Boek Afspraak", url: "https://booking.com/barbershop", icon: "calendar", clicks: 1250 },
      { id: 2, label: "Onze Services", url: "https://barbershop.nl/services", icon: "globe", clicks: 890 },
      { id: 3, label: "Instagram", url: "https://instagram.com/barbershop_ams", icon: "instagram", clicks: 670 },
      { id: 4, label: "Bel Ons", url: "tel:+31201234567", icon: "phone", clicks: 320 }
    ]
  },
  {
    id: 2,
    name: "Nieuwjaars Actie",
    username: "barbershop-newyear",
    bio: "Speciale aanbieding voor januari! 20% korting op alle treatments.",
    profileImage: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400&h=400&fit=crop&crop=face",
    clicks: "856",
    views: "3.1K",
    status: "active",
    links: [
      { id: 1, label: "20% Korting - Boek Nu", url: "https://booking.com/special", icon: "calendar", clicks: 520 },
      { id: 2, label: "Onze Locatie", url: "https://maps.google.com/barbershop", icon: "mappin", clicks: 336 }
    ]
  }
];

const iconOptions = [
  { value: "globe", label: "Website", icon: Globe },
  { value: "instagram", label: "Instagram", icon: Instagram },
  { value: "phone", label: "Telefoon", icon: Phone },
  { value: "mail", label: "Email", icon: Mail },
  { value: "calendar", label: "Afspraak", icon: Calendar },
  { value: "mappin", label: "Locatie", icon: MapPin }
];

export default function LinkInBio() {
  const [isCreating, setIsCreating] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [previewProfile, setPreviewProfile] = useState(null);
  const [newProfile, setNewProfile] = useState({
    name: "",
    username: "",
    bio: "",
    profileImage: "",
    links: []
  });
  const [newLink, setNewLink] = useState({
    label: "",
    url: "",
    icon: "globe"
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-success text-success-foreground';
      case 'inactive':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getIconComponent = (iconName: string) => {
    const iconOption = iconOptions.find(opt => opt.value === iconName);
    return iconOption ? iconOption.icon : Globe;
  };

  const handleCreateProfile = () => {
    if (!newProfile.name || !newProfile.username) return;
    
    const profile = {
      id: Date.now(),
      ...newProfile,
      clicks: "0",
      views: "0",
      status: "active",
      links: []
    };
    
    // In real app, save to database
    console.log("New profile created:", profile);
    setIsCreating(false);
    setNewProfile({ name: "", username: "", bio: "", profileImage: "", links: [] });
  };

  const handleAddLink = (profileId: number) => {
    if (!newLink.label || !newLink.url) return;
    
    const link = {
      id: Date.now(),
      ...newLink,
      clicks: 0
    };
    
    // In real app, add to database
    console.log("New link added:", link);
    setNewLink({ label: "", url: "", icon: "globe" });
  };

  const LivePreview = ({ profile }) => (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-lg border max-w-sm mx-auto">
      <div className="text-center mb-6">
        <Avatar className="w-20 h-20 mx-auto mb-4 border-4 border-white shadow-lg">
          <AvatarImage src={profile.profileImage} />
          <AvatarFallback className="bg-gradient-primary text-white text-xl">
            {profile.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <h3 className="text-lg font-bold text-gray-800">{profile.name}</h3>
        <p className="text-sm text-gray-600 mt-1">{profile.bio}</p>
      </div>
      
    <div className="space-y-3">
      {profile.links && profile.links.length > 0 ? (
        profile.links.map((link) => {
          const IconComponent = getIconComponent(link.icon);
          return (
            <div 
              key={link.id}
              className="flex items-center gap-3 p-3 bg-white rounded-lg border hover:shadow-md transition-shadow cursor-pointer"
            >
              <IconComponent className="h-5 w-5 text-primary" />
              <span className="font-medium text-gray-800">{link.label}</span>
            </div>
          );
        })
      ) : (
        <div className="text-center py-4 text-gray-500">
          <p className="text-sm">Nog geen links toegevoegd</p>
        </div>
      )}
    </div>
      
      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500">Powered by Hibe Media</p>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Link in Bio Generator</h1>
          <p className="text-muted-foreground mt-1">
            Maak professionele Link-in-bio pagina's voor je social media
          </p>
        </div>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary hover:bg-gradient-to-r hover:from-primary-dark hover:to-primary shadow-primary">
              <Plus className="h-4 w-4 mr-2" />
              Nieuw Profiel
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Nieuw Link-in-Bio Profiel Maken</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Creation Form */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Profiel Naam</Label>
                  <Input
                    id="name"
                    placeholder="Barbershop Amsterdam"
                    value={newProfile.name}
                    onChange={(e) => setNewProfile({ ...newProfile, name: e.target.value })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="username">Gebruikersnaam (URL)</Label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 text-sm border border-r-0 rounded-l-md bg-muted text-muted-foreground">
                      hibe.bio/
                    </span>
                    <Input
                      id="username"
                      placeholder="barbershop-amsterdam"
                      value={newProfile.username}
                      onChange={(e) => setNewProfile({ ...newProfile, username: e.target.value })}
                      className="rounded-l-none"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Jouw pagina wordt beschikbaar op: hibe.bio/{newProfile.username}
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Beschrijf je business in een paar zinnen..."
                    value={newProfile.bio}
                    onChange={(e) => setNewProfile({ ...newProfile, bio: e.target.value })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="profileImage">Profielfoto URL</Label>
                  <Input
                    id="profileImage"
                    placeholder="https://example.com/profile.jpg"
                    value={newProfile.profileImage}
                    onChange={(e) => setNewProfile({ ...newProfile, profileImage: e.target.value })}
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={handleCreateProfile} className="flex-1">
                    <Save className="h-4 w-4 mr-2" />
                    Profiel Maken
                  </Button>
                  <Button variant="outline" onClick={() => setIsCreating(false)}>
                    Annuleren
                  </Button>
                </div>
              </div>
              
              {/* Live Preview */}
              <div>
                <Label>Live Preview</Label>
                <div className="mt-2 bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-4">
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Mobiele Preview</span>
                  </div>
                  <LivePreview profile={newProfile} />
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">4.1K</div>
            <div className="text-sm text-muted-foreground">Totaal Clicks</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-success">21.4K</div>
            <div className="text-sm text-muted-foreground">Totaal Views</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-warning">19%</div>
            <div className="text-sm text-muted-foreground">Click-through Rate</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-accent">2</div>
            <div className="text-sm text-muted-foreground">Actieve Profielen</div>
          </CardContent>
        </Card>
      </div>

      {/* Link-in-bio Profiles */}
      <div className="space-y-4">
        {linkInBioProfiles.map((profile) => (
          <Card key={profile.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="w-12 h-12 border-2 border-border">
                    <AvatarImage src={profile.profileImage} />
                    <AvatarFallback className="bg-gradient-primary text-white">
                      {profile.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{profile.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        hibe.bio/{profile.username}
                      </code>
                      <Badge className={getStatusColor(profile.status)}>
                        {profile.status === 'active' ? 'Actief' : 'Inactief'}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(`https://hibe.bio/${profile.username}`)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => window.open(`https://hibe.bio/${profile.username}`, '_blank')}>
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Preview: {profile.name}</DialogTitle>
                      </DialogHeader>
                      <div className="flex justify-center">
                        <LivePreview profile={profile} />
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button size="sm" variant="outline">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="stats" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="stats">Statistieken</TabsTrigger>
                  <TabsTrigger value="links">Links ({profile.links.length})</TabsTrigger>
                  <TabsTrigger value="bio">Bio</TabsTrigger>
                </TabsList>
                
                <TabsContent value="stats" className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-primary">{profile.clicks}</div>
                      <div className="text-sm text-muted-foreground">Clicks</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-success">{profile.views}</div>
                      <div className="text-sm text-muted-foreground">Views</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-warning">
                        {Math.round((parseInt(profile.clicks.replace('K', '000')) / parseInt(profile.views.replace('K', '000'))) * 100)}%
                      </div>
                      <div className="text-sm text-muted-foreground">CTR</div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="links" className="space-y-4">
                  <div className="space-y-3">
                    {profile.links.map((link) => {
                      const IconComponent = getIconComponent(link.icon);
                      return (
                        <div key={link.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <IconComponent className="h-4 w-4 text-primary" />
                            <div>
                              <div className="font-medium">{link.label}</div>
                              <div className="text-sm text-muted-foreground">{link.url}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{link.clicks} clicks</Badge>
                            <Button size="sm" variant="outline">
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="outline" className="text-destructive">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Add new link form */}
                    <div className="border-2 border-dashed border-muted rounded-lg p-4 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <Input
                          placeholder="Link label"
                          value={newLink.label}
                          onChange={(e) => setNewLink({ ...newLink, label: e.target.value })}
                        />
                        <Input
                          placeholder="URL"
                          value={newLink.url}
                          onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                        />
                        <select 
                          className="px-3 py-2 border rounded-md"
                          value={newLink.icon}
                          onChange={(e) => setNewLink({ ...newLink, icon: e.target.value })}
                        >
                          {iconOptions.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </div>
                      <Button 
                        onClick={() => handleAddLink(profile.id)}
                        className="w-full"
                        disabled={!newLink.label || !newLink.url}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Link Toevoegen
                      </Button>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="bio" className="space-y-4">
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <p className="text-sm">{profile.bio}</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Bio Bewerken
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}