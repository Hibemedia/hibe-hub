import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/** Signed URLs for client logos (private bucket), keyed by storage path. */
export function useLogoUrls(paths: (string | null | undefined)[]) {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const key = paths.filter(Boolean).join("|");
  useEffect(() => {
    const list = paths.filter(Boolean) as string[];
    if (!list.length) return;
    supabase.storage.from("client-logos").createSignedUrls(list, 3600).then(({ data }) => {
      const m: Record<string, string> = {};
      data?.forEach((d) => { if (d.path && d.signedUrl) m[d.path] = d.signedUrl; });
      setUrls(m);
    });
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  return urls;
}

export function ClientLogo({ url, name, size = 40 }: { url?: string | null; name: string; size?: number }) {
  return url
    ? <img src={url} alt="" className="shrink-0 rounded-full bg-popover object-cover" style={{ width: size, height: size }} />
    : <span className="flex shrink-0 items-center justify-center rounded-full bg-foreground text-sm font-bold text-background" style={{ width: size, height: size }}>{name.slice(0, 1).toUpperCase()}</span>;
}
