import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  User,
  Bell,
  Shield,
  Palette,
  Mail,
  Phone,
  Building,
  Save
} from "lucide-react";

import { UserAuth } from "@/context/AuthContext.jsx";
import GebruikersBeheer from "./GebruikersBeheer";

export default function Settings() {
  const { isAdmin } = UserAuth();

  const [admin, setAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      const result = await isAdmin();
      setAdmin(result?.is_admin === true || result === true);
      setLoading(false);
    };

    checkAdmin();
  }, [isAdmin]);

  if (loading) {
    return <div className="p-6">Loading settings…</div>;
  }

  // ✅ ADMIN-ONLY VIEW
  if (admin) {
    return <GebruikersBeheer />;
  }

  // ✅ NORMAL USER VIEW
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
        <Button>
          <Save className="h-4 w-4 mr-2" />
          Wijzigingen Opslaan
        </Button>
      </div>

      {/* Account Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Account Informatie
          </CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <Input placeholder="Bedrijfsnaam" />
          <Input placeholder="Contactpersoon" />
          <Input type="email" placeholder="E-mailadres" />
          <Input type="tel" placeholder="Telefoonnummer" />
          <Textarea className="md:col-span-2" placeholder="Adres" />
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificaties
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Toggle label="Email notificaties" />
          <Toggle label="Video goedkeuring" />
          <Toggle label="Performance updates" />
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Beveiliging
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input type="password" placeholder="Huidig wachtwoord" />
          <Input type="password" placeholder="Nieuw wachtwoord" />
          <Input type="password" placeholder="Bevestig wachtwoord" />
          <Button variant="outline">Wachtwoord wijzigen</Button>
        </CardContent>
      </Card>

      {/* Branding */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Brand voorkeuren
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input type="color" />
          <Input placeholder="Logo URL" />
          <Input placeholder="Tagline" />
        </CardContent>
      </Card>

      {/* Support */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Contact & Support
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4" /> support@hibemedia.com
          </p>
          <p className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4" /> +31 20 123 4567
          </p>
          <Button variant="outline">
            <Building className="h-4 w-4 mr-2" />
            Bezoek Hibe Media
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function Toggle({ label }) {
  return (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      <Switch defaultChecked />
    </div>
  );
}
