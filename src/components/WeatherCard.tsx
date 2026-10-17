import { useQuery } from "@tanstack/react-query";
import { Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudRain, CloudSnow, CloudSun, Sun, Wind, Droplets, type LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function weatherInfo(code: number): { label: string; icon: LucideIcon } {
  if (code === 0) return { label: "Zonnig", icon: Sun };
  if (code <= 2) return { label: "Half bewolkt", icon: CloudSun };
  if (code === 3) return { label: "Bewolkt", icon: Cloud };
  if (code <= 48) return { label: "Mist", icon: CloudFog };
  if (code <= 57) return { label: "Motregen", icon: CloudDrizzle };
  if (code <= 67 || (code >= 80 && code <= 82)) return { label: "Regen", icon: CloudRain };
  if (code <= 77 || code === 85 || code === 86) return { label: "Sneeuw", icon: CloudSnow };
  return { label: "Onweer", icon: CloudLightning };
}

/** Compact, vierkant weerkaartje: plaats, temperatuur, omstandigheid, neerslag en wind. */
export function WeatherCard({ lat, lon, place, className }: { lat: number; lon: number; place: string; className?: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["weather", lat, lon],
    staleTime: 15 * 60e3,
    queryFn: async () => {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m&daily=precipitation_probability_max&timezone=auto&forecast_days=1&wind_speed_unit=kmh`;
      const r = await fetch(url);
      if (!r.ok) throw new Error("weer");
      return r.json();
    },
  });

  if (isLoading) return <Skeleton className={cn("aspect-square rounded-lg", className)} />;
  if (isError || !data)
    return <section className={cn("rounded-lg bg-card p-4 text-xs text-muted-foreground", className)}>Het weer kon niet geladen worden.</section>;

  const cur = weatherInfo(data.current.weather_code);
  const rain = data.daily.precipitation_probability_max[0] ?? 0;
  const wind = Math.round(data.current.wind_speed_10m);

  return (
    <section
      aria-label={`Weer in ${place}`}
      className={cn("flex flex-col justify-between gap-3 rounded-lg bg-card p-4 xl:aspect-square", className)}
    >
      <p className="truncate text-xs text-muted-foreground">Vandaag in {place}</p>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 xl:flex-col xl:items-start xl:gap-1.5">
        <span className="flex items-center gap-2">
          <cur.icon className="h-8 w-8 shrink-0" strokeWidth={1.4} aria-hidden />
          <span className="text-4xl font-light leading-none tabular">{Math.round(data.current.temperature_2m)}°</span>
        </span>
        <span className="text-sm">{cur.label}</span>
      </div>
      <div className="flex flex-wrap gap-1.5 text-[11px]">
        <span className="chip gap-1 py-0.5"><Droplets className="h-3 w-3" aria-hidden />{rain}%</span>
        <span className="chip gap-1 py-0.5"><Wind className="h-3 w-3" aria-hidden />{wind} km/u</span>
      </div>
    </section>
  );
}
