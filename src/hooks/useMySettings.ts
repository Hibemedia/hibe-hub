import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UserAuth } from "@/context/AuthContext.jsx";

export function useMySettings() {
  const { user } = UserAuth();
  return useQuery({
    queryKey: ["my-settings", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const [{ data: s }, { data: u }] = await Promise.all([
        supabase.from("profiles_settings").select("full_name,weather_location,weather_lat,weather_lon").eq("user_id", user.id).maybeSingle(),
        supabase.from("users").select("full_name,email").eq("id", user.id).maybeSingle(),
      ]);
      const raw = s?.full_name || u?.full_name || (u?.email ?? user.email ?? "").split("@")[0].split(/[.+_-]/)[0];
      const name = raw ? raw.split(" ")[0].replace(/^./, (c: string) => c.toUpperCase()) : "";
      return {
        name,
        place: s?.weather_location ?? "Amsterdam",
        lat: s?.weather_lat ?? 52.3676,
        lon: s?.weather_lon ?? 4.9041,
      };
    },
  });
}
