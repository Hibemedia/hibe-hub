import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";
import { EmailAPIError } from "npm:@lovable.dev/email-js@0.8.0";
import { sendTemplateEmail } from "../_shared/transactional-email-templates/send-email.ts";

const SITE = "https://hibespace.com";
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const Body = z.object({ item_id: z.string().uuid(), editor_id: z.string().uuid().nullable() });

/** Admin acting with their own session, so row-level security keeps deciding. */
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const a = await actor(req);
    if (a.error) return a.error;
    const p = Body.safeParse(await req.json().catch(() => ({})));
    if (!p.success) return json({ error: "Ongeldig verzoek" }, 400);
    const { item_id, editor_id } = p.data;

    // The assignment itself stays in the database function that guards it.
    const { error } = await a.db.rpc("set_video_feedback_editor", { _item_id: item_id, _editor_id: editor_id });
    if (error) return json({ error: error.message }, 400);
    if (!editor_id || editor_id === a.user.id) return json({ sent: false, reason: "geen_ontvanger" });

    const [editor, item] = await Promise.all([
      person(a.db, editor_id),
      a.db.from("video_items").select("title, client_id, status").eq("id", item_id).maybeSingle().then((r: any) => r.data),
    ]);
    // Only a video already in feedback needs this mail; moving to feedback later mails via notify-feedback.
    if (item?.status !== "feedback") return json({ sent: false, reason: "nog_geen_feedback" });
    if (!editor?.email) return json({ sent: false, reason: "geen_adres" });

    const clientName = item?.client_id
      ? (await a.db.from("clients").select("name").eq("id", item.client_id).maybeSingle()).data?.name ?? null
      : null;

    try {
      const sent = await sendTemplateEmail("feedback-toegewezen", editor.email, {
        templateData: {
          name: firstName(editor),
          videoTitle: item?.title ?? null,
          clientName,
          feedbackUrl: `${SITE}/hibe/videos/${item_id}`,
        },
        idempotencyKey: `feedback-toegewezen-${item_id}-${editor_id}`,
      });
      return json(sent);
    } catch (e) {
      // The assignment is already saved; a mail that cannot go out must not fail the action.
      console.error("feedback mail:", e);
      return json({ sent: false, reason: e instanceof EmailAPIError ? e.code : "mail_mislukt" });
    }
  } catch (e) {
    console.error(e);
    return json({ error: "Editor opslaan mislukt" }, 500);
  }
});
