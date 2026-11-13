import { CalendarDays, Clock, MapPin, ExternalLink } from "lucide-react";
import type { AgendaEntry } from "@/lib/agenda";
import { AGENDA_LABELS } from "@/lib/agenda-filters";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/UserAvatar";
import { useLogoUrls } from "@/hooks/useLogoUrl";
import { AgendaClientLogo } from "./AgendaControls";

export function AgendaDetails({ entry, onClose, onOpen, clients, team }: { entry: AgendaEntry | null; onClose: () => void; onOpen: (e: AgendaEntry) => void; clients: { id: string; name: string; logo_url: string | null }[]; team: { id: string; name: string }[] }) {
  const client = clients.find((c) => c.id === entry?.clientId);
  const logos = useLogoUrls([client?.logo_url]);
  const dateLabel = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  return <Sheet open={!!entry} onOpenChange={(open) => !open && onClose()}><SheetContent className="w-full overflow-y-auto sm:max-w-md">
    {entry && <><SheetHeader className="pr-6 text-left"><SheetDescription>{AGENDA_LABELS[entry.kind]}</SheetDescription><SheetTitle className="break-words">{entry.title}</SheetTitle></SheetHeader>
      <div className="mt-6 space-y-6">
        <section><h3 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Klant</h3>{client ? <div className="flex items-center gap-2"><AgendaClientLogo client={client} url={client.logo_url ? logos[client.logo_url] : undefined} /><span>{client.name}</span></div> : <p className="text-sm text-muted-foreground">Geen klant gekoppeld</p>}</section>
        <section className="space-y-3 text-sm"><div className="flex items-start gap-2"><CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" /><span>{dateLabel(entry.start)}{entry.end !== entry.start && ` – ${dateLabel(entry.end)}`}</span></div><div className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" /><span>{entry.time ? `${entry.time}${entry.endTime ? ` – ${entry.endTime}` : ""}` : "Geen tijd ingevuld"}</span></div><div className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" /><span className="break-words">{entry.location || "Geen locatie ingevuld"}</span></div></section>
        <section><h3 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Teamleden</h3><div className="space-y-2">{entry.people.length ? entry.people.map((id) => <div key={id} className="flex items-center gap-2 text-sm"><UserAvatar userId={id} size={30} /><span>{team.find((t) => t.id === id)?.name ?? "Teamlid"}</span></div>) : <p className="text-sm text-muted-foreground">Nog niemand toegewezen</p>}</div></section>
        <section><h3 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Notities</h3><p className="whitespace-pre-wrap break-words text-sm">{entry.notes || "Geen notities"}</p></section>
        <Button className="w-full rounded-md" onClick={() => onOpen(entry)}><ExternalLink className="mr-2 h-4 w-4" />{entry.kind === "meeting" || entry.kind === "vacation" || entry.kind === "task" ? "Bewerken" : entry.kind === "edit" ? "Open montage" : "Open contentmoment"}</Button>
      </div>
    </>}
  </SheetContent></Sheet>;
}