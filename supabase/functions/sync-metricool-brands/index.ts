import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MetricoolBrand {
  id: number;
  name: string;
  platforms?: {
    id: string;
    name: string;
    type: string;
  }[];
}

interface MetricoolSocialAccount {
  id: string;
  name: string;
  type: string;
  platform: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Check if user is admin
    const { data: profile, error: profileError } = await supabaseClient
      .from('users')
      .select('role')
      .eq('id', (await supabaseClient.auth.getUser()).data.user?.id)
      .single()

    if (profileError || profile?.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Admin access required' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Get global Metricool credentials (singleton row)
    const { data: credentials, error: credentialsError } = await supabaseClient
      .from('metricool_credentials')
      .select('access_token, user_id')
      .limit(1)
      .maybeSingle()

    if (credentialsError || !credentials) {
      return new Response(
        JSON.stringify({ error: 'No Metricool credentials found' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const { access_token, user_id } = credentials

    // Fetch brands from Metricool
    console.log('Fetching brands from Metricool API...')
    const brandsResponse = await fetch(
      `https://app.metricool.com/api/v1/brands?userId=${user_id}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!brandsResponse.ok) {
      const errorText = await brandsResponse.text()
      console.error('Metricool API error:', brandsResponse.status, errorText)
      return new Response(
        JSON.stringify({ 
          error: `Metricool API error: ${brandsResponse.status} ${brandsResponse.statusText}`,
          details: errorText
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const brandsData = await brandsResponse.json()
    const brands: MetricoolBrand[] = brandsData.data || []

    console.log(`Found ${brands.length} brands`)

    // Process each brand and fetch social accounts
    const processedBrands = []
    for (const brand of brands) {
      try {
        console.log(`Fetching social accounts for brand ${brand.id}: ${brand.name}`)
        
        // Fetch social accounts for this brand
        const socialAccountsResponse = await fetch(
          `https://app.metricool.com/api/v1/brand/${brand.id}/social-accounts`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${access_token}`,
              'Content-Type': 'application/json',
            },
          }
        )

        let platforms: string[] = []
        if (socialAccountsResponse.ok) {
          const socialAccountsData = await socialAccountsResponse.json()
          const socialAccounts: MetricoolSocialAccount[] = socialAccountsData.data || []
          platforms = socialAccounts.map(account => account.platform).filter(Boolean)
        } else {
          console.warn(`Failed to fetch social accounts for brand ${brand.id}:`, socialAccountsResponse.status)
        }

        processedBrands.push({
          brand_id: brand.id,
          name: brand.name,
          platforms: platforms,
          synced_at: new Date().toISOString()
        })
      } catch (error) {
        console.error(`Error processing brand ${brand.id}:`, error)
        // Continue with other brands even if one fails
        processedBrands.push({
          brand_id: brand.id,
          name: brand.name,
          platforms: [],
          synced_at: new Date().toISOString()
        })
      }
    }

    // Upsert brands to database
    const { data: upsertedBrands, error: upsertError } = await supabaseClient
      .from('metricool_brands')
      .upsert(
        processedBrands,
        { 
          onConflict: 'brand_id',
          ignoreDuplicates: false 
        }
      )
      .select()

    if (upsertError) {
      console.error('Database upsert error:', upsertError)
      return new Response(
        JSON.stringify({ error: 'Failed to save brands to database', details: upsertError }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log(`Successfully synced ${processedBrands.length} brands`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        brandsCount: processedBrands.length,
        brands: upsertedBrands,
        syncedAt: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Sync error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})