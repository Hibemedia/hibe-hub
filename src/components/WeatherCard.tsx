import { useQuery } from "@tanstack/react-query";
import { Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudRain, CloudSnow, CloudSun, Sun, Wind, Droplets, type LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

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

export function WeatherCard({ lat, lon, place }: { lat: number; lon: number; place: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["weather", lat, lon],
    staleTime: 15 * 60e3,
    queryFn: async () => {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m&hourly=temperature_2m,precipitation_probability,weather_code&daily=precipitation_probability_max&timezone=auto&forecast_days=1&wind_speed_unit=kmh`;
      const r = await fetch(url);
      if (!r.ok) throw new Error("weer");
      return r.json();
    },
  });
  if (isLoading) return <Skeleton className="h-56 rounded-lg" />;
  if (isError || !data) return <section className="rounded-lg bg-card p-6 text-sm text-muted-foreground">Het weer kon niet geladen worden.</section>;

  const cur = weatherInfo(data.current.weather_code);
  const nowHour = String(data.current.time).slice(0, 13);
  const hours = (data.hourly.time as string[])
    .map((t, i) => ({ t, temp: data.hourly.temperature_2m[i] as number, rain: data.hourly.precipitation_probability[i] as number, code: data.hourly.weather_code[i] as number }))
    .filter((h) => h.t.slice(0, 13) >= nowHour);

  return (
    <section className="rounded-lg bg-card p-5 md:p-7" aria-label={`Weer in ${place}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Vandaag in {place}</p>
          <div className="mt-2 flex items-center gap-4">
            <cur.icon className="h-12 w-12" strokeWidth={1.4} aria-hidden />
            <span className="text-[56px] font-light leading-none tabular">{Math.round(data.current.temperature_2m)}°</span>
            <span className="text-lg">{cur.label}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="chip gap-1.5 py-1"><Droplets className="h-3.5 w-3.5" aria-hidden />{data.daily.precipitation_probability_max[0] ?? 0}% kans op neerslag</span>
          <span className="chip gap-1.5 py-1"><Wind className="h-3.5 w-3.5" aria-hidden />{Math.round(data.current.wind_speed_10m)} km/u</span>
        </div>
      </div>
      {hours.length > 0 && (
        <ol className="-mx-5 mt-6 flex gap-2 overflow-x-auto px-5 md:-mx-7 md:px-7" aria-label="Verwachting per uur">
          {hours.map((h) => {
            const w = weatherInfo(h.code);
            return (
              <li key={h.t} className="flex w-16 shrink-0 flex-col items-center gap-1.5 rounded-2xl bg-popover py-3 text-sm">
                <span className="text-xs text-muted-foreground">{h.t.slice(11, 16)}</span>
                <w.icon className="h-5 w-5" strokeWidth={1.6} aria-label={w.label} />
                <span className="font-semibold tabular">{Math.round(h.temp)}°</span>
                <span className="text-[11px] text-muted-foreground tabular">{h.rain ?? 0}%</span>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
