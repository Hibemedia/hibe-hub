import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { UserAuth } from "@/context/AuthContext.jsx";
import { useClient } from "@/context/ClientContext";
import { useTeamMembers } from "@/hooks/useChat";
import { useMyTeamRole } from "@/hooks/useTeamRole";
import { UserAvatar } from "@/components/UserAvatar";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { canAssignTo, type Task } from "@/lib/tasks";

const db = supabase as any;
export type TaskForm = { id?: string; title: string; notes: string; client_id: string; assignee_id: string; due_date: string; due_time: string };
export const blankTask = (me: string, day = ""): TaskForm => ({ title: "", notes: "", client_id: "", assignee_id: me, due_date: day, due_time: "" });
export const taskToForm = (t: Task): TaskForm => ({ id: t.id, title: t.title, notes: t.notes ?? "", client_id: t.client_id ?? "", assignee_id: t.assignee_id, due_date: t.due_date ?? "", due_time: t.due_time?.slice(0, 5) ?? "" });

/** Fields only — reused inside the agenda's "Nieuw" dialog. */
export function TaskFields({ form, setForm }: { form: TaskForm; setForm: (f: TaskForm) => void }) {
  const { data: team = [] } = useTeamMembers();
  const { clients } = useClient();
  const { role, me } = useMyTeamRole();
  const people = team.filter((t) => canAssignTo(role, me, t.id));
  return <>
    <div className="space-y-1.5"><Label htmlFor="tk-title">Taak</Label><Input id="tk-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Bijv. Script schrijven voor shoot" /></div>
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1.5"><Label htmlFor="tk-date">Inplannen op</Label><Input id="tk-date" type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
      <div className="space-y-1.5"><Label htmlFor="tk-time">Tijd (optioneel)</Label><Input id="tk-time" type="time" value={form.due_time} onChange={(e) => setForm({ ...form, due_time: e.target.value })} /></div>
    </div>
    <div className="space-y-1.5">
      <Label>Klant (optioneel)</Label>
      <Select value={form.client_id || "none"} onValueChange={(v) => setForm({ ...form, client_id: v === "none" ? "" : v })}>
        <SelectTrigger aria-label="Kies klant"><SelectValue /></SelectTrigger>
        <SelectContent><SelectItem value="none">Geen klant</SelectItem>{clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
      </Select>
    </div>
    <div className="space-y-1.5">
      <Label>Voor wie?{role !== "beheerder" && <span className="ml-1 font-normal text-muted-foreground">(alleen een beheerder geeft anderen taken)</span>}</Label>
      <div className="flex flex-wrap gap-2">
        {people.map((t) => <button key={t.id} type="button" onClick={() => setForm({ ...form, assignee_id: t.id })} className={cn("flex items-center gap-1.5 rounded-full border border-border py-1 pl-1 pr-3 text-sm", form.assignee_id === t.id ? "bg-foreground text-background" : "bg-popover hover:bg-muted")}><UserAvatar userId={t.id} size={22} />{t.id === me ? "Ik" : t.name}</button>)}
      </div>
    </div>
    <div className="space-y-1.5"><Label htmlFor="tk-notes">Notities</Label><Textarea id="tk-notes" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
  </>;
}

export async function saveTask(form: TaskForm, me: string) {
  if (!form.title.trim()) throw new Error("Geef de taak een naam");
  const row = { title: form.title.trim(), notes: form.notes.trim() || null, client_id: form.client_id || null, assignee_id: form.assignee_id || me, due_date: form.due_date || null, due_time: form.due_time || null };
  const { error } = form.id ? await db.from("tasks").update(row).eq("id", form.id) : await db.from("tasks").insert({ ...row, created_by: me });
  if (error) throw error;
}

export function TaskDialog({ initial, onClose }: { initial: TaskForm | null; onClose: () => void }) {
  const me = ((UserAuth() as any)?.user?.id as string) ?? "";
  const qc = useQueryClient();
  const [form, setForm] = useState<TaskForm | null>(initial);
  const [saving, setSaving] = useState(false);
  useEffect(() => setForm(initial), [initial]);
  const done = () => { qc.invalidateQueries({ queryKey: ["tasks"] }); qc.invalidateQueries({ queryKey: ["agenda"] }); onClose(); };
  const save = async () => {
    if (!form) return; setSaving(true);
    try { await saveTask(form, me); toast.success("Taak opgeslagen"); done(); } catch (e: any) { toast.error(e.message ?? "Opslaan mislukt"); } finally { setSaving(false); }
  };
  const remove = async () => {
    const { error } = await db.from("tasks").delete().eq("id", form!.id);
    if (error) return toast.error(error.message); done();
  };
  return (
    <Dialog open={!!form} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        {form && <>
          <DialogHeader><DialogTitle>{form.id ? "Taak bewerken" : "Nieuwe taak"}</DialogTitle></DialogHeader>
          <div className="space-y-4"><TaskFields form={form} setForm={setForm} /></div>
          <DialogFooter className="gap-2 sm:justify-between">
            {form.id ? <Button variant="ghost" onClick={remove}><Trash2 className="mr-1 h-4 w-4" />Verwijderen</Button> : <span />}
            <Button onClick={save} disabled={saving}>{saving ? "Opslaan..." : "Opslaan"}</Button>
          </DialogFooter>
        </>}
      </DialogContent>
    </Dialog>
  );
}
