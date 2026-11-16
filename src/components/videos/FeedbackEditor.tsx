import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTeamMembers } from "@/hooks/useChat";
import { supabase } from "@/integrations/supabase/client";
import { UserAvatar } from "@/components/UserAvatar";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { toast } from "sonner";

export function FeedbackEditor({ itemId, title, editorId }: { itemId: string; title: string; editorId: string | null }) {
  const { data: team = [], isLoading } = useTeamMembers();
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();
  const editor = team.find((member) => member.id === editorId);
  const assign = async (value: string) => {
    setSaving(true);
    try {
      // Generated RPC argument types omit SQL nullability.
      const { error } = await (supabase as any).rpc("set_video_feedback_editor", { _item_id: itemId, _editor_id: value === "none" ? null : value });
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: ["video-items"] });
      toast.success(value === "none" ? "Editor verwijderd" : "Feedback toegewezen");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Editor opslaan mislukt");
    } finally { setSaving(false); }
  };
  return (
    <Select value={editorId ?? "none"} onValueChange={assign} disabled={saving || isLoading}>
      <SelectTrigger aria-label={`Editor voor ${title}`} className="h-8 w-44 shrink-0 text-xs">
        <div className="flex min-w-0 items-center gap-2">
          {editorId && <UserAvatar userId={editorId} name={editor?.name} size={22} />}
          <span className="truncate">{saving ? "Opslaan…" : editor?.name ?? (editorId ? "Editor" : "Editor kiezen")}</span>
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">Geen editor</SelectItem>
        {team.map((member) => <SelectItem key={member.id} value={member.id} aria-label={member.name}><span className="flex items-center gap-2"><span aria-hidden="true"><UserAvatar userId={member.id} name={member.name} size={22} /></span>{member.name}</span></SelectItem>)}
      </SelectContent>
    </Select>
  );
}