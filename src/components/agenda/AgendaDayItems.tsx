import type { AgendaEntry, AgendaKind } from "@/lib/agenda";
import { agendaDayPreview } from "@/lib/agenda-filters";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function AgendaDayItems({ entries, onOpen, tones }: { entries: AgendaEntry[]; onOpen: (e: AgendaEntry) => void; tones: Record<AgendaKind, string> }) {
  const [open, setOpen] = useState(false);
  const preview = agendaDayPreview(entries);
  const row = (e: AgendaEntry, expanded = false) => <Tooltip key={`${e.kind}:${e.id}`}><TooltipTrigger asChild><Button variant="ghost" onClick={(ev) => { ev.stopPropagation(); setOpen(false); onOpen(e); }} aria-label={e.title} className={cn("block h-auto min-h-6 w-full whitespace-normal rounded-md px-1.5 py-1 text-left text-[11px] font-medium", tones[e.kind])}><span className={cn("block break-words leading-4 [overflow-wrap:anywhere]", !expanded && "max-h-8 overflow-hidden")}>{e.time && `${e.time} `}{e.title}</span></Button></TooltipTrigger><TooltipContent className="max-w-72 whitespace-normal rounded-md">{e.title}</TooltipContent></Tooltip>;
  return <div className="space-y-0.5" onClick={(e) => e.stopPropagation()}>{preview.visible.map((e) => row(e))}{preview.more > 0 && <Popover open={open} onOpenChange={setOpen}><PopoverTrigger asChild><Button variant="ghost" className="h-6 w-full truncate rounded-md px-1 text-left text-[11px] text-muted-foreground" onClick={(e) => e.stopPropagation()}>+{preview.more} meer</Button></PopoverTrigger><PopoverContent align="start" className="max-h-80 w-72 space-y-1 overflow-y-auto p-2" onClick={(e) => e.stopPropagation()}>{entries.map((e) => row(e, true))}</PopoverContent></Popover>}</div>;
}