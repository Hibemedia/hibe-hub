import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Link as LinkIcon, 
  Plus, 
  Edit, 
  BarChart3, 
  Eye,
  ExternalLink,
  Copy,
  Settings,
  Trash2
} from "lucide-react";

const linkInBioPages = [
  {
    id: 1,
    title: "Barbershop Amsterdam - Hoofdpagina",
    url: "hibemedia.com/barbershop-amsterdam",
    clicks: "2.4K",
    views: "15.2K",
    lastUpdated: "2024-01-15",
    status: "active",
    links: [
      { title: "Boek Afspraak", url: "booking.com", clicks: 1250 },
      { title: "Onze Services", url: "services.html", clicks: 890 },
      { title: "Instagram", url: "instagram.com", clicks: 670 }
    ]
  },
  {
    id: 2,
    title: "Nieuwjaars Actie",
    url: "hibemedia.com/barbershop-newyear",
    clicks: "856",
    views: "3.1K",
    lastUpdated: "2024-01-10",
    status: "active",
    links: [
      { title: "20% Korting", url: "special-offer.html", clicks: 420 },
      { title: "Boek Nu", url: "booking.com", clicks: 310 }
    ]
  }
];

const platformStats = [
  { platform: "Instagram", clicks: 1450, percentage: 45 },
  { platform: "TikTok", clicks: 980, percentage: 30 },
  { platform: "Facebook", clicks: 520, percentage: 16 },
  { platform: "Direct", clicks: 290, percentage: 9 }
];

export default function LinkInBio() {
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Link in Bio</h1>
          <p className="text-muted-foreground mt-1">
            Maak en beheer je eigen Link-in-bio pagina's
          </p>
        </div>
        <Button className="bg-gradient-primary hover:bg-gradient-to-r hover:from-primary-dark hover:to-primary shadow-primary">
          <Plus className="h-4 w-4 mr-2" />
          Nieuwe Link-in-bio
        </Button>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">3.3K</div>
            <div className="text-sm text-muted-foreground">Totaal Clicks</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-success">18.3K</div>
            <div className="text-sm text-muted-foreground">Totaal Views</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-warning">18%</div>
            <div className="text-sm text-muted-foreground">Click-through Rate</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-accent">2</div>
            <div className="text-sm text-muted-foreground">Actieve Pagina's</div>
          </CardContent>
        </Card>
      </div>

      {/* Platform Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Traffic per Platform
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {platformStats.map((stat) => (
              <div key={stat.platform} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <LinkIcon className="h-4 w-4 text-primary" />
                  </div>
                  <span className="font-medium">{stat.platform}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-muted rounded-full">
                      <div 
                        className="h-2 bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${stat.percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground">{stat.percentage}%</span>
                  </div>
                  <span className="font-medium text-foreground">{stat.clicks} clicks</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Link-in-bio Pages */}
      <div className="space-y-4">
        {linkInBioPages.map((page) => (
          <Card key={page.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{page.title}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {page.url}
                    </code>
                    <Badge className={getStatusColor(page.status)}>
                      {page.status === 'active' ? 'Actief' : 'Inactief'}
                    </Badge>
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
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Stats */}
                <div>
                  <h4 className="text-sm font-medium mb-3">Statistieken</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 border rounded-lg">
                      <div className="text-lg font-bold text-primary">{page.clicks}</div>
                      <div className="text-xs text-muted-foreground">Clicks</div>
                    </div>
                    <div className="text-center p-3 border rounded-lg">
                      <div className="text-lg font-bold text-success">{page.views}</div>
                      <div className="text-xs text-muted-foreground">Views</div>
                    </div>
                    <div className="text-center p-3 border rounded-lg">
                      <div className="text-lg font-bold text-warning">
                        {Math.round((parseInt(page.clicks.replace('K', '000')) / parseInt(page.views.replace('K', '000'))) * 100)}%
                      </div>
                      <div className="text-xs text-muted-foreground">CTR</div>
                    </div>
                  </div>
                </div>

                {/* Links Performance */}
                <div>
                  <h4 className="text-sm font-medium mb-3">Link Performance</h4>
                  <div className="space-y-2">
                    {page.links.map((link, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <LinkIcon className="h-3 w-3 text-primary" />
                          <span className="text-sm font-medium">{link.title}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">{link.clicks} clicks</span>
                          <Button size="sm" variant="outline" className="h-6 w-6 p-0">
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center mt-4 pt-4 border-t">
                <span className="text-sm text-muted-foreground">
                  Laatst bijgewerkt: {new Date(page.lastUpdated).toLocaleDateString('nl-NL')}
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Bewerken
                  </Button>
                  <Button variant="outline" size="sm" className="text-destructive border-destructive/20 hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Verwijderen
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create New Link-in-bio */}
      <Card>
        <CardHeader>
          <CardTitle>Nieuwe Link-in-bio Maken</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Pagina Titel</label>
              <Input placeholder="Bijvoorbeeld: Zomer Actie 2024" />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">URL Slug</label>
              <div className="flex">
                <span className="inline-flex items-center px-3 text-sm border border-r-0 rounded-l-md bg-muted text-muted-foreground">
                  hibemedia.com/
                </span>
                <Input placeholder="zomer-actie-2024" className="rounded-l-none" />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-2 block">Beschrijving</label>
              <Textarea placeholder="Korte beschrijving van deze Link-in-bio pagina..." />
            </div>
            <div className="md:col-span-2">
              <Button className="bg-gradient-primary hover:bg-gradient-to-r hover:from-primary-dark hover:to-primary shadow-primary">
                <Plus className="h-4 w-4 mr-2" />
                Pagina Aanmaken
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}