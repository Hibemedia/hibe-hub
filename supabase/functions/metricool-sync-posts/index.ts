import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

// Fetch platform-specific details for Facebook
async function fetchFacebookDetails(userId: number, brandId: number, token: string, start: string, end: string) {
  const url = `https://api.metricool.com/v2/analytics/reels/facebook?from=${start}T00:00:00&to=${end}T23:59:59&timezone=Europe/Amsterdam&blogId=${brandId}&userId=${userId}`;
  
  try {
    const response = await fetchWithRetry(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, data: data.data || [] };
    }
    return { success: false, data: [] };
  } catch (error) {
    console.log(`Facebook details error for brand ${brandId}:`, error.message);
    return { success: false, data: [] };
  }
}

// Fetch platform-specific details for Instagram
async function fetchInstagramDetails(userId: number, brandId: number, token: string, start: string, end: string) {
  const url = `https://api.metricool.com/v2/analytics/reels/instagram?from=${start}T00:00:00&to=${end}T23:59:59&timezone=Europe/Amsterdam&userId=${userId}&blogId=${brandId}`;
  
  try {
    const response = await fetchWithRetry(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, data: data.data || [] };
    }
    return { success: false, data: [] };
  } catch (error) {
    console.log(`Instagram details error for brand ${brandId}:`, error.message);
    return { success: false, data: [] };
  }
}

// Fetch platform-specific details for TikTok
async function fetchTiktokDetails(userId: number, brandId: number, token: string, start: string, end: string) {
  const url = `https://api.metricool.com/v2/analytics/posts/tiktok?from=${start}T00:00:00&to=${end}T23:59:59&timezone=Europe/Amsterdam&blogId=${brandId}&userId=${userId}`;
  
  try {
    const response = await fetchWithRetry(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, data: data.data || [] };
    }
    return { success: false, data: [] };
  } catch (error) {
    console.log(`TikTok details error for brand ${brandId}:`, error.message);
    return { success: false, data: [] };
  }
}

// Fetch platform-specific details for LinkedIn
async function fetchLinkedinDetails(userId: number, brandId: number, token: string, start: string, end: string) {
  const url = `https://api.metricool.com/v2/analytics/posts/linkedin?from=${start}T00:00:00&to=${end}T23:59:59&timezone=Europe/Amsterdam&blogId=${brandId}&userId=${userId}`;
  
  try {
    const response = await fetchWithRetry(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, data: data.data || [] };
    }
    return { success: false, data: [] };
  } catch (error) {
    console.log(`LinkedIn details error for brand ${brandId}:`, error.message);
    return { success: false, data: [] };
  }
}

