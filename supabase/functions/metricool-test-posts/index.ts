import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get credentials
    const { data: credentials } = await supabase
      .from('metricool_credentials')
      .select('access_token, user_id')
      .single();

    if (!credentials) {
      return new Response(
        JSON.stringify({ error: 'No credentials found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { access_token: accessToken, user_id: userId } = credentials;

    // Get a test brand
    const { data: brands } = await supabase
      .from('metricool_brands')
      .select('id, label')
      .is('deleted_at', null)
      .limit(1);

    if (!brands || brands.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No brands found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const brandId = brands[0].id;
    const brandLabel = brands[0].label;

    // Test date range (last 30 days)
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setUTCDate(endDate.getUTCDate() - 30);
    
    const yyyymmdd = (d: Date): string => {
      const year = d.getUTCFullYear();
      const month = String(d.getUTCMonth() + 1).padStart(2, '0');
      const day = String(d.getUTCDate()).padStart(2, '0');
      return `${year}${month}${day}`;
    };

    const start = yyyymmdd(startDate);
    const end = yyyymmdd(endDate);

    // Convert dates to correct format
    const formatDate = (d: Date): string => {
      return d.toISOString().split('T')[0];
    };
    
    const fromDate = `${formatDate(startDate)}T00:00:00`;
    const toDate = `${formatDate(endDate)}T23:59:59`;

    // Test different Metricool endpoints
    const tests = [
      {
        name: 'Posts Summary',
        url: `https://api.metricool.com/v2/analytics/brand-summary/posts?from=${fromDate}&to=${toDate}&timezone=Europe/Amsterdam&userId=${userId}&blogId=${brandId}`
      },
      {
        name: 'Brand Summary',
        url: `https://app.metricool.com/api/admin/simpleProfiles?userId=${userId}`
      }
    ];

    const results = [];

    for (const test of tests) {
      try {
        console.log(`Testing ${test.name}: ${test.url}`);
        
        const response = await fetch(test.url, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });

        const responseText = await response.text();
        let responseData;
        
        try {
          responseData = JSON.parse(responseText);
        } catch {
          responseData = { raw: responseText.substring(0, 500) };
        }

        results.push({
          test: test.name,
          url: test.url,
          status: response.status,
          ok: response.ok,
          dataType: Array.isArray(responseData) ? 'array' : typeof responseData,
          count: Array.isArray(responseData) ? responseData.length : null,
          sample: Array.isArray(responseData) ? responseData.slice(0, 3) : responseData,
          headers: Object.fromEntries(response.headers.entries())
        });

      } catch (error) {
        results.push({
          test: test.name,
          url: test.url,
          error: error.message
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        brand: { id: brandId, label: brandLabel },
        dateRange: { start, end },
        tests: results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in test-posts function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});