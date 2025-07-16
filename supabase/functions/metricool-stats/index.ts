import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const url = new URL(req.url);
    const blogId = url.searchParams.get('blogId');
    const metric = url.searchParams.get('metric') || 'igFollowers';
    const start = url.searchParams.get('start');
    const end = url.searchParams.get('end');

    if (!blogId) {
      return new Response(
        JSON.stringify({ error: 'blogId is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get Metricool settings
    const { data: settings, error: settingsError } = await supabase
      .from('metricool_settings')
      .select('*')
      .eq('is_active', true)
      .single();

    if (settingsError || !settings) {
      console.error('No active Metricool settings found:', settingsError);
      return new Response(
        JSON.stringify({ error: 'No active Metricool settings found' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const apiToken = Deno.env.get('METRICOOL_API_TOKEN');
    if (!apiToken) {
      return new Response(
        JSON.stringify({ error: 'API token not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Build Metricool API URL
    const baseUrl = 'https://app.metricool.com/api';
    const endpoint = `/stats/timeline/${metric}`;
    const metricoolUrl = new URL(`${baseUrl}${endpoint}`);
    
    // Add required parameters
    metricoolUrl.searchParams.append('userId', settings.user_id.toString());
    metricoolUrl.searchParams.append('blogId', blogId);
    
    if (start) {
      metricoolUrl.searchParams.append('start', start);
    }
    if (end) {
      metricoolUrl.searchParams.append('end', end);
    }

    console.log('Making Metricool API call to:', metricoolUrl.toString());

    // Make API call to Metricool
    const response = await fetch(metricoolUrl.toString(), {
      method: 'GET',
      headers: {
        'X-Mc-Auth': apiToken,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Metricool API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ 
          error: 'Metricool API error', 
          status: response.status,
          message: errorText
        }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const data = await response.json();
    console.log('Metricool API response:', data);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data,
        blogId,
        metric,
        dateRange: { start, end }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in metricool-stats function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});