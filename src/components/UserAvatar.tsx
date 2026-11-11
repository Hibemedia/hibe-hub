import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { avatarSlot, initials } from "@/lib/avatar";
import { cn } from "@/lib/utils";

const db = supabase as any;
export type Profile = { id: string; name: string; avatar_url: string | null };

/** Names + photos the signed-in user may see (HIBE team, own client, self). */
export function useProfiles() {
  return useQuery({
    queryKey: ["visible-profiles"], staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data } = await db.rpc("visible_profiles");
      return Object.fromEntries(((data ?? []) as Profile[]).map((p) => [p.id, p])) as Record<string, Profile>;
    },
  });
}

/** Photos live in the private 'avatars' bucket as "storage:avatars/<path>"; resolve to a signed URL. */
export function useAvatarSrc(url: string | null | undefined) {
  const path = url?.startsWith("storage:avatars/") ? url.slice("storage:avatars/".length) : null;
  const q = useQuery({
    queryKey: ["avatar-src", path], enabled: !!path, staleTime: 50 * 60_000,
    queryFn: async () => (await supabase.storage.from("avatars").createSignedUrl(path!, 3600)).data?.signedUrl ?? null,
  });
  return path ? q.data ?? null : url ?? null;
}

/** One avatar everywhere: photo, or initials in a fixed colour per person. Pass userId to look it up. */
export function UserAvatar({ userId, name, url, size = 32, className }: { userId?: string | null; name?: string; url?: string | null; size?: number; className?: string }) {
  const { data: profiles } = useProfiles();
  const p = userId ? profiles?.[userId] : undefined;
  const label = name ?? p?.name ?? "?";
  const src = useAvatarSrc(url !== undefined ? url : p?.avatar_url);
  const style = { width: size, height: size, fontSize: Math.max(9, size * 0.38) };
  if (src) return <img src={src} alt={label} title={label} className={cn("shrink-0 rounded-full object-cover", className)} style={style} />;
  const slot = avatarSlot(userId ?? label);
  return <span title={label} className={cn("flex shrink-0 items-center justify-center rounded-full font-semibold", className)} style={{ ...style, background: `hsl(var(--avatar-${slot}))`, color: "hsl(var(--avatar-fg))" }}>{initials(label)}</span>;
}
