import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { 
  Calendar, 
  Plus, 
  Clock, 
  Users, 
  MapPin,
  Edit,
  FileText,
  Camera
} from "lucide-react";

const contentMoments = [
  {
    id: 1,
    date: "2024-01-20",
    time: "10:00",
    title: "Nieuwe trend kapsels",
    location: "Barbershop Amsterdam",
    attendees: ["Kapper", "Hibe Team"],
    status: "planned",
    script: "Focus op trendy fade cuts en moderne styling. Laat verschillende hoeken zien en leg technieken uit.",
    notes: "Neem extra verlichting mee voor close-ups"
  },
  {
    id: 2,
    date: "2024-01-25",
    time: "14:30",
    title: "Product showcase",
    location: "Barbershop Amsterdam",
    attendees: ["Kapper", "Hibe Team"],
    status: "confirmed",
    script: "Toon nieuwe producten en leg voordelen uit. Demonstreer gebruik op verschillende haartypes.",
    notes: "Klant heeft nieuwe productlijn ontvangen"
  },
  {
    id: 3,
    date: "2024-02-01",
    time: "09:00",
    title: "Before & After content",
    location: "Barbershop Amsterdam",
    attendees: ["Kapper", "Hibe Team", "Model"],
    status: "requested",
    script: "Dramatische transformatie content. Start met 'before' shots en bouw spanning op.",
    notes: "Model heeft zeer lang haar - perfecte transformatie mogelijkheid"
  }
];

export default function ContentMoments() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-success text-success-foreground';
      case 'planned':
        return 'bg-primary text-primary-foreground';
      case 'requested':
        return 'bg-warning text-warning-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Bevestigd';
      case 'planned':
        return 'Gepland';
      case 'requested':
        return 'Aangevraagd';
      default:
        return 'Onbekend';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Contentmomenten</h1>
          <p className="text-muted-foreground mt-1">
            Plan en beheer je content draaidagen
          </p>
        </div>
        <Button className="bg-gradient-primary hover:bg-gradient-to-r hover:from-primary-dark hover:to-primary shadow-primary">
          <Plus className="h-4 w-4 mr-2" />
          Nieuwe Contentdag
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">3</div>
            <div className="text-sm text-muted-foreground">Geplande sessies</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-success">1</div>
            <div className="text-sm text-muted-foreground">Bevestigd</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-warning">1</div>
            <div className="text-sm text-muted-foreground">Aangevraagd</div>
          </CardContent>
        </Card>
      </div>

      {/* Content Moments */}
      <div className="space-y-4">
        {contentMoments.map((moment) => (
          <Card key={moment.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Camera className="h-5 w-5 text-primary" />
                    {moment.title}
                  </CardTitle>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(moment.date).toLocaleDateString('nl-NL', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {moment.time}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {moment.location}
                    </div>
                  </div>
                </div>
                <Badge className={getStatusColor(moment.status)}>
                  {getStatusText(moment.status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Script & Notes */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      Script
                    </h4>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm">{moment.script}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">Opmerkingen</h4>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">{moment.notes}</p>
                    </div>
                  </div>
                </div>

                {/* Right Column - Attendees & Actions */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      Aanwezigen
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {moment.attendees.map((attendee, index) => (
                        <Badge key={index} variant="outline">
                          {attendee}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Add Note Section */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Opmerking toevoegen</h4>
                    <div className="space-y-2">
                      <Textarea 
                        placeholder="Speciale wensen, producten, of andere opmerkingen..."
                        className="min-h-[80px]"
                      />
                      <Button size="sm" variant="outline" className="w-full">
                        Opmerking Toevoegen
                      </Button>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1">
                      <Edit className="h-4 w-4 mr-2" />
                      Bewerken
                    </Button>
                    {moment.status === 'requested' && (
                      <Button className="flex-1 bg-success hover:bg-success/90">
                        Bevestigen
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Request New Content Day */}
      <Card>
        <CardHeader>
          <CardTitle>Nieuwe Contentdag Aanvragen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Gewenste datum</label>
              <Input type="date" />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Gewenste tijd</label>
              <Input type="time" />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-2 block">Concept/Idee</label>
              <Textarea placeholder="Beschrijf je idee voor deze contentdag..." />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-2 block">Speciale wensen</label>
              <Textarea placeholder="Speciale producten, modellen, of andere wensen..." />
            </div>
            <div className="md:col-span-2">
              <Button className="bg-gradient-primary hover:bg-gradient-to-r hover:from-primary-dark hover:to-primary shadow-primary">
                Contentdag Aanvragen
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}