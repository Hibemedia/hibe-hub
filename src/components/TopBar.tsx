import { useClient } from "@/context/ClientContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function TopBar() {
  const { isAdmin, clients, clientId, setClientId, client } = useClient();
  return (
    <header className="sticky top-0 z-40 bg-background/95 px-4 pt-4 md:px-8 md:pt-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-base font-extrabold tracking-tight">HIBE</span>
          <span className="hidden text-sm text-muted-foreground sm:inline">Klantportaal</span>
        </div>
        {isAdmin && clients.length > 0 ? (
          <Select value={clientId ?? ""} onValueChange={setClientId}>
            <SelectTrigger aria-label="Kies klant" className="h-10 w-auto min-w-0 max-w-[60vw] gap-2 border-transparent bg-foreground px-4 font-medium text-background [&>svg]:opacity-80">
              <span className="h-2 w-2 shrink-0 rounded-full bg-lime" aria-hidden />
              <SelectValue placeholder="Kies klant" />
            </SelectTrigger>
            <SelectContent>{clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        ) : client ? (
          <span className="capsule-dark h-10"><span className="h-2 w-2 rounded-full bg-lime" aria-hidden />{client.name}</span>
        ) : null}
      </div>
    </header>
  );
}
