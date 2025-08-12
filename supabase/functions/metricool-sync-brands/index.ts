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

// Metricool v2 base URL and helpers
const API_BASE = 'https://api.metricool.com/v2'

function yyyymmdd(d: Date): string {
  const year = d.getUTCFullYear()
  const month = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${year}${month}${day}`
}

async function fetchBasePosts(userId: number, brandId: number, token: string, start: string, end: string) {
  const url = `${API_BASE}/brand-summary/posts?userId=${userId}&blogId=${brandId}&start=${start}&end=${end}`
  const res = await fetch(url, {
    headers: { 'X-Mc-Auth': token, 'Content-Type': 'application/json' },
  })
  if (!res.ok) throw new Error(`Metricool base posts failed: ${res.status}`)
  return res.json()
}

async function fetchPlatformDetails(platform: 'facebook' | 'instagram' | 'tiktok' | 'linkedin', userId: number, brandId: number, token: string, start: string, end: string) {
  let endpoint = ''
  switch (platform) {
    case 'facebook':
      endpoint = '/analytics/reels/facebook'; break
    case 'instagram':
      endpoint = '/analytics/reels/instagram'; break
    case 'tiktok':
      endpoint = '/analytics/posts/tiktok'; break
    case 'linkedin':
      endpoint = '/analytics/posts/linkedin'; break
  }
  const url = `${API_BASE}${endpoint}?userId=${userId}&blogId=${brandId}&start=${start}&end=${end}`
  const res = await fetch(url, {
    headers: { 'X-Mc-Auth': token, 'Content-Type': 'application/json' },
  })
  if (!res.ok) throw new Error(`Metricool ${platform} details failed: ${res.status}`)
  return res.json()
}

async function syncBrandContent(supabase: any, userId: number, token: string, brandId: number, connectedPlatforms: string[]) {
  const endDate = new Date()
  const startDate = new Date(endDate)
  startDate.setUTCFullYear(endDate.getUTCFullYear() - 1)
  const start = yyyymmdd(startDate)
  const end = yyyymmdd(endDate)

  // Fetch base posts once for all platforms
  const base = await fetchBasePosts(userId, brandId, token, start, end)
  const basePosts: any[] = Array.isArray(base?.data) ? base.data : Array.isArray(base) ? base : []

  // Normalize network names and filter by connected
  const platformMap: Record<string, 'facebook' | 'instagram' | 'tiktok' | 'linkedin' | 'youtube' | undefined> = {
    'Facebook': 'facebook',
    'Instagram': 'instagram',
    'TikTok': 'tiktok',
    'LinkedIn': 'linkedin',
    'YouTube': 'youtube',
  }
  const connectedLower = connectedPlatforms
    .map(p => platformMap[p])
    .filter(Boolean) as Array<'facebook'|'instagram'|'tiktok'|'linkedin'|'youtube'>

  const filteredBase = basePosts.filter(p => connectedLower.includes(platformMap[p.network] ?? ''))

  // Upsert posts in batches
  const postRows = filteredBase.map((p) => ({
    brand_id: brandId,
    platform: (platformMap[p.network] ?? '').toString(),
    post_id: String(p.id),
    posted_at: p.publicationdate ? new Date(p.publicationdate).toISOString() : null,
    content: p.text ?? null,
    media_url: p.picture ?? null,
    url: p.link ?? null,
    updated_at: new Date().toISOString(),
  }))

  for (let i = 0; i < postRows.length; i += 500) {
    const batch = postRows.slice(i, i + 500)
    if (batch.length === 0) continue
    const { error } = await supabase
      .from('posts')
      .upsert(batch, { onConflict: 'brand_id,platform,post_id' })
    if (error) console.error('Upsert posts error:', error)
  }

  // Fetch back UUIDs for mapping
  const extIds = filteredBase.map(p => String(p.id))
  let postsUuidMap: Record<string, string> = {}
  if (extIds.length > 0) {
    const { data: postRowsDb, error } = await supabase
      .from('posts')
      .select('id, post_id')
      .eq('brand_id', brandId)
      .in('post_id', extIds)
    if (error) console.error('Fetch posts uuids error:', error)
    else {
      for (const r of postRowsDb || []) postsUuidMap[r.post_id] = r.id
    }
  }

  // Fetch platform details and build a lookup
  const detailsByPlatform: Record<string, any[]> = {}
  for (const p of connectedLower) {
    if (p === 'youtube') {
      detailsByPlatform[p] = []
      continue
    }
    try {
      const det = await fetchPlatformDetails(p, userId, brandId, token, start, end)
      const arr = Array.isArray(det?.data) ? det.data : Array.isArray(det) ? det : []
      detailsByPlatform[p] = arr
      // Log per platform
      await supabase.from('metricool_content_sync_logs').insert({
        brand_id: brandId,
        platform: p,
        posts_fetched: arr.length,
        raw_response: null,
      })
    } catch (e) {
      console.error(`Details fetch failed for ${p}:`, e)
      await supabase.from('metricool_content_sync_logs').insert({
        brand_id: brandId,
        platform: p,
        posts_fetched: 0,
        errors: { message: (e as Error).message },
      })
      detailsByPlatform[p] = []
    }
  }

  // Snapshot daily metrics for today
  const today = new Date().toISOString().slice(0, 10)
  const metricRows: any[] = []

  for (const bp of filteredBase) {
    const platform = platformMap[bp.network]!
    const extId = String(bp.id)
    const uuid = postsUuidMap[extId]
    if (!uuid) continue

    // Find detail row by platform-specific key
    let detail: any | undefined
    const candidates = detailsByPlatform[platform] || []
    const matchKey = platform === 'facebook' ? 'reelId'
      : platform === 'instagram' ? 'businessId'
      : platform === 'tiktok' ? 'videoId'
      : platform === 'linkedin' ? 'postId'
      : 'id'
    detail = candidates.find((d: any) => String(d[matchKey]) === extId)

    // Prefer detail metrics, fallback to base
    const likes = parseInt(detail?.likes ?? bp.likes ?? 0)
    const comments = parseInt(detail?.comments ?? bp.comments ?? 0)
    const shares = parseInt(detail?.shares ?? bp.shares ?? 0)
    const views = parseInt(detail?.views ?? detail?.impressions ?? bp.views ?? bp.impressions ?? 0)
    const impressions = parseInt(detail?.impressions ?? bp.impressions ?? views ?? 0)
    const reach = parseInt(detail?.reach ?? 0)
    const saves = parseInt(detail?.saves ?? 0)
    const clicks = parseInt(detail?.clicks ?? 0)
    const engagement = Number(detail?.engagement ?? bp.engagement ?? 0)
    const duration = detail?.duration ? parseInt(detail.duration) : null
    const fvr = detail?.fullVideoWatchedRate ? Number(detail.fullVideoWatchedRate) : null
    const ttw = detail?.totalTimeWatched ? Number(detail.totalTimeWatched) : null
    const atw = detail?.averageTimeWatched ? Number(detail.averageTimeWatched) : null

    metricRows.push({
      post_id: uuid,
      date: today,
      likes, comments, shares, views, impressions, reach, saves, clicks,
      engagement, duration, full_video_watched_rate: fvr, total_time_watched: ttw, average_time_watched: atw,
      impression_sources: detail?.impressionSources ?? null,
      raw_data: detail ?? bp ?? null,
      updated_at: new Date().toISOString(),
    })
  }

  for (let i = 0; i < metricRows.length; i += 500) {
    const batch = metricRows.slice(i, i + 500)
    if (batch.length === 0) continue
    const { error } = await supabase
      .from('post_metrics_daily')
      .upsert(batch, { onConflict: 'post_id,date' })
    if (error) console.error('Upsert post_metrics_daily error:', error)
  }
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

      const brands = await metricoolResponse.json()
      console.log('Retrieved brands from Metricool:', brands.length)

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
          linkedinpicture: brand.linkedInPicture,
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
          tiktokadsuserid: brand.tiktokadsUserId,
          linkedincompanypicture: brand.linkedInCompanyPicture,
          linkedincompanyname: brand.linkedInCompanyName,
          linkedintokenexpiration: brand.linkedInTokenExpiration,
          linkedinuserprofileurl: brand.linkedInUserProfileURL,
          youtubechannelname: brand.youtubeChannelName,
          youtubechannelpicture: brand.youtubeChannelPicture,
          twitchname: brand.twitchName,
          twitchpicture: brand.twitchPicture,
          twitchchannelid: brand.twitchChannelId,
          tiktokadsdisplayname: brand.tiktokadsDisplayName,
          tiktokadspicture: brand.tiktokadsPicture,
          tiktokuserprofileurl: brand.tiktokUserProfileUrl,
          isshared: brand.isShared,
          ownerusername: brand.ownerUsername,
          whitelabellink: brand.whiteLabelLink,
          analyticmodewhitelabellink: brand.analyticModeWhitelabelLink,
          whitelabelalias: brand.whiteLabelAlias,
          hash: brand.hash,
          version: brand.version,
          frontendversion: brand.frontendVersion,
          role: brand.role,
          deletedate: brand.deleteDate ? new Date(brand.deleteDate).toISOString() : null,
          deleted: brand.deleted,
          joindate: brand.joinDate ? new Date(brand.joinDate).toISOString() : null,
          firstconnectiondate: brand.firstConnectionDate ? new Date(brand.firstConnectionDate).toISOString() : null,
          lastresolvedinboxmessagetimestamp: brand.lastResolvedInboxMessageTimestamp ? new Date(brand.lastResolvedInboxMessageTimestamp).toISOString() : null,
          lastreadinboxmessagetimestamp: brand.lastReadInboxMessageTimestamp ? new Date(brand.lastReadInboxMessageTimestamp).toISOString() : null,
          timezone: brand.timezone,
          availableconnectors: Array.isArray(brand.availableConnectors) ? brand.availableConnectors.join(',') : brand.availableConnectors,
          brandrole: brand.brandRole,
          iswhitelabel: brand.isWhiteLabel,
          iswhitelabelonlyread: brand.isWhiteLabelOnlyRead,
          engagementratio: brand.engagementRatio,
          raw_data: brand,
          last_synced_at: new Date().toISOString(),
          deleted_at: null // Clear deleted_at if brand reappears
        }

        // Check if brand exists
        if (existingBrandIds.has(brand.id)) {
          // Update existing brand
          const { error } = await supabase
            .from('metricool_brands')
            .update(brandData)
            .eq('id', brand.id)

          if (error) {
            console.error('Error updating brand:', error)
          } else {
            updated++
          }
        } else {
          // Insert new brand
          const { error } = await supabase
            .from('metricool_brands')
            .insert(brandData)

          if (error) {
            console.error('Error inserting brand:', error)
          } else {
            created++
          }
        }

        // Content sync for this brand (last 12 months)
        try {
          await syncBrandContent(supabase, userId, accessToken, brand.id, connectedPlatforms)
        } catch (e) {
          console.error('Content sync failed for brand', brand.id, e)
        }
      }

      // Mark missing brands as deleted (soft delete)
      for (const existingId of existingBrandIds) {
        if (!fetchedBrandIds.has(existingId)) {
          const { error } = await supabase
            .from('metricool_brands')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', existingId)
            .is('deleted_at', null)

          if (error) {
            console.error('Error soft deleting brand:', error)
          } else {
            markedDeleted++
          }
        }
      }

      // Clean up old deleted records (31+ days)
      await supabase.rpc('cleanup_deleted_metricool_brands')

      // Update sync log with results
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

      console.log(`Sync completed: ${created} created, ${updated} updated, ${markedDeleted} marked deleted`)

      return new Response(
        JSON.stringify({
          success: true,
          created,
          updated,
          marked_deleted: markedDeleted,
          total_brands: brands.length
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } catch (error) {
      // Update sync log with error
      await supabase
        .from('metricool_sync_logs')
        .update({
          finished_at: new Date().toISOString(),
          status: 'failed',
          error_message: error.message
        })
        .eq('id', syncLogId)

      throw error
    }

  } catch (error) {
    console.error('Error in sync-brands function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})