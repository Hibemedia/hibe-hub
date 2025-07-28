import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminSettings() {
  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Instellingen</h1>
          <p className="text-muted-foreground mt-2">
            Beheer systeem instellingen en configuratie
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Admin Instellingen</CardTitle>
            <CardDescription>
              Deze pagina is nog in ontwikkeling
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Hier komen binnenkort de admin configuratie-opties.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}