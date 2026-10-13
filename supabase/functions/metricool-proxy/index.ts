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
    const endpoint = ENDPOINTS[apiDef];
    if (!endpoint) {
      return new Response(JSON.stringify({ error: `Unknown apiDef: ${apiDef}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