// Sync posts for a specific brand
async function syncBrandPosts(supabase: any, brandId: number, userId: number, accessToken: string) {
  console.log(`Starting posts sync for brand ${brandId}`);
  
  // Last 30 days
  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setUTCDate(endDate.getUTCDate() - 30);
  
  const start = yyyymmdd(startDate);
  const end = yyyymmdd(endDate);
  
  console.log(`Sync date range: ${start} to ${end}`);
  
  // Fetch base posts
  const basePostsResult = await fetchBasePosts(userId, brandId, accessToken, start, end);
  
  if (!basePostsResult.success || basePostsResult.data.length === 0) {
    console.log(`No base posts found for brand ${brandId}`);
    return { processed: 0, errors: [] };
  }
  
  console.log(`Found ${basePostsResult.data.length} base posts for brand ${brandId}`);
  
  // Fetch platform-specific details
  const [facebookDetails, instagramDetails, tiktokDetails, linkedinDetails] = await Promise.all([
    fetchFacebookDetails(userId, brandId, accessToken, start, end),
    fetchInstagramDetails(userId, brandId, accessToken, start, end),
    fetchTiktokDetails(userId, brandId, accessToken, start, end),
    fetchLinkedinDetails(userId, brandId, accessToken, start, end)
  ]);
  
  // Create lookup maps for platform details
  const facebookMap = new Map();
  const instagramMap = new Map();
  const tiktokMap = new Map();
  const linkedinMap = new Map();
  
  facebookDetails.data.forEach((post: any) => {
    facebookMap.set(post.reelId, post);
  });
  
  instagramDetails.data.forEach((post: any) => {
    instagramMap.set(post.businessId, post);
  });
  
  tiktokDetails.data.forEach((post: any) => {
    tiktokMap.set(post.videoId, post);
  });
  
  linkedinDetails.data.forEach((post: any) => {
    linkedinMap.set(post.postId, post);
  });
  
  let processed = 0;
  const errors = [];
  
  // Process each base post
  for (const basePost of basePostsResult.data) {
    try {
      // Get platform-specific details
      let platformDetails = null;
      
      switch (basePost.network) {
        case 'facebook':
          platformDetails = facebookMap.get(basePost.id);
          break;
        case 'instagram':
          platformDetails = instagramMap.get(basePost.id);
          break;
        case 'tiktok':
          platformDetails = tiktokMap.get(basePost.id);
          break;
        case 'linkedin':
          platformDetails = linkedinMap.get(basePost.id);
          break;
      }
      
      // Prepare post data
      const postData = {
        metricool_id: basePost.id,
        metricool_brand_id: brandId,
        platform: basePost.network,
        content: basePost.text,
        link: basePost.link,
        picture: basePost.picture,
        published_at: basePost.publicationDate.dateTime + 'Z',
        timezone: basePost.publicationDate.timezone,
        
        // Base metrics
        interactions: basePost.metrics?.INTERACTIONS || 0,
        impressions: basePost.metrics?.IMPRESSIONS || 0,
        engagement_rate: basePost.metrics?.ENGAGEMENT || 0,
        
        // Platform-specific data
        platform_data: platformDetails || null
      };
      
      // Upsert post
      const { error } = await supabase
        .from('posts')
        .upsert(postData, { 
          onConflict: 'metricool_id,metricool_brand_id' 
        });
      
      if (error) {
        console.error(`Error upserting post ${basePost.id}:`, error);
        errors.push(`Post ${basePost.id}: ${error.message}`);
      } else {
        processed++;
      }
      
    } catch (error) {
      console.error(`Error processing post ${basePost.id}:`, error);
      errors.push(`Post ${basePost.id}: ${error.message}`);
    }
  }
  
  console.log(`Posts sync completed for brand ${brandId}: ${processed} processed, ${errors.length} errors`);
  
  return { processed, errors };
}

serve(async (req) => {
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

    // Parse request body
    const body = await req.json().catch(() => ({}));
    const { brandId } = body;

    let results = [];
    let totalProcessed = 0;
    let totalErrors = [];

    if (brandId) {
      // Sync specific brand
      console.log(`Syncing posts for specific brand: ${brandId}`);
      const result = await syncBrandPosts(supabase, brandId, userId, accessToken);
      results.push({
        brandId,
        processed: result.processed,
        errors: result.errors
      });
      totalProcessed += result.processed;
      totalErrors.push(...result.errors);
    } else {
      // Sync all brands with connected platforms
      console.log('Syncing posts for all brands');
      
      const { data: brands } = await supabase
        .from('metricool_brands')
        .select('id, label')
        .is('deleted_at', null);

      if (!brands || brands.length === 0) {
        return new Response(
          JSON.stringify({ error: 'No brands found' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Process each brand
      for (const brand of brands) {
        const result = await syncBrandPosts(supabase, brand.id, userId, accessToken);
        results.push({
          brandId: brand.id,
          brandLabel: brand.label,
          processed: result.processed,
          errors: result.errors
        });
        totalProcessed += result.processed;
        totalErrors.push(...result.errors);
      }
    }

    // Log sync summary
    await supabase
      .from('metricool_content_sync_logs')
      .insert({
        brand_id: brandId || null,
        platform: 'all',
        posts_fetched: totalProcessed,
        errors: totalErrors.length > 0 ? totalErrors : null,
        raw_response: { summary: results }
      });

    return new Response(
      JSON.stringify({
        success: true,
        totalProcessed,
        totalErrors: totalErrors.length,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in posts sync function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});