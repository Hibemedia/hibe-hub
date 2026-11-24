import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";
import { EmailAPIError } from "npm:@lovable.dev/email-js@0.8.0";
import { sendTemplateEmail } from "../_shared/transactional-email-templates/send-email.ts";

const SITE = "https://hibespace.com";
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const Body = z.object({
  id: z.string().uuid().nullable().optional(),
  title: z.string().min(1).max(300),
  notes: z.string().max(4000).nullable().optional(),
  client_id: z.string().uuid().nullable().optional(),
  assignee_id: z.string().uuid(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  due_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).nullable().optional(),
  moment_id: z.string().uuid().nullable().optional(),
});

async function actor(req: Request) {
  const auth = req.headers.get("Authorization") ?? "";
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: auth } },
  });
  const { data: u } = await db.auth.getUser(auth.replace("Bearer ", ""));
  if (!u.user) return { error: json({ error: "Niet ingelogd" }, 401) };
  const { data: isAdmin } = await db.rpc("has_role", { _user_id: u.user.id, _role: "admin" });
  if (!isAdmin) return { error: json({ error: "Alleen HIBE" }, 403) };
  return { db, user: u.user };
}

async function person(db: any, id: string) {
  const { data } = await db.from("users").select("email, full_name, first_name").eq("id", id).maybeSingle();
  return data as { email: string; full_name: string | null; first_name: string | null } | null;
}

const firstName = (p: { first_name: string | null; full_name: string | null } | null) =>
  p?.first_name || p?.full_name?.split(" ")[0] || "";

const day = (d: string | null) =>
  d ? new Date(d + "T00:00").toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" }) : null;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const a = await actor(req);
    if (a.error) return a.error;
    const p = Body.safeParse(await req.json().catch(() => ({})));
    if (!p.success) return json({ error: p.success ? "" : (p.error.issues[0]?.message ?? "Ongeldig verzoek") }, 400);
    const { id, title, notes, client_id, assignee_id, due_date, due_time, moment_id } = p.data;

    const row = {
      title: title.trim(),
      notes: notes?.trim() || null,
      client_id: client_id || null,
      assignee_id,
      due_date: due_date || null,
      due_time: due_time || null,
      moment_id: moment_id || null,
    };

    // RLS decides who may create or hand over a task, exactly as before.
    const saved = id
      ? await a.db.from("tasks").update(row).eq("id", id).select("id").maybeSingle()
      : await a.db.from("tasks").insert({ ...row, created_by: a.user.id }).select("id").single();
    if (saved.error) return json({ error: saved.error.message }, 400);
    const taskId: string = saved.data?.id ?? id ?? "";
    if (!assignee_id || assignee_id === a.user.id) return json({ sent: false, reason: "geen_ontvanger" });

    const [editor, client] = await Promise.all([
      person(a.db, assignee_id),
      client_id
        ? a.db.from("clients").select("name").eq("id", client_id).maybeSingle().then((r: any) => r.data)
        : null,
    ]);
    if (!editor?.email) return json({ sent: false, reason: "geen_adres" });

    try {
      const sent = await sendTemplateEmail("taak-toegewezen", editor.email, {
        templateData: {
          name: firstName(editor),
          taskTitle: row.title,
          clientName: client?.name ?? null,
          dueDate: day(row.due_date),
          dueTime: row.due_time ? row.due_time.slice(0, 5) : null,
          notes: row.notes,
          tasksUrl: `${SITE}/hibe/taken`,
        },
        idempotencyKey: `taak-toegewezen-${taskId}-${assignee_id}`,
      });
      return json(sent);
    } catch (e) {
      console.error("taak mail:", e);
      return json({ sent: false, reason: e instanceof EmailAPIError ? e.code : "mail_mislukt" });
    }
  } catch (e) {
    console.error(e);
    return json({ error: "Taak opslaan mislukt" }, 500);
  }
});
