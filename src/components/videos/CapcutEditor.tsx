import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTeamMembers } from "@/hooks/useChat";
import { setCapcutEditor } from "@/hooks/useVideos";
import { UserAvatar } from "@/components/UserAvatar";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { toast } from "sonner";

// Who does the CapCut for this video — prevents double work in the CapCut step.
export function CapcutEditor({ itemId, title, userId }: { itemId: string; title: string; userId: string | null }) {
  const { data: team = [], isLoading } = useTeamMembers();
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();
  const person = team.find((m) => m.id === userId);
  const assign = async (value: string) => {
    setSaving(true);
    try {
      await setCapcutEditor(itemId, value === "none" ? null : value);
      await qc.invalidateQueries({ queryKey: ["video-items"] });
      toast.success(value === "none" ? "CapCut niet meer toegewezen" : "CapCut toegewezen");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Opslaan mislukt");
    } finally { setSaving(false); }
  };
  return (
    <Select value={userId ?? "none"} onValueChange={assign} disabled={saving || isLoading}>
      <SelectTrigger aria-label={`CapCut door voor ${title}`} className="h-8 w-44 shrink-0 text-xs">
        <div className="flex min-w-0 items-center gap-2">
          {userId && <UserAvatar userId={userId} name={person?.name} size={22} />}
          <span className="truncate">{saving ? "Opslaan…" : person ? `CapCut: ${person.name}` : userId ? "CapCut: collega" : "Wie capcut?"}</span>
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">Niemand</SelectItem>
        {team.map((m) => <SelectItem key={m.id} value={m.id} aria-label={m.name}><span className="flex items-center gap-2"><span aria-hidden="true"><UserAvatar userId={m.id} name={m.name} size={22} /></span>{m.name}</span></SelectItem>)}
      </SelectContent>
    </Select>
  );
}
