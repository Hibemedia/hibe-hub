import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";
import { EmailAPIError } from "npm:@lovable.dev/email-js@0.8.0";
import { sendTemplateEmail } from "../_shared/transactional-email-templates/send-email.ts";

const SITE = "https://hibespace.com";
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const Body = z.object({ edit_id: z.string().uuid(), editor_id: z.string().uuid().nullable() });

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
    if (!p.success) return json({ error: "Ongeldig verzoek" }, 400);
    const { edit_id, editor_id } = p.data;

    const before = await a.db.from("edits").select("status").eq("id", edit_id).maybeSingle();
    if (!before.data) return json({ error: "Edit niet gevonden" }, 404);

    // Same rule as the board: an editor on an unassigned edit moves it to to-do.
    const status = editor_id && before.data.status === "assign" ? "todo" : before.data.status;
    const { error } = await a.db.from("edits").update({ editor_id, status }).eq("id", edit_id);
    if (error) return json({ error: error.message }, 400);
    if (!editor_id || editor_id === a.user.id) return json({ sent: false, reason: "geen_ontvanger" });

    const [editor, edit] = await Promise.all([
      person(a.db, editor_id),
      a.db.from("edits").select("title, client_id, drive_link, planned_date, deadline, updated_at").eq("id", edit_id).maybeSingle().then((r: any) => r.data),
    ]);
    if (!editor?.email) return json({ sent: false, reason: "geen_adres" });

    const clientName = edit?.client_id
      ? (await a.db.from("clients").select("name").eq("id", edit.client_id).maybeSingle()).data?.name ?? null
      : null;

    try {
      const sent = await sendTemplateEmail("edit-toegewezen", editor.email, {
        templateData: {
          name: firstName(editor),
          editTitle: edit?.title ?? null,
          clientName,
          plannedDate: day(edit?.planned_date ?? null),
          deadline: day(edit?.deadline ?? null),
          driveLink: edit?.drive_link || null,
          editsUrl: `${SITE}/hibe/edits`,
        },
        idempotencyKey: `edit-toegewezen-${edit_id}-${editor_id}-${edit?.updated_at ?? ""}`,
      });
      return json(sent);
    } catch (e) {
      console.error("edit mail:", e);
      return json({ sent: false, reason: e instanceof EmailAPIError ? e.code : "mail_mislukt" });
    }
  } catch (e) {
    console.error(e);
    return json({ error: "Editor opslaan mislukt" }, 500);
  }
});
