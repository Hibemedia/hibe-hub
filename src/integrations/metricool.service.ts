import { supabase } from "@/integrations/supabase/client";

const METRICOOL_PROXY_URL = import.meta.env.VITE_METRICOOL_PROXY_URL;

   
export const MetricoolService = {
  async getFromMetricool(apiDef: string) {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      throw new Error("Not authenticated");
    }

    const res = await fetch(METRICOOL_PROXY_URL, {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        apiDef: apiDef
      },
    });

    if (!res.ok) {
      throw new Error("Metricool proxy unauthorized");
    }

    return res.json();
  },
};
