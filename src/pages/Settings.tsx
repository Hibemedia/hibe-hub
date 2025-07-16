import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Shield, 
  Palette,
  Mail,
  Phone,
  Building,
  Save
} from "lucide-react";

export default function Settings() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Instellingen</h1>
          <p className="text-muted-foreground mt-1">
            Beheer je account en voorkeuren
          </p>
        </div>
        <Button className="bg-gradient-primary hover:bg-gradient-to-r hover:from-primary-dark hover:to-primary shadow-primary">
          <Save className="h-4 w-4 mr-2" />
          Wijzigingen Opslaan
        </Button>
      </div>

      {/* Account Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Account Informatie
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Bedrijfsnaam</label>
              <Input defaultValue="Barbershop Amsterdam" />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Contactpersoon</label>
              <Input defaultValue="John Doe" />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">E-mailadres</label>
              <Input type="email" defaultValue="john@barbershop-amsterdam.nl" />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Telefoonnummer</label>
              <Input type="tel" defaultValue="+31 20 123 4567" />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-2 block">Adres</label>
              <Textarea defaultValue="Hoofdstraat 123, 1011 AB Amsterdam" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Notificaties
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Email notificaties</h4>
                <p className="text-sm text-muted-foreground">Ontvang updates over je content per email</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Video goedkeuring</h4>
                <p className="text-sm text-muted-foreground">Notificatie wanneer video's klaar zijn voor goedkeuring</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Performance updates</h4>
                <p className="text-sm text-muted-foreground">Wekelijkse rapportage van je content prestaties</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Nieuwe medailles</h4>
                <p className="text-sm text-muted-foreground">Notificatie wanneer je een nieuwe medaille behaalt</p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Beveiliging
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Huidig wachtwoord</label>
              <Input type="password" placeholder="Voer je huidige wachtwoord in" />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Nieuw wachtwoord</label>
              <Input type="password" placeholder="Voer je nieuwe wachtwoord in" />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Bevestig nieuw wachtwoord</label>
              <Input type="password" placeholder="Bevestig je nieuwe wachtwoord" />
            </div>
            <Button variant="outline">
              Wachtwoord Wijzigen
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Brand Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            Brand Voorkeuren
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Primaire merkkleur</label>
              <div className="flex items-center gap-2">
                <Input type="color" defaultValue="#8B5CF6" className="w-16 h-10" />
                <Input defaultValue="#8B5CF6" className="flex-1" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Secundaire merkkleur</label>
              <div className="flex items-center gap-2">
                <Input type="color" defaultValue="#F59E0B" className="w-16 h-10" />
                <Input defaultValue="#F59E0B" className="flex-1" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Logo URL</label>
              <Input placeholder="https://example.com/logo.png" />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Tagline</label>
              <Input defaultValue="De beste barbershop van Amsterdam" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact & Support */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Contact & Support
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Hibe Media Team</h4>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>support@hibemedia.com</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>+31 20 123 4567</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Mail className="h-4 w-4 mr-2" />
                Contact Support
              </Button>
              <Button variant="outline">
                <Building className="h-4 w-4 mr-2" />
                Bezoek Hibe Media
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}