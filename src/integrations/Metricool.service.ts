import { supabase } from "@/integrations/supabase/client";

export const MetricoolService = {
  async getFromMetricool(apiDef: string) {
    const { data, error } = await supabase.functions.invoke("metricool-proxy", {
      method: "GET",
      headers: { apiDef },
    });
    if (error) throw new Error(`Metricool proxy error: ${error.message}`);
    return data;
  },
};
