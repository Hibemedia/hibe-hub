import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardWelcomeProps {
  customerName: string;
  metrics: {
    totalViews: string;
    engagementRate: string;
    ctr: string;
    organicImpressions: string;
  };
}

export function DashboardWelcome({ customerName, metrics }: DashboardWelcomeProps) {
  const [welcomeMessage, setWelcomeMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchWelcomeMessage = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dashboard-welcome`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({ customerName, metrics }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch welcome message");
        }

        const data = await response.json();
        setWelcomeMessage(data.message);
      } catch (error) {
        console.error("Error fetching welcome message:", error);
        setWelcomeMessage(`Hallo ${customerName}, welkom terug in je dashboard!`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWelcomeMessage();
  }, [customerName, metrics]);

  return (
    <Card className="border-2 hover-card">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary rounded-lg shadow-primary shrink-0">
            <Sparkles className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <div className="flex-1">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ) : (
              <p className="text-sm leading-relaxed text-foreground font-medium">{welcomeMessage}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
