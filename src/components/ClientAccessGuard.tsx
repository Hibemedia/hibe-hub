import { ReactNode } from 'react';
import { useAuth } from '@/lib/auth/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

interface ClientAccessGuardProps {
  children: ReactNode;
  allowSettingsPage?: boolean;
}

export function ClientAccessGuard({ children, allowSettingsPage = false }: ClientAccessGuardProps) {
  const { profile } = useAuth();

  // Only apply guard to client users
  if (!profile || profile.role !== 'klant') {
    return <>{children}</>;
  }

  // Check if client has a brand assigned
  const hasAssignedBrand = profile.metricool_brand_id !== null && profile.metricool_brand_id !== undefined;

  // If client has no brand and this is not the settings page, show restriction message
  if (!hasAssignedBrand && !allowSettingsPage) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
            <CardTitle className="text-xl">Account niet volledig ingesteld</CardTitle>
            <CardDescription>
              Je account moet nog worden geconfigureerd door ons team
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Je account is nog niet volledig ingesteld. Neem contact op met HIBE zodat we dit voor je kunnen afronden.
            </p>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium">Contact informatie:</p>
              <p className="text-sm text-muted-foreground">
                Stuur een e-mail naar je contactpersoon bij HIBE of gebruik de bekende contactgegevens.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}