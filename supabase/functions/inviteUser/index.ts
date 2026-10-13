import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer /, "");
    const { data: u } = await admin.auth.getUser(token);
    if (!u?.user) return json({ error: "Niet ingelogd" }, 401);
    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: u.user.id, _role: "admin" });
    if (!isAdmin) return json({ error: "Alleen beheerders" }, 403);

    const body = await req.json().catch(() => ({}));
    const email = String(body.email ?? "").trim().toLowerCase();
    const fullName = body.full_name ? String(body.full_name).slice(0, 200) : null;
    const role = body.role === "admin" ? "admin" : "client";
    const clientId = role === "client" ? (body.client_id ?? null) : null;
    const redirectTo = typeof body.redirect_to === "string" ? body.redirect_to : undefined;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "Ongeldig e-mailadres" }, 400);
    if (role === "client" && !clientId) return json({ error: "Kies een klant voor deze gebruiker" }, 400);

    const { data: existing } = await admin.from("users").select("id").ilike("email", email).maybeSingle();
    if (existing) return json({ error: "Er bestaat al een gebruiker met dit e-mailadres" }, 409);

    let brandid: string | null = null;
    if (clientId) {
      const { data: c } = await admin.from("clients").select("metricool_blog_id").eq("id", clientId).maybeSingle();
      if (!c) return json({ error: "Klant bestaat niet" }, 400);
      brandid = c.metricool_blog_id;
    }

    const { data: invited, error } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { full_name: fullName }, redirectTo,
    });
    if (error) {
      const dup = /already|registered|exists/i.test(error.message);
      return json({ error: dup ? "Er bestaat al een gebruiker met dit e-mailadres" : error.message }, dup ? 409 : 400);
    }
    const id = invited.user.id;
    await admin.from("users").upsert({ id, email, full_name: fullName, client_id: clientId, brandid });
    await admin.from("user_roles").insert({ user_id: id, role });
    await admin.from("profiles_settings").upsert({ user_id: id, full_name: fullName });
    return json({ success: true, user_id: id });
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});
