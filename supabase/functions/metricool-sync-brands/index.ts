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

function yyyymmdd(d: Date): string {
  const year = d.getUTCFullYear()
  const month = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

async function fetchWithRetry(url: string, options: RequestInit, retries = 3, backoffMs = 500): Promise<Response> {
  let attempt = 0
  let lastErr: any
  while (attempt < retries) {
    try {
      const res = await fetch(url, options)
      if (res.ok) return res
      lastErr = new Error(`HTTP ${res.status}`)
    } catch (e) {
      lastErr = e
    }
    attempt++
    await new Promise(r => setTimeout(r, backoffMs * attempt))
  }
  throw lastErr
}

// Fetch base posts data from brand-summary/posts endpoint
async function fetchBasePosts(userId: number, brandId: number, token: string, start: string, end: string) {
  const url = `https://api.metricool.com/v2/analytics/brand-summary/posts?from=${start}T00:00:00&to=${end}T23:59:59&timezone=Europe/Amsterdam&userId=${userId}&blogId=${brandId}`;
  
  try {
    console.log(`Fetching base posts for brand ${brandId}...`);
    const response = await fetchWithRetry(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`Base posts success for brand ${brandId}: ${data.data?.length || 0} posts`);
      return { success: true, data: data.data || [] };
    } else {
      console.log(`Base posts failed for brand ${brandId}: HTTP ${response.status}`);
      return { success: false, data: [] };
    }
  } catch (error) {
    console.log(`Base posts error for brand ${brandId}:`, error.message);
    return { success: false, data: [] };
  }
}

// Fetch platform-specific details
async function fetchPlatformDetails(
  platform: 'facebook' | 'instagram' | 'tiktok' | 'linkedin',
  userId: number,
  brandId: number,
  token: string,
  start: string,
  end: string
) {
  const urls = {
    facebook: `https://api.metricool.com/v2/analytics/reels/facebook?from=${start}T00:00:00&to=${end}T23:59:59&timezone=Europe/Amsterdam&blogId=${brandId}&userId=${userId}`,
    instagram: `https://api.metricool.com/v2/analytics/reels/instagram?from=${start}T00:00:00&to=${end}T23:59:59&timezone=Europe/Amsterdam&userId=${userId}&blogId=${brandId}`,
    tiktok: `https://api.metricool.com/v2/analytics/posts/tiktok?from=${start}T00:00:00&to=${end}T23:59:59&timezone=Europe/Amsterdam&blogId=${brandId}&userId=${userId}`,
    linkedin: `https://api.metricool.com/v2/analytics/posts/linkedin?from=${start}T00:00:00&to=${end}T23:59:59&timezone=Europe/Amsterdam&blogId=${brandId}&userId=${userId}`
  };

  try {
    console.log(`Fetching ${platform} details for brand ${brandId}...`);
    const response = await fetchWithRetry(urls[platform], {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`${platform} details success for brand ${brandId}: ${data.data?.length || 0} items`);
      return { success: true, data: data.data || [] };
    } else {
      console.log(`${platform} details failed for brand ${brandId}: HTTP ${response.status}`);
      return { success: false, data: [] };
    }
  } catch (error) {
    console.log(`${platform} details error for brand ${brandId}:`, error.message);
    return { success: false, data: [] };
  }
}

