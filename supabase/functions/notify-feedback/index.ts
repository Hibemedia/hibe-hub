import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";
import { EmailAPIError } from "npm:@lovable.dev/email-js@0.8.0";
import { sendTemplateEmail } from "../_shared/transactional-email-templates/send-email.ts";

const SITE = "https://hibespace.com";
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const Body = z.object({ item_id: z.string().uuid() });

/**
 * Called by the video_items database trigger when a video moves to "feedback".
 * No user session exists there, so a shared secret guards this endpoint.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const secret = Deno.env.get("NOTIFY_FEEDBACK_SECRET");
    if (!secret || req.headers.get("x-notify-secret") !== secret) {
      return json({ error: "Niet toegestaan" }, 401);
    }
    const p = Body.safeParse(await req.json().catch(() => ({})));
    if (!p.success) return json({ error: "Ongeldig verzoek" }, 400);
    const { item_id } = p.data;

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: item } = await admin
      .from("video_items")
      .select("id, title, status, editor_id, client_id, current_version")
      .eq("id", item_id)
      .maybeSingle();
    if (!item || item.status !== "feedback" || !item.editor_id) {
      return json({ sent: false, reason: "geen_ontvanger" });
    }

    const { data: editor } = await admin
      .from("users")
      .select("email, full_name, first_name")
      .eq("id", item.editor_id)
      .maybeSingle();
    if (!editor?.email) return json({ sent: false, reason: "geen_adres" });

    const clientName = item.client_id
      ? (await admin.from("clients").select("name").eq("id", item.client_id).maybeSingle()).data?.name ?? null
      : null;

    try {
      const sent = await sendTemplateEmail("feedback-ontvangen", editor.email, {
        templateData: {
          name: editor.first_name || editor.full_name?.split(" ")[0] || "",
          videoTitle: item.title ?? null,
          clientName,
          feedbackUrl: `${SITE}/hibe/videos/${item_id}`,
        },
        // Same video + same version = same mail, however often the status flips.
        idempotencyKey: `feedback-ontvangen-${item_id}-v${item.current_version ?? 0}`,
      });
      return json(sent);
    } catch (e) {
      console.error("feedback-ontvangen mail:", e);
      return json({ sent: false, reason: e instanceof EmailAPIError ? e.code : "mail_mislukt" });
    }
  } catch (e) {
    console.error(e);
    return json({ error: "Melding versturen mislukt" }, 500);
  }
});
