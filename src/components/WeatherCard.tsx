import { useQuery } from "@tanstack/react-query";
import { Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudRain, CloudSnow, CloudSun, Sun, Droplets, type LucideIcon } from "lucide-react";
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

/** Compact weerkaartje: vandaag bovenaan, daaronder de hele week in miniatuur. */
export function WeatherCard({ lat, lon, place, className }: { lat: number; lon: number; place: string; className?: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["weather", lat, lon],
    staleTime: 15 * 60e3,
    queryFn: async () => {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=7`;
      const r = await fetch(url);
      if (!r.ok) throw new Error("weer");
      return r.json();
    },
  });

  if (isLoading) return <Skeleton className={cn("h-[168px] w-full rounded-lg", className)} />;
  if (isError || !data)
    return <section className={cn("flex h-[168px] w-full items-center justify-center rounded-lg bg-card p-4 text-xs text-muted-foreground", className)}>Het weer kon niet geladen worden.</section>;

  const cur = weatherInfo(data.current.weather_code);
  const rain = data.daily.precipitation_probability_max[0] ?? 0;
  const days: string[] = data.daily.time;

  return (
    <section
      aria-label={`Weer in ${place}`}
      className={cn("flex w-full flex-col gap-2.5 rounded-lg bg-card p-3.5", className)}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-xs text-muted-foreground">Vandaag in {place}</p>
        <span className="flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground"><Droplets className="h-3 w-3" aria-hidden />{rain}%</span>
      </div>
      <div className="flex items-center gap-2">
        <cur.icon className="h-7 w-7 shrink-0" strokeWidth={1.4} aria-hidden />
        <span className="text-3xl font-light leading-none tabular">{Math.round(data.current.temperature_2m)}°</span>
        <span className="truncate text-xs text-muted-foreground">{cur.label}</span>
      </div>
      <div className="grid grid-cols-7 gap-0.5 border-t border-border pt-2">
        {days.map((d, i) => {
          const info = weatherInfo(data.daily.weather_code[i]);
          const dayName = new Date(d + "T00:00:00").toLocaleDateString("nl-NL", { weekday: "short" });
          return (
            <div key={d} title={`${dayName}: ${info.label}, ${Math.round(data.daily.temperature_2m_max[i])}° / ${Math.round(data.daily.temperature_2m_min[i])}°`}
              className={cn("flex flex-col items-center gap-0.5 rounded-md py-1", i === 0 && "bg-lime/40")}>
              <span className={cn("text-[10px] leading-none", i === 0 ? "font-semibold" : "text-muted-foreground")}>{dayName}</span>
              <info.icon className="h-3.5 w-3.5" strokeWidth={1.6} aria-hidden />
              <span className="text-[10px] font-medium leading-none tabular">{Math.round(data.daily.temperature_2m_max[i])}°</span>
              <span className="text-[10px] leading-none text-muted-foreground tabular">{Math.round(data.daily.temperature_2m_min[i])}°</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
