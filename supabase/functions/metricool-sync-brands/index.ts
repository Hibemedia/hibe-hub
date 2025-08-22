
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Platform detection logic based on requirements
function detectConnectedPlatforms(brand: any): string[] {
  const platforms: string[] = []

  // Facebook
  if (brand.facebookPageId || brand.facebook || brand.facebookGroupId || brand.facebookAds) {
    platforms.push('Facebook')
  }

  // Instagram  
  if (brand.instagram || brand.instagramPicture || brand.instagramConnectionType) {
    platforms.push('Instagram')
  }

  // TikTok
  if (brand.tiktok || brand.tiktokads || brand.tiktokadsDisplayName || brand.tiktokadsUserId || brand.tiktokPicture) {
    platforms.push('TikTok')
  }

  // LinkedIn
  if (brand.linkedinCompany || brand.linkedInCompanyName || brand.linkedInUserProfileURL || brand.linkedInPicture) {
    platforms.push('LinkedIn')
  }

  // YouTube
  if (brand.youtube || brand.youtubeChannelName || brand.youtubeChannelPicture) {
    platforms.push('YouTube')
  }

  // Pinterest
  if (brand.pinterest || brand.pinterestBusiness || brand.pinterestPicture) {
    platforms.push('Pinterest')
  }

  return platforms
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get stored credentials
    const { data: credentials } = await supabase
      .from('metricool_credentials')
      .select('*')
      .single()

    if (!credentials) {
      return new Response(
        JSON.stringify({ error: 'No credentials found. Please test connection first.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { access_token: accessToken, user_id: userId } = credentials

    // Get source from request body (manual or auto)
    const body = await req.json().catch(() => ({}))
    const source = body.source || 'manual'
    const brandFilter = body.brand_id as number | undefined

    console.log('Starting Metricool brands sync, source:', source)

    // Create sync log entry
    const { data: syncLogData, error: syncLogError } = await supabase
      .from('metricool_sync_logs')
      .insert({
        started_at: new Date().toISOString(),
        source
      })
      .select()
      .single()

    if (syncLogError) {
      console.error('Error creating sync log:', syncLogError)
      return new Response(
        JSON.stringify({ error: 'Failed to create sync log' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const syncLogId = syncLogData.id

    try {
      // Fetch brands from Metricool API
      const metricoolResponse = await fetch(
        `https://app.metricool.com/api/admin/simpleProfiles?userId=${userId}`,
        {
          headers: {
            'X-Mc-Auth': accessToken,
            'Content-Type': 'application/json',
          },
        }
      )

      if (!metricoolResponse.ok) {
        throw new Error(`Metricool API error: ${metricoolResponse.status}`)
      }

      let brands = await metricoolResponse.json()
      console.log('Retrieved brands from Metricool:', brands.length)

      // Optionally filter to a single brand when requested
      if (brandFilter) {
        brands = brands.filter((b: any) => b.id === brandFilter)
      }

      // Get existing brands to track what needs to be soft deleted
      const { data: existingBrands } = await supabase
        .from('metricool_brands')
        .select('id, deleted_at')

      const existingBrandIds = new Set(existingBrands?.map(b => b.id) || [])
      const fetchedBrandIds = new Set(brands.map((b: any) => b.id))

      let created = 0
      let updated = 0
      let markedDeleted = 0

      // Process each brand
      for (const brand of brands) {
        // Detect connected platforms
        const connectedPlatforms = detectConnectedPlatforms(brand)

        // Prepare brand data for database
        const brandData = {
          id: brand.id,
          userid: brand.userId,
          owneruserid: brand.ownerUserId,
          label: brand.label || "Empty brand",
          url: brand.url,
          title: brand.title,
          description: brand.description,
          picture: brand.picture,
          twitter: brand.twitter,
          facebook: brand.facebook,
          facebookpageid: brand.facebookPageId,
          facebookgroup: brand.facebookGroup,
          facebookgroupid: brand.facebookGroupId,
          instagram: brand.instagram,
          fbbusinessid: brand.fbBusinessId,
          googleplus: brand.googlePlus,
          linkedincompany: brand.linkedinCompany,
          facebookads: brand.facebookAds,
          adwords: brand.adwords,
          gmb: brand.gmb,
          youtube: brand.youtube,
          twitch: brand.twitch,
          tiktokads: brand.tiktokads,
          pinterest: brand.pinterest,
          tiktok: brand.tiktok,
          threads: brand.threads,
          bluesky: brand.bluesky,
          feedrss: brand.feedRss,
          tiktokaccounttype: brand.tiktokAccountType,
          instagramconnectiontype: brand.instagramConnectionType,
          twitterpicture: brand.twitterPicture,
          twittersubscriptiontype: brand.twitterSubscriptionType,
          facebookpicture: brand.facebookPicture,
          facebookgrouppicture: brand.facebookGroupPicture,
          instagrampicture: brand.instagramPicture,
          linkedinpicture: brand.linkedinPicture,
          facebookadspicture: brand.facebookAdsPicture,
          facebookadsname: brand.facebookAdsName,
          pinterestpicture: brand.pinterestPicture,
          pinterestbusiness: brand.pinterestBusiness,
          tiktokpicture: brand.tiktokPicture,
          tiktokbusinesstokenexpiration: brand.tiktokBusinessTokenExpiration,
          threadspicture: brand.threadsPicture,
          threadsaccountname: brand.threadsAccountName,
          blueskypicture: brand.blueskyPicture,
          blueskyhandle: brand.blueskyHandle,
          fbuserid: brand.fbUserId,
          inuserid: brand.inUserId,
          adwordsuserid: brand.adwordsUserId,
          adwordsaccountname: brand.adwordsAccountName,
          gmbuserid: brand.gmbUserId,
          gmbaccountname: brand.gmbAccountName,
          gmbaddress: brand.gmbAddress,
          gmburl: brand.gmbUrl,
          raw_data: brand,
          last_synced_at: new Date().toISOString(),
          deleted_at: null,
          updated_at: new Date().toISOString(),
        }

        // Upsert brand
        const { error: brandError } = await supabase
          .from('metricool_brands')
          .upsert(brandData, { onConflict: 'id' })

        if (brandError) {
          console.error('Error upserting brand:', brandError)
          continue
        }

        if (existingBrandIds.has(brand.id)) {
          updated++
        } else {
          created++
        }

        console.log(`Processed brand: ${brand.label} (ID: ${brand.id}), platforms: ${connectedPlatforms.join(', ')}`)
      }

      // Mark brands as soft deleted if they're no longer in Metricool
      for (const existingId of existingBrandIds) {
        if (!fetchedBrandIds.has(existingId)) {
          const { error: deleteError } = await supabase
            .from('metricool_brands')
            .update({ 
              deleted_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', existingId)
            .is('deleted_at', null)

          if (!deleteError) {
            markedDeleted++
          }
        }
      }

      // Update sync log with success
      await supabase
        .from('metricool_sync_logs')
        .update({
          finished_at: new Date().toISOString(),
          status: 'success',
          created,
          updated,
          marked_deleted: markedDeleted
        })
        .eq('id', syncLogId)

      console.log('Metricool brands sync completed successfully', { created, updated, markedDeleted })

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Brands sync completed successfully',
          stats: { created, updated, markedDeleted, totalProcessed: brands.length }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } catch (error) {
      console.error('Sync error:', error)
      
      // Update sync log with error
      await supabase
        .from('metricool_sync_logs')
        .update({
          finished_at: new Date().toISOString(),
          status: 'failed',
          error_message: (error as Error).message
        })
        .eq('id', syncLogId)

      return new Response(
        JSON.stringify({
          error: 'Sync failed',
          message: (error as Error).message
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    console.error('Server error:', error)
    return new Response(
      JSON.stringify({
        error: 'Server error',
        message: (error as Error).message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
