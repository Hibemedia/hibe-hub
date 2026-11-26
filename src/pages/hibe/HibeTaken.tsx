import { FilterChip } from "@/components/ui/filter-chip";
import { Tag } from "@/components/ui/tag";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Check, Scissors } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useClient } from "@/context/ClientContext";
import { useTeamMembers } from "@/hooks/useChat";
import { useMyTeamRole } from "@/hooks/useTeamRole";
import { PageHeader, PrimaryAction } from "@/components/PageHeader";
import { UserAvatar } from "@/components/UserAvatar";
import { TaskDialog, blankTask, taskToForm, type TaskForm } from "@/components/TaskDialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { groupByPerson, isOverdue, sortTasks, type Task } from "@/lib/tasks";
import { ymd } from "@/lib/agenda";

const db = supabase as any;
export function useTasks() {
  return useQuery({ queryKey: ["tasks"], queryFn: async () => {
    const { data, error } = await db.from("tasks").select("*"); if (error) throw error; return (data ?? []) as Task[];
  } });
}
type PlannedEdit = { id: string; title: string; client_id: string; editor_id: string; planned_date: string; deadline: string | null };
function usePlannedEdits() {
  return useQuery({ queryKey: ["edits", "planned"], queryFn: async () => {
    const { data, error } = await db.from("edits").select("id,title,client_id,editor_id,planned_date,deadline").not("planned_date", "is", null).not("editor_id", "is", null).neq("status", "delivered").order("planned_date");
    if (error) throw error; return (data ?? []) as PlannedEdit[];
  } });
}
const fmt = (d: string) => new Date(d + "T12:00").toLocaleDateString("nl-NL", { weekday: "short", day: "numeric", month: "short" });

