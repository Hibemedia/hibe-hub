import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { motion, AnimatePresence } from "framer-motion";
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
  Smartphone,
  Palette,
  Type,
  GripVertical,
  Upload,
  Monitor,
  Moon,
  Sun,
  ShoppingCart,
  Play,
  Music,
  Heart,
  Star,
  ArrowUp,
  ArrowDown,
  Facebook,
  Twitter,
  Youtube,
  Linkedin,
  MessageCircle,
  Headphones,
  Music2,
  Clock,
  Image as ImageIcon,
  Quote
} from "lucide-react";

// Templates
const templates = [
  {
    id: "minimal",
    name: "Minimalistisch",
    description: "Clean en simpel design",
    colors: {
      background: "#ffffff",
      cardBackground: "#f8f9fa",
      primary: "#007bff",
      text: "#212529",
      secondary: "#6c757d"
    },
    buttonStyle: "rounded",
    font: "font-sans"
  },
  {
    id: "bold",
    name: "Bold",
    description: "Opvallend en kleurrijk",
    colors: {
      background: "#1a1a1a",
      cardBackground: "#2d2d2d",
      primary: "#ff6b35",
      text: "#ffffff",
      secondary: "#cccccc"
    },
    buttonStyle: "square",
    font: "font-bold"
  },
  {
    id: "cards",
    name: "Cards",
    description: "Moderne card-based layout",
    colors: {
      background: "#f5f5f5",
      cardBackground: "#ffffff",
      primary: "#8b5cf6",
      text: "#374151",
      secondary: "#6b7280"
    },
    buttonStyle: "rounded",
    font: "font-medium"
  },
  {
    id: "neon",
    name: "Neon",
    description: "Futuristische neon stijl",
    colors: {
      background: "#0f0f0f",
      cardBackground: "#1a1a1a",
      primary: "#00ff88",
      text: "#ffffff",
      secondary: "#88ff00"
    },
    buttonStyle: "rounded",
    font: "font-mono"
  },
  {
    id: "elegant",
    name: "Elegant",
    description: "Sophisticated en professioneel",
    colors: {
      background: "#fafafa",
      cardBackground: "#ffffff",
      primary: "#d4af37",
      text: "#2c2c2c",
      secondary: "#666666"
    },
    buttonStyle: "rounded",
    font: "font-serif"
  }
];

