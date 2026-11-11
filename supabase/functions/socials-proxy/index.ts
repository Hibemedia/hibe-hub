import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3";

// Live link to the HIBE Review Hub socials checklist (same rows as that site).
const HUB_URL = "https://npvtjabdtjtqpducpikv.supabase.co";
const HUB_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wdnRqYWJkdGp0cXBkdWNwaWt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwMTUxMjYsImV4cCI6MjA4NzU5MTEyNn0.TQj2lwMmupcNfeJ5XkiEL3Iykmkk5Kav3h1zE8i7IJ8";
const STATUS = z.enum(["none", "to_post", "internal_check", "client_check", "in_progress", "to_schedule", "scheduled"]);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("load"), from: date, to: date, weekFrom: date }),
  z.object({ action: z.literal("set_post"), client_id: z.string().uuid(), post_date: date, status: STATUS, note: z.string().max(2000).nullable(), title: z.string().max(500).nullable() }),
  z.object({ action: z.literal("set_week"), client_id: z.string().uuid(), week_start: date, items: z.array(z.object({ id: z.string().max(64), title: z.string().max(500), status: STATUS, note: z.string().max(2000) })).max(50) }),
]);
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

let hub: ReturnType<typeof createClient> | null = null;
async function hubClient() {
  if (hub) { const { data } = await hub.auth.getSession(); if (data.session) return hub; }
  hub = createClient(HUB_URL, HUB_ANON, { auth: { persistSession: false, autoRefreshToken: true } });
  const { error } = await hub.auth.signInWithPassword({ email: Deno.env.get("REVIEW_HUB_EMAIL")!, password: Deno.env.get("REVIEW_HUB_PASSWORD")! });
  if (error) { hub = null; throw new Error("Inloggen bij Review Hub mislukt: " + error.message); }
  return hub;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization") ?? "";
    const local = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
    const { data: u } = await local.auth.getUser(auth.replace("Bearer ", ""));
    if (!u.user) return json({ error: "Niet ingelogd" }, 401);
    const { data: isAdmin } = await local.rpc("has_role", { _user_id: u.user.id, _role: "admin" });
    if (!isAdmin) return json({ error: "Alleen HIBE" }, 403);
    const p = Body.safeParse(await req.json());
    if (!p.success) return json({ error: p.error.flatten() }, 400);
    const b = p.data; const h = await hubClient();
    if (b.action === "load") {
      const [c, po, w] = await Promise.all([
        h.from("social_clients").select("*").order("sort_order"),
        h.from("social_posts").select("client_id,post_date,status,note,title").gte("post_date", b.from).lte("post_date", b.to),
        h.from("social_weekly_edits").select("client_id,week_start,count,items").gte("week_start", b.weekFrom).lte("week_start", b.to),
      ]);
      const err = c.error || po.error || w.error; if (err) throw err;
      return json({ clients: c.data, posts: po.data, weeks: w.data });
    }
    if (b.action === "set_post") {
      // Same rule as Review Hub: an emptied cell is removed, otherwise upserted.
      if (b.status === "none" && !b.note && !b.title) {
        const { error } = await h.from("social_posts").delete().eq("client_id", b.client_id).eq("post_date", b.post_date);
        if (error) throw error; return json({ ok: true });
      }
      const { error } = await h.from("social_posts").upsert({ client_id: b.client_id, post_date: b.post_date, status: b.status, note: b.note || null, title: b.title || null }, { onConflict: "client_id,post_date" });
      if (error) throw error; return json({ ok: true });
    }
    const count = b.items.filter((i) => i.status === "scheduled").length;
    const { error } = await h.from("social_weekly_edits").upsert({ client_id: b.client_id, week_start: b.week_start, count, items: b.items }, { onConflict: "client_id,week_start" });
    if (error) throw error; return json({ ok: true });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