export default function HibeTaken() {
  const { me } = useMyTeamRole();
  const { data: tasks = [] } = useTasks();
  const { data: team = [] } = useTeamMembers();
  const { data: plannedEdits = [] } = usePlannedEdits();
  const { clients } = useClient();
  const qc = useQueryClient();
  const [view, setView] = useState<"mine" | "all">("mine");
  const [showDone, setShowDone] = useState(false);
  const [form, setForm] = useState<TaskForm | null>(null);
  const today = ymd(new Date());
  const name = (id: string) => id === me ? "Mijn taken" : team.find((t) => t.id === id)?.name ?? "Teamlid";

  const visible = useMemo(() => sortTasks(tasks.filter((t) => (view === "all" || t.assignee_id === me) && (showDone || !t.done_at))), [tasks, view, me, showDone]);
  const baseGroups = view === "all" ? groupByPerson(visible, [me, ...team.map((t) => t.id)]) : [{ person: me, tasks: visible }];
  const editsFor = (p: string) => showDone ? [] : plannedEdits.filter((e) => e.editor_id === p);
  const extra = view === "all" ? [...new Set(plannedEdits.map((e) => e.editor_id))].filter((p) => !baseGroups.some((g) => g.person === p)).map((p) => ({ person: p, tasks: [] as Task[] })) : [];
  const groups = [...baseGroups, ...extra].map((g) => ({ ...g, edits: editsFor(g.person) }));

  const toggle = async (t: Task) => {
    const { error } = await db.from("tasks").update({ done_at: t.done_at ? null : new Date().toISOString() }).eq("id", t.id);
    if (error) return toast.error("Alleen degene met de taak of een beheerder kan hem afvinken");
    qc.invalidateQueries({ queryKey: ["tasks"] }); qc.invalidateQueries({ queryKey: ["agenda"] });
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Taken" action={<PrimaryAction icon={Plus} onClick={() => setForm(blankTask(me))}>Nieuwe taak</PrimaryAction>} />
      <div className="flex flex-wrap items-center gap-2">
        <FilterChip active={view === "mine"} onClick={() => setView("mine")} className={cn("", view === "mine" && "bg-filter-active text-foreground")}>Alleen mijn taken</FilterChip>
        <FilterChip active={view === "all"} onClick={() => setView("all")} className={cn("", view === "all" && "bg-filter-active text-foreground")}>Iedereen, per persoon</FilterChip>
        <FilterChip active={showDone} onClick={() => setShowDone(!showDone)} className={cn(" ml-auto", showDone && "bg-filter-active text-foreground")}>Afgerond tonen</FilterChip>
      </div>
      {groups.every((g) => !g.tasks.length && !g.edits.length) && <div className="space-y-3 border-y border-border py-6 text-sm text-muted-foreground"><p>{showDone ? "Geen taken voor deze selectie." : "Alles afgerond: er staan geen open taken voor deze selectie."}</p><Button variant="outline" onClick={() => setForm(blankTask(me))}><Plus className="h-4 w-4" />Nieuwe taak</Button></div>}
      {groups.filter((g) => g.tasks.length || g.edits.length).map((g) => (
        <section key={g.person} className="min-w-0 rounded-[20px] bg-card p-4">
          {view === "all" && <div className="mb-2 flex items-center gap-2"><UserAvatar userId={g.person} size={26} /><h2 className="truncate font-semibold">{name(g.person)}</h2><span className="text-sm text-muted-foreground">{g.tasks.filter((t) => !t.done_at).length} open{g.edits.length ? ` · ${g.edits.length} edits` : ""}</span></div>}
          <ul className="divide-y divide-border">
            {g.tasks.map((t) => {
              const client = clients.find((c) => c.id === t.client_id)?.name;
              return (
                <li key={t.id} className="flex min-w-0 items-center gap-3 py-2.5">
                  <button aria-label={t.done_at ? "Weer openzetten" : "Afvinken"} onClick={() => toggle(t)} className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-tag border border-foreground/40", t.done_at && "!bg-foreground !text-background")}>{t.done_at && <Check className="h-3 w-3" />}</button>
                  <button onClick={() => setForm(taskToForm(t))} className="min-w-0 flex-1 text-left">
                    <p className={cn("truncate text-sm font-medium", t.done_at && "text-muted-foreground line-through")}>{t.title}</p>
                    {(client || t.notes) && <p className="truncate text-xs text-muted-foreground">{[client, t.notes].filter(Boolean).join(" · ")}</p>}
                  </button>
                  {t.due_date && <Tag className={cn("shrink-0 rounded-tag px-2.5 py-0.5 text-xs", isOverdue(t, today) ? "bg-destructive/15 text-destructive" : t.due_date === today ? "bg-tag-success text-foreground" : "bg-muted text-muted-foreground")}>{t.due_date === today ? "Vandaag" : fmt(t.due_date)}{t.due_time ? ` ${t.due_time.slice(0, 5)}` : ""}</Tag>}
                </li>
              );
            })}
          </ul>
          {g.edits.length > 0 && <>
            <p className="mt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Ingeplande edits</p>
            <ul className="divide-y divide-border">
              {g.edits.map((e) => (
                <li key={e.id}>
                  <Link to={`/hibe/edits?edit=${e.id}`} className="flex min-w-0 items-center gap-3 py-2.5">
                    <Scissors className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{e.title}</p><p className="truncate text-xs text-muted-foreground">{[clients.find((c) => c.id === e.client_id)?.name, e.deadline && `deadline ${fmt(e.deadline)}`].filter(Boolean).join(" · ")}</p></div>
                    <Tag className={cn("shrink-0 rounded-tag px-2.5 py-0.5 text-xs", e.planned_date < today ? "bg-destructive/15 text-destructive" : e.planned_date === today ? "bg-tag-success text-foreground" : "bg-muted text-muted-foreground")}>{e.planned_date === today ? "Vandaag" : fmt(e.planned_date)}</Tag>
                  </Link>
                </li>
              ))}
            </ul>
          </>}
        </section>
      ))}
      <TaskDialog initial={form} onClose={() => setForm(null)} />
    </div>
  );
}
