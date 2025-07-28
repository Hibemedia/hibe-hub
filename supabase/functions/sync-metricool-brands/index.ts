import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MetricoolProfile {
  blogId: number
  name: string
  networks: string[]
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Starting Metricool brands synchronization...')

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get stored Metricool credentials
    const { data: credentials, error: credentialsError } = await supabase
      .from('metricool_credentials')
      .select('access_token, user_id')
      .single()

    if (credentialsError || !credentials) {
      console.error('Failed to get Metricool credentials:', credentialsError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Metricool credentials not found. Please configure them first.' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!credentials.access_token || !credentials.user_id) {
      console.error('Missing access_token or user_id in credentials')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Incomplete Metricool credentials. Please ensure both access_token and user_id are configured.' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Retrieved credentials, fetching brands from Metricool API...')

    // Fetch brands from Metricool API
    const metricoolUrl = `https://app.metricool.com/api/admin/simpleProfiles?userId=${credentials.user_id}`
    const metricoolResponse = await fetch(metricoolUrl, {
      method: 'GET',
      headers: {
        'X-Mc-Auth': credentials.access_token,
        'Content-Type': 'application/json'
      }
    })

    if (!metricoolResponse.ok) {
      console.error('Metricool API error:', metricoolResponse.status, metricoolResponse.statusText)
      const errorText = await metricoolResponse.text()
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Metricool API error: ${metricoolResponse.status} - ${errorText}` 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const profilesData = await metricoolResponse.json() as MetricoolProfile[]
    console.log(`Fetched ${profilesData.length} profiles from Metricool`)

    if (!Array.isArray(profilesData)) {
      console.error('Invalid response format from Metricool API:', profilesData)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid response format from Metricool API' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Clear existing brands and insert new ones
    const { error: deleteError } = await supabase
      .from('metricool_brands')
      .delete()
      .neq('brand_id', 0) // Delete all

    if (deleteError) {
      console.error('Failed to clear existing brands:', deleteError)
    }

    // Insert new brands
    const brandsToInsert = profilesData.map(profile => ({
      brand_id: profile.blogId,
      name: profile.name,
      platforms: profile.networks || [],
      synced_at: new Date().toISOString()
    }))

    const { data: insertedBrands, error: insertError } = await supabase
      .from('metricool_brands')
      .insert(brandsToInsert)
      .select()

    if (insertError) {
      console.error('Failed to insert brands:', insertError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to save brands: ${insertError.message}` 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`Successfully synchronized ${insertedBrands?.length || 0} brands`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully synchronized ${insertedBrands?.length || 0} brands`,
        brands: insertedBrands
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in sync-metricool-brands function:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Server error: ${error.message}` 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})