// Extended icon options
const iconOptions = [
  { value: "globe", label: "Website", icon: Globe },
  { value: "instagram", label: "Instagram", icon: Instagram },
  { value: "phone", label: "Telefoon", icon: Phone },
  { value: "mail", label: "Email", icon: Mail },
  { value: "calendar", label: "Afspraak", icon: Calendar },
  { value: "mappin", label: "Locatie", icon: MapPin },
  { value: "shopping", label: "Shop", icon: ShoppingCart },
  { value: "play", label: "Video", icon: Play },
  { value: "music", label: "Muziek", icon: Music },
  { value: "heart", label: "Favorieten", icon: Heart },
  { value: "star", label: "Reviews", icon: Star },
  { value: "facebook", label: "Facebook", icon: Facebook },
  { value: "twitter", label: "Twitter", icon: Twitter },
  { value: "youtube", label: "YouTube", icon: Youtube },
  { value: "linkedin", label: "LinkedIn", icon: Linkedin },
  { value: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { value: "spotify", label: "Spotify", icon: Headphones },
  { value: "tiktok", label: "TikTok", icon: Music2 }
];

// Social media platforms
const socialPlatforms = [
  { id: "instagram", name: "Instagram", icon: Instagram, placeholder: "https://instagram.com/gebruikersnaam" },
  { id: "facebook", name: "Facebook", icon: Facebook, placeholder: "https://facebook.com/pagina" },
  { id: "twitter", name: "Twitter", icon: Twitter, placeholder: "https://twitter.com/gebruikersnaam" },
  { id: "youtube", name: "YouTube", icon: Youtube, placeholder: "https://youtube.com/c/kanaal" },
  { id: "linkedin", name: "LinkedIn", icon: Linkedin, placeholder: "https://linkedin.com/in/profiel" },
  { id: "tiktok", name: "TikTok", icon: Music2, placeholder: "https://tiktok.com/@gebruikersnaam" },
  { id: "spotify", name: "Spotify", icon: Headphones, placeholder: "https://open.spotify.com/artist/id" },
  { id: "whatsapp", name: "WhatsApp", icon: MessageCircle, placeholder: "https://wa.me/31612345678" }
];

// Widget types
const widgetTypes = [
  { id: "text", name: "Tekstblok", icon: Quote, description: "Voeg een tekstblok of quote toe" },
  { id: "image", name: "Afbeelding", icon: ImageIcon, description: "Voeg een afbeelding toe" },
  { id: "countdown", name: "Countdown", icon: Clock, description: "Countdown timer voor events" },
  { id: "youtube", name: "YouTube Video", icon: Youtube, description: "Embed laatste YouTube video" },
  { id: "spotify", name: "Spotify Track", icon: Headphones, description: "Embed Spotify track/playlist" }
];

// Mock data
const mockProfiles = [
  {
    id: 1,
    name: "Barbershop Amsterdam",
    username: "barbershop-amsterdam",
    bio: "Premium barbershop in het hart van Amsterdam. Boek je afspraak nu!",
    profileImage: "https://images.unsplash.com/photo-1560472355-536de3962603?w=400&h=400&fit=crop&crop=face",
    backgroundImage: "",
    template: "minimal",
    isDarkMode: false,
    customColors: {
      background: "#ffffff",
      cardBackground: "#f8f9fa",
      primary: "#D9662F",
      text: "#212529",
      secondary: "#6c757d"
    },
    font: "font-sans",
    buttonStyle: "rounded",
    links: [
      { id: 1, label: "Boek Afspraak", url: "https://booking.com/barbershop", icon: "calendar", style: "primary", clicks: 1250, order: 1 },
      { id: 2, label: "Onze Services", url: "https://barbershop.nl/services", icon: "globe", style: "outline", clicks: 890, order: 2 },
      { id: 3, label: "Instagram", url: "https://instagram.com/barbershop_ams", icon: "instagram", style: "primary", clicks: 670, order: 3 }
    ],
    socialLinks: {
      instagram: "https://instagram.com/barbershop_ams",
      facebook: "https://facebook.com/barbershop.amsterdam",
      whatsapp: "https://wa.me/31612345678"
    },
    widgets: [
      { id: 1, type: "text", content: "Welkom bij de beste barbershop van Amsterdam!", order: 1 },
      { id: 2, type: "countdown", content: { endDate: "2024-12-31", title: "Nieuwjaarsactie eindigt over:" }, order: 2 }
    ],
    analytics: {
      totalClicks: 3210,
      totalViews: 18300,
      topLinks: [
        { name: "Boek Afspraak", clicks: 1250, percentage: 39 },
        { name: "Onze Services", clicks: 890, percentage: 28 },
        { name: "Instagram", clicks: 670, percentage: 21 }
      ],
      trafficSources: [
        { source: "Instagram", visitors: 8200, percentage: 45 },
        { source: "TikTok", visitors: 5500, percentage: 30 },
        { source: "Direct", visitors: 2800, percentage: 15 },
        { source: "Other", visitors: 1800, percentage: 10 }
      ]
    }
  }
];

export default function LinkInBio() {
  const [activeTab, setActiveTab] = useState("overview");
  const [isCreating, setIsCreating] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState("minimal");
  const [builderMode, setBuilderMode] = useState("basic");
  const fileInputRef = useRef(null);

  // Profile state
  const [currentProfile, setCurrentProfile] = useState({
    name: "",
    username: "",
    bio: "",
    profileImage: "",
    backgroundImage: "",
    template: "minimal",
    isDarkMode: false,
    customColors: templates[0].colors,
    font: "font-sans",
    buttonStyle: "rounded",
    links: [],
    socialLinks: {},
    widgets: []
  });

  // Form states
  const [newLink, setNewLink] = useState({
    label: "",
    url: "",
    icon: "globe",
    style: "primary"
  });

  const [draggedItem, setDraggedItem] = useState(null);

  // Optimized handlers with useCallback to prevent re-renders
  const handleProfileChange = useCallback((field, value) => {
    setCurrentProfile(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleNewLinkChange = useCallback((field, value) => {
    setNewLink(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleTemplateSelect = useCallback((template) => {
    setSelectedTemplate(template.id);
    setCurrentProfile(prev => ({
      ...prev,
      template: template.id,
      customColors: template.colors,
      font: template.font,
      buttonStyle: template.buttonStyle
    }));
  }, []);

  const handleAddLink = () => {
    if (!newLink.label || !newLink.url) return;
    
    const link = {
      id: Date.now(),
      ...newLink,
      clicks: 0,
      order: currentProfile.links.length + 1
    };
    
    setCurrentProfile({
      ...currentProfile,
      links: [...currentProfile.links, link]
    });
    
    setNewLink({ label: "", url: "", icon: "globe", style: "primary" });
  };

  const handleDeleteLink = (linkId) => {
    setCurrentProfile({
      ...currentProfile,
      links: currentProfile.links.filter(link => link.id !== linkId)
    });
  };

  const handleDragStart = (e, item, type) => {
    setDraggedItem({ item, type });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetIndex, type) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.type !== type) return;

    const items = type === 'link' ? currentProfile.links : currentProfile.widgets;
    const newItems = [...items];
    const draggedIndex = items.findIndex(item => item.id === draggedItem.item.id);
    
    if (draggedIndex !== -1) {
      const [draggedItem] = newItems.splice(draggedIndex, 1);
      newItems.splice(targetIndex, 0, draggedItem);
      
      // Update orders
      newItems.forEach((item, index) => {
        item.order = index + 1;
      });
      
      setCurrentProfile({
        ...currentProfile,
        [type === 'link' ? 'links' : 'widgets']: newItems
      });
    }
    
    setDraggedItem(null);
  };

  const handleSocialLinkChange = (platform, url) => {
    setCurrentProfile({
      ...currentProfile,
      socialLinks: {
        ...currentProfile.socialLinks,
        [platform]: url
      }
    });
  };

  const handleColorChange = (colorType, color) => {
    setCurrentProfile({
      ...currentProfile,
      customColors: {
        ...currentProfile.customColors,
        [colorType]: color
      }
    });
  };

  const getIconComponent = (iconName) => {
    const iconOption = iconOptions.find(opt => opt.value === iconName);
    return iconOption ? iconOption.icon : Globe;
  };

  const LivePreview = ({ profile }) => {
    const template = templates.find(t => t.id === profile.template) || templates[0];
    const colors = profile.customColors || template.colors;
    
    return (
      <div className="relative max-w-sm mx-auto bg-white border border-gray-200 rounded-3xl shadow-lg overflow-hidden">
        {/* Phone Frame */}
        <div className="relative">
          <div className="h-6 bg-gray-100 rounded-t-3xl flex items-center justify-center">
            <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
          </div>
          
          {/* Screen Content */}
          <div 
            className="min-h-[600px] p-6 overflow-y-auto"
            style={{ 
              backgroundColor: colors.background,
              backgroundImage: profile.backgroundImage ? `url(${profile.backgroundImage})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            {/* Profile Header */}
            <div className="text-center mb-6">
              <Avatar className="w-20 h-20 mx-auto mb-4 border-4 border-white shadow-lg">
                <AvatarImage src={profile.profileImage} />
                <AvatarFallback 
                  className="text-xl text-white"
                  style={{ backgroundColor: colors.primary }}
                >
                  {profile.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <h3 
                className={`text-lg font-bold ${profile.font}`}
                style={{ color: colors.text }}
              >
                {profile.name || "Jouw Naam"}
              </h3>
              <p 
                className="text-sm mt-1"
                style={{ color: colors.secondary }}
              >
                {profile.bio || "Jouw bio komt hier..."}
              </p>
            </div>

            {/* Social Media Icons */}
            {Object.keys(profile.socialLinks).filter(key => profile.socialLinks[key]).length > 0 && (
              <div className="flex justify-center gap-3 mb-6">
                {Object.entries(profile.socialLinks).map(([platform, url]) => {
                  if (!url) return null;
                  const platformData = socialPlatforms.find(p => p.id === platform);
                  if (!platformData) return null;
                  const IconComponent = platformData.icon;
                  
                  return (
                    <div 
                      key={platform}
                      className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
                      style={{ backgroundColor: colors.primary }}
                    >
                      <IconComponent className="h-5 w-5 text-white" />
                    </div>
                  );
                })}
              </div>
            )}

            {/* Links */}
            <div className="space-y-3">
              {profile.links.length > 0 ? (
                profile.links
                  .sort((a, b) => a.order - b.order)
                  .map((link) => {
                    const IconComponent = getIconComponent(link.icon);
                    const isOutline = link.style === 'outline';
                    
                    return (
                      <motion.div
                        key={link.id}
                        whileHover={{ scale: 1.02 }}
                        className={`flex items-center gap-3 p-3 cursor-pointer transition-all ${
                          profile.buttonStyle === 'rounded' ? 'rounded-lg' : 
                          profile.buttonStyle === 'square' ? 'rounded-none' : 'rounded-full'
                        }`}
                        style={{
                          backgroundColor: isOutline ? 'transparent' : colors.primary,
                          color: isOutline ? colors.primary : 'white',
                          border: isOutline ? `2px solid ${colors.primary}` : 'none'
                        }}
                      >
                        <IconComponent className="h-5 w-5" />
                        <span className={`font-medium ${profile.font}`}>
                          {link.label}
                        </span>
                      </motion.div>
                    );
                  })
              ) : (
                <div className="text-center py-8" style={{ color: colors.secondary }}>
                  <p className="text-sm">Nog geen links toegevoegd</p>
                </div>
              )}
            </div>

            {/* Widgets */}
            {profile.widgets.length > 0 && (
              <div className="mt-6 space-y-4">
                {profile.widgets
                  .sort((a, b) => a.order - b.order)
                  .map((widget) => {
                    if (widget.type === 'text') {
                      return (
                        <div 
                          key={widget.id}
                          className="p-4 rounded-lg"
                          style={{ 
                            backgroundColor: colors.cardBackground,
                            color: colors.text
                          }}
                        >
                          <p className={`text-sm ${profile.font}`}>
                            {widget.content}
                          </p>
                        </div>
                      );
                    }
                    
                    if (widget.type === 'countdown') {
                      return (
                        <div 
                          key={widget.id}
                          className="p-4 rounded-lg text-center"
                          style={{ 
                            backgroundColor: colors.cardBackground,
                            color: colors.text
                          }}
                        >
                          <p className={`text-sm mb-2 ${profile.font}`}>
                            {widget.content.title}
                          </p>
                          <div className="flex justify-center gap-2">
                            <div className="text-center">
                              <div className="text-lg font-bold" style={{ color: colors.primary }}>12</div>
                              <div className="text-xs">Dagen</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold" style={{ color: colors.primary }}>05</div>
                              <div className="text-xs">Uren</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold" style={{ color: colors.primary }}>30</div>
                              <div className="text-xs">Min</div>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    
                    return null;
                  })}
              </div>
            )}

            {/* Powered by Hibe Media */}
            <div className="mt-8 text-center">
              <p className="text-xs" style={{ color: colors.secondary }}>
                Powered by 
                <a href="https://hibemedia.com" className="ml-1 font-medium hover:underline" style={{ color: colors.primary }}>
                  Hibe Media
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const AdvancedBuilder = () => (
    <div className="space-y-6">
      {/* Template Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Kies een Template</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {templates.map((template) => (
              <div
                key={template.id}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedTemplate === template.id ? 'border-primary' : 'border-gray-200'
                }`}
                onClick={() => handleTemplateSelect(template)}
              >
                <div className="text-center">
                  <div 
                    className="w-full h-20 rounded-lg mb-2"
                    style={{ backgroundColor: template.colors.background }}
                  >
                    <div className="flex items-center justify-center h-full">
                      <div 
                        className="w-8 h-2 rounded"
                        style={{ backgroundColor: template.colors.primary }}
                      />
                    </div>
                  </div>
                  <h3 className="font-medium text-sm">{template.name}</h3>
                  <p className="text-xs text-gray-500">{template.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Basis Informatie</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Profiel Naam</Label>
            <Input
              id="name"
              placeholder="Jouw Naam"
              value={currentProfile.name}
              onChange={(e) => handleProfileChange('name', e.target.value)}
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
                placeholder="jouw-naam"
                value={currentProfile.username}
                onChange={(e) => handleProfileChange('username', e.target.value)}
                className="rounded-l-none"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="Vertel iets over jezelf..."
              value={currentProfile.bio}
              onChange={(e) => handleProfileChange('bio', e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="profileImage">Profielfoto</Label>
            <div className="flex gap-2">
              <Input
                id="profileImage"
                placeholder="https://example.com/foto.jpg"
                value={currentProfile.profileImage}
                onChange={(e) => handleProfileChange('profileImage', e.target.value)}
              />
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4" />
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  // In real app, upload to server and get URL
                  console.log("File selected:", e.target.files[0]);
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Links Management */}
      <Card>
        <CardHeader>
          <CardTitle>Links Beheren</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add new link */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                placeholder="Link naam"
                value={newLink.label}
                onChange={(e) => handleNewLinkChange('label', e.target.value)}
              />
              <Input
                placeholder="https://example.com"
                value={newLink.url}
                onChange={(e) => handleNewLinkChange('url', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Select value={newLink.icon} onValueChange={(value) => setNewLink({ ...newLink, icon: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Icoon" />
                </SelectTrigger>
                <SelectContent>
                  {iconOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <option.icon className="h-4 w-4" />
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={newLink.style} onValueChange={(value) => setNewLink({ ...newLink, style: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Stijl" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="primary">Gevuld</SelectItem>
                  <SelectItem value="outline">Omlijnd</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAddLink} className="w-full" disabled={!newLink.label || !newLink.url}>
              <Plus className="h-4 w-4 mr-2" />
              Link Toevoegen
            </Button>
          </div>

          {/* Existing links */}
          <div className="space-y-2">
            {currentProfile.links
              .sort((a, b) => a.order - b.order)
              .map((link, index) => {
                const IconComponent = getIconComponent(link.icon);
                return (
                  <div
                    key={link.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, link, 'link')}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index, 'link')}
                    className="flex items-center gap-3 p-3 border rounded-lg cursor-move hover:bg-gray-50"
                  >
                    <GripVertical className="h-4 w-4 text-gray-400" />
                    <IconComponent className="h-4 w-4 text-primary" />
                    <div className="flex-1">
                      <div className="font-medium">{link.label}</div>
                      <div className="text-sm text-gray-500">{link.url}</div>
                    </div>
                    <Badge variant={link.style === 'primary' ? 'default' : 'outline'}>
                      {link.style === 'primary' ? 'Gevuld' : 'Omlijnd'}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteLink(link.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>

      {/* Social Media */}
      <Card>
        <CardHeader>
          <CardTitle>Social Media</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {socialPlatforms.map((platform) => (
              <div key={platform.id} className="space-y-2">
                <Label className="flex items-center gap-2">
                  <platform.icon className="h-4 w-4" />
                  {platform.name}
                </Label>
                <Input
                  placeholder={platform.placeholder}
                  value={currentProfile.socialLinks[platform.id] || ''}
                  onChange={(e) => handleSocialLinkChange(platform.id, e.target.value)}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Styling */}
      <Card>
        <CardHeader>
          <CardTitle>Styling & Kleuren</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Achtergrondkleur</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={currentProfile.customColors.background}
                  onChange={(e) => handleColorChange('background', e.target.value)}
                  className="w-10 h-10 rounded border"
                />
                <Input
                  value={currentProfile.customColors.background}
                  onChange={(e) => handleColorChange('background', e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <Label>Primaire kleur</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={currentProfile.customColors.primary}
                  onChange={(e) => handleColorChange('primary', e.target.value)}
                  className="w-10 h-10 rounded border"
                />
                <Input
                  value={currentProfile.customColors.primary}
                  onChange={(e) => handleColorChange('primary', e.target.value)}
                />
              </div>
            </div>
          </div>
          
          <div>
            <Label>Knopvorm</Label>
            <Select 
              value={currentProfile.buttonStyle} 
              onValueChange={(value) => setCurrentProfile({ ...currentProfile, buttonStyle: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rounded">Afgerond</SelectItem>
                <SelectItem value="square">Vierkant</SelectItem>
                <SelectItem value="pill">Pill</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Lettertype</Label>
            <Select 
              value={currentProfile.font} 
              onValueChange={(value) => setCurrentProfile({ ...currentProfile, font: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="font-sans">Sans Serif</SelectItem>
                <SelectItem value="font-serif">Serif</SelectItem>
                <SelectItem value="font-mono">Monospace</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const Analytics = ({ profile }) => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{profile.analytics.totalClicks.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Totaal Clicks</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-success">{profile.analytics.totalViews.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Totaal Views</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-warning">
              {Math.round((profile.analytics.totalClicks / profile.analytics.totalViews) * 100)}%
            </div>
            <div className="text-sm text-muted-foreground">Click-through Rate</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Best Presterende Links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {profile.analytics.topLinks.map((link, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {index + 1}
                    </div>
                    <span className="font-medium">{link.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{link.clicks}</div>
                    <div className="text-sm text-muted-foreground">{link.percentage}%</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Verkeersbronnen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {profile.analytics.trafficSources.map((source, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-success rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {source.source.charAt(0)}
                    </div>
                    <span className="font-medium">{source.source}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{source.visitors.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">{source.percentage}%</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Link-in-Bio Builder</h1>
            <p className="text-gray-600 mt-1">
              Maak professionele Link-in-bio pagina's met geavanceerde functies
            </p>
          </div>
          <Button onClick={() => setIsCreating(true)} className="bg-orange-500 hover:bg-orange-600">
            <Plus className="h-4 w-4 mr-2" />
            Nieuw Profiel
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 px-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab("overview")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "overview"
                ? "border-orange-500 text-orange-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Overzicht
          </button>
          <button
            onClick={() => setActiveTab("builder")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "builder"
                ? "border-orange-500 text-orange-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Builder
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "analytics"
                ? "border-orange-500 text-orange-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Analytics
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-orange-500">4.1K</div>
                  <div className="text-sm text-gray-600">Totaal Clicks</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-500">21.4K</div>
                  <div className="text-sm text-gray-600">Totaal Views</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-500">19%</div>
                  <div className="text-sm text-gray-600">Click-through Rate</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-500">1</div>
                  <div className="text-sm text-gray-600">Actieve Profielen</div>
                </CardContent>
              </Card>
            </div>

            {/* Profiles */}
            <div className="space-y-4">
              {mockProfiles.map((profile) => (
                <Card key={profile.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={profile.profileImage} />
                          <AvatarFallback>{profile.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{profile.name}</CardTitle>
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                            hibe.bio/{profile.username}
                          </code>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-orange-500">
                          {profile.analytics.totalClicks.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600">Clicks</div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-500">
                          {profile.analytics.totalViews.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600">Views</div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-500">
                          {Math.round((profile.analytics.totalClicks / profile.analytics.totalViews) * 100)}%
                        </div>
                        <div className="text-sm text-gray-600">CTR</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === "builder" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Builder */}
            <div className="lg:col-span-2">
              <AdvancedBuilder />
            </div>
            
            {/* Live Preview */}
            <div className="lg:col-span-1">
              <div className="sticky top-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Smartphone className="h-5 w-5" />
                      Live Preview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <LivePreview profile={currentProfile} />
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        {activeTab === "analytics" && mockProfiles.length > 0 && (
          <Analytics profile={mockProfiles[0]} />
        )}
      </div>

      {/* Create Profile Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle>Nieuw Link-in-Bio Profiel Maken</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-h-[80vh] overflow-y-auto">
            <div className="space-y-4">
              <AdvancedBuilder />
              <div className="flex gap-2">
                <Button onClick={() => setIsCreating(false)} className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  Profiel Opslaan
                </Button>
                <Button variant="outline" onClick={() => setIsCreating(false)}>
                  Annuleren
                </Button>
              </div>
            </div>
            <div className="sticky top-0">
              <LivePreview profile={currentProfile} />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}