// Main sync function for brand content
async function syncBrandContent(supabase: any, credentialsUserId: number, token: string, brandId: number, connectedPlatforms: string[], opts?: { forceFull?: boolean }) {
  console.log(`Starting content sync for brand ${brandId}, platforms: ${connectedPlatforms.join(', ')}`);
  
  // Determine sync mode: full (forced or empty) vs incremental
  let mode: 'full' | 'incremental' = opts?.forceFull ? 'full' : 'incremental'
  let startDate: Date
  const endDate = new Date()

  if (mode !== 'full') {
    // Check existing data
    const { count: postsCount } = await supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('brand_id', brandId)

    const { data: lastMetric, error: lastErr } = await supabase
      .from('post_metrics_daily')
      .select('date, posts!inner(id, brand_id)')
      .eq('posts.brand_id', brandId)
      .order('date', { ascending: false })
      .limit(1)

    if ((postsCount ?? 0) === 0 || lastErr || !lastMetric || lastMetric.length === 0) {
      mode = 'full'
    }
  }

  if (mode === 'full') {
    startDate = new Date(endDate)
    startDate.setUTCFullYear(endDate.getUTCFullYear() - 1)
  } else {
    const { data: lastMetric } = await supabase
      .from('post_metrics_daily')
      .select('date')
      .order('date', { ascending: false })
      .limit(1)
    const lastDate = lastMetric?.[0]?.date ? new Date(lastMetric[0].date as string) : new Date(endDate)
    startDate = new Date(lastDate)
    startDate.setUTCDate(startDate.getUTCDate() - 1)
  }

  const start = yyyymmdd(startDate)
  const end = yyyymmdd(endDate)

  console.log(`Sync mode: ${mode}, date range: ${start} to ${end}`);

  // Fetch base posts
  const basePostsResult = await fetchBasePosts(credentialsUserId, brandId, token, start, end);
  if (!basePostsResult.success) {
    console.log(`No base posts found for brand ${brandId}`);
    return;
  }

  const basePosts = basePostsResult.data;
  console.log(`Found ${basePosts.length} base posts for brand ${brandId}`);

  // Platform mapping
  const platformMap: Record<string, 'facebook' | 'instagram' | 'tiktok' | 'linkedin' | 'youtube'> = {
    'facebook': 'facebook',
    'instagram': 'instagram', 
    'tiktok': 'tiktok',
    'linkedin': 'linkedin',
    'youtube': 'youtube'
  }

  // Filter base posts by connected platforms
  const connectedLower = connectedPlatforms
    .map(p => p.toLowerCase())
    .filter(p => Object.keys(platformMap).includes(p)) as Array<keyof typeof platformMap>

  const filteredBase = basePosts.filter(p => {
    const network = p.network?.toLowerCase();
    return connectedLower.includes(network);
  });

  console.log(`Filtered to ${filteredBase.length} posts for connected platforms`);

  // Upsert posts
  const postRows = filteredBase.map((p) => ({
    brand_id: brandId,
    platform: p.network?.toLowerCase() || '',
    post_id: String(p.id),
    posted_at: p.publicationDate?.dateTime ? new Date(p.publicationDate.dateTime).toISOString() : null,
    content: p.text || null,
    media_url: p.picture || null,
    url: p.link || null,
    updated_at: new Date().toISOString(),
  }))

  if (postRows.length > 0) {
    const { error } = await supabase
      .from('posts')
      .upsert(postRows, { onConflict: 'brand_id,platform,post_id' });
    
    if (error) {
      console.error('Error upserting posts:', error);
    } else {
      console.log(`Upserted ${postRows.length} posts for brand ${brandId}`);
    }
  }

  // Get UUIDs for the posts we just upserted
  const extIds = filteredBase.map(p => String(p.id));
  let postsUuidMap: Record<string, string> = {};
  
  if (extIds.length > 0) {
    const { data: postRowsDb, error } = await supabase
      .from('posts')
      .select('id, post_id')
      .eq('brand_id', brandId)
      .in('post_id', extIds);
      
    if (error) {
      console.error('Error fetching post UUIDs:', error);
    } else {
      for (const r of postRowsDb || []) {
        postsUuidMap[r.post_id] = r.id;
      }
    }
  }

  // Log base posts summary
  try {
    await supabase.from('metricool_content_sync_logs').insert({
      brand_id: brandId,
      platform: 'summary',
      posts_fetched: filteredBase.length,
      raw_response: { 
        sample: filteredBase.slice(0, 3), 
        total: filteredBase.length, 
        mode, 
        range: { start, end } 
      },
    });
  } catch (e) {
    console.error('Error logging base posts:', e);
  }

  // Fetch platform-specific details
  const detailsByPlatform: Record<string, any[]> = {};
  
  for (const platform of connectedLower) {
    if (platform === 'youtube') {
      // YouTube has no additional endpoint
      detailsByPlatform[platform] = [];
      continue;
    }

    try {
      const detailsResult = await fetchPlatformDetails(platform, credentialsUserId, brandId, token, start, end);
      detailsByPlatform[platform] = detailsResult.success ? detailsResult.data : [];
      
      // Log platform details
      await supabase.from('metricool_content_sync_logs').insert({
        brand_id: brandId,
        platform: platform,
        posts_fetched: detailsByPlatform[platform].length,
        raw_response: { 
          sample: detailsByPlatform[platform].slice(0, 3), 
          total: detailsByPlatform[platform].length, 
          mode, 
          range: { start, end } 
        },
      });
    } catch (e) {
      console.error(`Error fetching ${platform} details:`, e);
      detailsByPlatform[platform] = [];
      
      await supabase.from('metricool_content_sync_logs').insert({
        brand_id: brandId,
        platform: platform,
        posts_fetched: 0,
        errors: { message: (e as Error).message },
      });
    }
  }

  // Create daily metrics
  const today = new Date().toISOString().slice(0, 10);
  const metricRows: any[] = [];

  for (const bp of filteredBase) {
    const platform = bp.network?.toLowerCase();
    const extId = String(bp.id);
    const uuid = postsUuidMap[extId];
    
    if (!uuid) {
      console.log(`No UUID found for post ${extId}`);
      continue;
    }

    // Find matching detail record based on platform-specific ID field
    let detail: any | undefined;
    const candidates = detailsByPlatform[platform] || [];
    
    if (platform === 'facebook') {
      detail = candidates.find((d: any) => String(d.reelId) === extId);
    } else if (platform === 'instagram') {
      detail = candidates.find((d: any) => String(d.businessId) === extId);
    } else if (platform === 'tiktok') {
      detail = candidates.find((d: any) => String(d.videoId) === extId);
    } else if (platform === 'linkedin') {
      detail = candidates.find((d: any) => String(d.postId) === extId);
    }

    // Extract metrics with platform-specific logic
    let likes = 0, comments = 0, shares = 0, views = 0, impressions = 0;
    let reach = 0, saves = 0, clicks = 0, engagement = 0;
    let duration: number | null = null;
    let fullVideoWatchedRate: number | null = null;
    let totalTimeWatched: number | null = null;
    let averageTimeWatched: number | null = null;
    let impressionSources: any = null;

    // Base metrics from brand-summary/posts
    if (bp.metrics) {
      if (platform === 'youtube') {
        likes = bp.metrics.INTERACTIONS || 0; // likes
        views = bp.metrics.IMPRESSIONS || 0;  // views
        // engagement is null for YouTube
      } else if (platform === 'tiktok') {
        likes = bp.metrics.INTERACTIONS || 0; // likes + saves combined
        views = bp.metrics.IMPRESSIONS || 0;  // views
        engagement = bp.metrics.ENGAGEMENT || 0;
      } else if (platform === 'facebook') {
        likes = bp.metrics.INTERACTIONS || 0; // likes
        views = bp.metrics.IMPRESSIONS || 0;  // views
        engagement = bp.metrics.ENGAGEMENT || 0;
      } else if (platform === 'instagram') {
        likes = bp.metrics.INTERACTIONS || 0; // likes + saves combined
        views = bp.metrics.IMPRESSIONS || 0;  // views
        engagement = bp.metrics.ENGAGEMENT || 0;
      } else if (platform === 'linkedin') {
        likes = bp.metrics.INTERACTIONS || 0; // likes + shares combined
        views = bp.metrics.IMPRESSIONS || 0;  // views
        engagement = bp.metrics.ENGAGEMENT || 0;
      }
    }

    // Override with detailed metrics if available
    if (detail) {
      if (platform === 'facebook') {
        duration = detail.length || null;
        views = Math.max(views, detail.blueReelsPlayCount || 0);
        impressions = Math.max(impressions, detail.postImpressionsUnique || 0);
        totalTimeWatched = detail.postVideoViewTimeSeconds || null;
        averageTimeWatched = detail.postVideoAvgTimeWatchedSeconds || null;
        likes = Math.max(likes, detail.postVideoReactions || 0);
        shares = detail.postVideoSocialActions || 0;
        engagement = detail.engagement || engagement;
      } else if (platform === 'instagram') {
        likes = Math.max(likes, detail.likes || 0);
        comments = detail.comments || 0;
        views = Math.max(views, detail.views || 0);
        reach = detail.reach || 0;
        saves = detail.saved || 0;
        shares = detail.shares || 0;
        engagement = detail.engagement || engagement;
      } else if (platform === 'tiktok') {
        duration = detail.duration || null;
        likes = Math.max(likes, detail.likeCount || 0);
        comments = detail.commentCount || 0;
        shares = detail.shareCount || 0;
        views = Math.max(views, detail.viewCount || 0);
        engagement = detail.engagement || engagement;
        reach = detail.reach || 0;
        fullVideoWatchedRate = detail.fullVideoWatchedRate || null;
        totalTimeWatched = detail.totalTimeWatched || null;
        averageTimeWatched = detail.averageTimeWatched || null;
        impressionSources = detail.impressionSources || null;
      } else if (platform === 'linkedin') {
        clicks = detail.clicks || 0;
        comments = detail.comments || 0;
        likes = Math.max(likes, detail.likes || 0);
        shares = detail.shares || 0;
        impressions = Math.max(impressions, detail.impressions || 0);
        engagement = detail.engagement || engagement;
      }
    }

    metricRows.push({
      post_id: uuid,
      date: today,
      likes,
      comments,
      shares,
      views,
      impressions,
      reach,
      saves,
      clicks,
      engagement,
      duration,
      full_video_watched_rate: fullVideoWatchedRate,
      total_time_watched: totalTimeWatched,
      average_time_watched: averageTimeWatched,
      impression_sources: impressionSources,
      raw_data: detail || bp,
      updated_at: new Date().toISOString(),
    });
  }

  // Upsert metrics
  if (metricRows.length > 0) {
    const { error } = await supabase
      .from('post_metrics_daily')
      .upsert(metricRows, { onConflict: 'post_id,date' });
      
    if (error) {
      console.error('Error upserting metrics:', error);
    } else {
      console.log(`Upserted ${metricRows.length} metrics for brand ${brandId}`);
    }
  }

  console.log(`Completed content sync for brand ${brandId}`);
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
    const forceFull = Boolean(body.force_full)

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

      // Read schedule to decide whether to include posts/metrics on auto runs
      const { data: schedule } = await supabase
        .from('metricool_sync_schedule')
        .select('*')
        .single()
      const includePosts = schedule?.include_posts !== false

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

        // Sync content if enabled and platforms are connected
        if (includePosts && connectedPlatforms.length > 0) {
          try {
            await syncBrandContent(supabase, parseInt(userId), accessToken, brand.id, connectedPlatforms, { forceFull })
          } catch (contentError) {
            console.error(`Error syncing content for brand ${brand.id}:`, contentError)
          }
        }
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

      console.log('Metricool sync completed successfully', { created, updated, markedDeleted })

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Sync completed successfully',
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