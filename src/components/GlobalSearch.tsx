import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Building2, Film, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useClient } from "@/context/ClientContext";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

/** Search field in the top bar; also opens with Ctrl+K / Cmd+K. Searches clients and videos. */
export function GlobalSearch({ variant }: { variant: "client" | "hibe" }) {
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  const { clients } = useClient();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setOpen((o) => !o); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const { data: videos = [] } = useQuery({
    queryKey: ["video-items", "search"],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await supabase.from("video_items" as any).select("id,title,client_id").order("status_changed_at", { ascending: false }).limit(500);
      if (error) throw error;
      return (data ?? []) as unknown as { id: string; title: string; client_id: string }[];
    },
  });
  const name = (id: string) => clients.find((c) => c.id === id)?.name ?? "";
  const go = (to: string) => { setOpen(false); nav(to); };
  const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label="Zoeken"
        className="flex h-9 w-9 items-center justify-center gap-2 rounded-md border border-border bg-popover text-sm text-muted-foreground transition-colors hover:text-foreground md:w-full md:max-w-md md:justify-start md:px-3">
        <Search className="h-4 w-4 shrink-0" aria-hidden />
        <span className="hidden flex-1 text-left md:inline">{variant === "hibe" ? "Zoek klanten en video's" : "Zoek video's"}</span>
        <kbd className="hidden rounded border border-border px-1.5 text-[11px] font-medium md:inline">{isMac ? "⌘" : "Ctrl"} K</kbd>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder={variant === "hibe" ? "Zoek op klant of videotitel…" : "Zoek op videotitel…"} />
        <CommandList>
          <CommandEmpty>Niets gevonden.</CommandEmpty>
          {variant === "hibe" && clients.length > 0 && (
            <CommandGroup heading="Klanten">
              {clients.map((c) => (
                <CommandItem key={c.id} value={`klant ${c.name} ${c.id}`} onSelect={() => go(`/hibe/klant/${c.id}`)}>
                  <Building2 className="mr-2 h-4 w-4" />{c.name}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {videos.length > 0 && (
            <CommandGroup heading="Video's">
              {videos.map((v) => (
                <CommandItem key={v.id} value={`video ${v.title} ${name(v.client_id)} ${v.id}`} onSelect={() => go(variant === "hibe" ? `/hibe/videos/${v.id}` : `/videos/${v.id}`)}>
                  <Film className="mr-2 h-4 w-4" /><span className="truncate">{v.title}</span>
                  {variant === "hibe" && <span className="ml-auto truncate pl-3 text-xs text-muted-foreground">{name(v.client_id)}</span>}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
