import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { accessToken, userId } = await req.json()

    if (!accessToken || !userId) {
      return new Response(
        JSON.stringify({ error: 'Access token and user ID are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Testing Metricool connection with userId:', userId)

    // Test connection to Metricool API
    const metricoolResponse = await fetch(
      `https://app.metricool.com/api/admin/simpleProfiles?userId=${userId}`,
      {
        headers: {
          'X-Mc-Auth': accessToken,
          'Content-Type': 'application/json',
        },
      }
    )

    console.log('Metricool API response status:', metricoolResponse.status)

    if (!metricoolResponse.ok) {
      const errorText = await metricoolResponse.text()
      console.error('Metricool API error:', errorText)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to connect to Metricool API',
          status: metricoolResponse.status,
          details: errorText
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const data = await metricoolResponse.json()
    console.log('Metricool API response data count:', data?.length || 0)

    // Save or update credentials
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { error: credentialsError } = await supabase
      .from('metricool_credentials')
      .upsert(
        { access_token: accessToken, user_id: userId },
        { onConflict: 'singleton_check' }
      )

    if (credentialsError) {
      console.error('Error saving credentials:', credentialsError)
      return new Response(
        JSON.stringify({ error: 'Failed to save credentials' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Connection successful',
        brandCount: data?.length || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in test-connection function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})