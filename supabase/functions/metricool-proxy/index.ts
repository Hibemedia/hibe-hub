import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, apidef",
};

// Map of supported apiDef values to Metricool API endpoints
const ENDPOINTS: Record<string, (userId: string) => string> = {
  getBrands: (userId) => `https://app.metricool.com/api/admin/simpleProfiles?userId=${userId}`,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const metricoolToken = Deno.env.get("METRICOOL_API_TOKEN");
    const metricoolUserId = Deno.env.get("METRICOOL_USER_ID");

    if (!metricoolToken || !metricoolUserId) {
      return new Response(JSON.stringify({ error: "Metricool is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Require a signed-in user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await callerClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiDef = req.headers.get("apiDef") || "";
    if (apiDef === "scheduledPosts") {
      const body = await req.json().catch(() => ({}));
      const clientId = typeof body.client_id === "string" ? body.client_id : "";
      // RLS decides access: clients only see their own client row, HIBE sees all.
      const { data: c } = await callerClient.from("clients").select("id,metricool_blog_id").eq("id", clientId).maybeSingle();
      if (!c) return new Response(JSON.stringify({ error: "Geen toegang" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (!c.metricool_blog_id) return new Response(JSON.stringify({ posts: [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const day = (d: Date) => d.toISOString().slice(0, 10);
      const now = new Date(); const end = new Date(now.getTime() + 60 * 86400000);
      const qs = new URLSearchParams({ userId: metricoolUserId, blogId: c.metricool_blog_id, start: `${day(now)}T00:00:00`, end: `${day(end)}T23:59:59`, timezone: "Europe/Amsterdam" });
      const r = await fetch(`https://app.metricool.com/api/v2/scheduler/posts?${qs}`, { headers: { "X-Mc-Auth": metricoolToken } });
      if (!r.ok) return new Response(JSON.stringify({ error: `Metricool ${r.status}` }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const j = await r.json();
      const list: any[] = Array.isArray(j) ? j : (j?.data ?? []);
      const posts = list.filter((p) => p && !p.draft && (p.providers ?? []).some((x: any) => x.status !== "PUBLISHED")).map((p) => {
        const media = (p.media ?? [])[0];
        return {
          id: String(p.id),
          date: p.publicationDate?.dateTime ?? null,
          networks: (p.providers ?? []).map((x: any) => String(x.network ?? x).toLowerCase()),
          text: (p.text ?? "").slice(0, 400),
          image: typeof media === "string" ? media : (media?.url ?? media?.thumbnailUrl ?? null),
        };
      }).sort((a, b) => String(a.date).localeCompare(String(b.date)));
      return new Response(JSON.stringify({ posts }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const buildEndpoint = ENDPOINTS[apiDef];
    if (!buildEndpoint) {
      return new Response(JSON.stringify({ error: `Unknown apiDef: ${apiDef}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const endpoint = buildEndpoint(metricoolUserId);

    const res = await fetch(endpoint, {
      headers: { "X-Mc-Auth": metricoolToken },
    });

    if (!res.ok) {
      return new Response(JSON.stringify({ error: `Metricool request failed: ${res.status}` }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
