import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // Get "my Goodbye" brand (ID: 4305860)
    const brandId = 4305860;

    // Last 30 days date range
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setUTCDate(endDate.getUTCDate() - 30);
    
    const formatDate = (d: Date): string => {
      return d.toISOString().split('T')[0];
    };
    
    const fromDate = `${formatDate(startDate)}T00:00:00`;
    const toDate = `${formatDate(endDate)}T23:59:59`;

    console.log(`Debug: Testing with brand ${brandId}, date range: ${fromDate} to ${toDate}`);

    // Test all the API endpoints
    const tests = [
      {
        name: 'Base Posts (brand-summary/posts)',
        url: `https://app.metricool.com/api/v2/analytics/brand-summary/posts?from=${fromDate}&to=${toDate}&timezone=Europe/Amsterdam&userId=${userId}&blogId=${brandId}`,
        description: 'Main endpoint to get basic post information'
      },
      {
        name: 'Facebook Reels Details',
        url: `https://app.metricool.com/api/v2/analytics/reels/facebook?from=${fromDate}&to=${toDate}&timezone=Europe/Amsterdam&blogId=${brandId}&userId=${userId}`,
        description: 'Additional Facebook reel metrics'
      },
      {
        name: 'Instagram Reels Details',
        url: `https://app.metricool.com/api/v2/analytics/reels/instagram?from=${fromDate}&to=${toDate}&timezone=Europe/Amsterdam&userId=${userId}&blogId=${brandId}`,
        description: 'Additional Instagram reel metrics'
      },
      {
        name: 'TikTok Posts Details',
        url: `https://app.metricool.com/api/v2/analytics/posts/tiktok?from=${fromDate}&to=${toDate}&timezone=Europe/Amsterdam&blogId=${brandId}&userId=${userId}`,
        description: 'Additional TikTok post metrics'
      },
      {
        name: 'LinkedIn Posts Details',
        url: `https://app.metricool.com/api/v2/analytics/posts/linkedin?from=${fromDate}&to=${toDate}&timezone=Europe/Amsterdam&blogId=${brandId}&userId=${userId}`,
        description: 'Additional LinkedIn post metrics'
      }
    ];

    const results = [];

    for (const test of tests) {
      try {
        console.log(`Testing ${test.name}: ${test.url}`);
        
        const response = await fetch(test.url, {
          headers: {
            'X-Mc-Auth': accessToken,
            'Accept': 'application/json',
          },
        });

        const responseText = await response.text();
        let responseData;
        
        try {
          responseData = JSON.parse(responseText);
        } catch {
          responseData = { 
            error: 'Failed to parse JSON',
            raw: responseText.substring(0, 1000) 
          };
        }

        // Process data to show what we would save
        let processedData = null;
        if (response.ok && responseData.data && Array.isArray(responseData.data)) {
          processedData = responseData.data.map((item: any) => {
            // Show what fields we would extract based on the endpoint
            switch (test.name) {
              case 'Base Posts (brand-summary/posts)':
                return {
                  id: item.id,
                  network: item.network,
                  text: item.text?.substring(0, 100) + '...',
                  link: item.link,
                  publicationDate: item.publicationDate,
                  metrics: item.metrics,
                  wouldSaveAs: {
                    metricool_id: item.id,
                    metricool_brand_id: brandId,
                    platform: item.network,
                    content: item.text,
                    link: item.link,
                    picture: item.picture,
                    published_at: item.publicationDate?.dateTime,
                    timezone: item.publicationDate?.timezone,
                    interactions: item.metrics?.INTERACTIONS || 0,
                    impressions: item.metrics?.IMPRESSIONS || 0,
                    engagement_rate: item.metrics?.ENGAGEMENT || 0
                  }
                };
              
              case 'Facebook Reels Details':
                return {
                  reelId: item.reelId,
                  length: item.length,
                  blueReelsPlayCount: item.blueReelsPlayCount,
                  postVideoAvgTimeWatchedSeconds: item.postVideoAvgTimeWatchedSeconds,
                  postVideoViewTimeSeconds: item.postVideoViewTimeSeconds,
                  postVideoReactions: item.postVideoReactions,
                  postVideoSocialActions: item.postVideoSocialActions,
                  engagement: item.engagement,
                  wouldMergeWith: 'Facebook posts using reelId'
                };
                
              case 'Instagram Reels Details':
                return {
                  businessId: item.businessId,
                  likes: item.likes,
                  comments: item.comments,
                  interactions: item.interactions,
                  engagement: item.engagement,
                  views: item.views,
                  reach: item.reach,
                  saved: item.saved,
                  shares: item.shares,
                  wouldMergeWith: 'Instagram posts using businessId'
                };
                
              case 'TikTok Posts Details':
                return {
                  videoId: item.videoId,
                  duration: item.duration,
                  likeCount: item.likeCount,
                  commentCount: item.commentCount,
                  shareCount: item.shareCount,
                  viewCount: item.viewCount,
                  engagement: item.engagement,
                  reach: item.reach,
                  fullVideoWatchedRate: item.fullVideoWatchedRate,
                  totalTimeWatched: item.totalTimeWatched,
                  averageTimeWatched: item.averageTimeWatched,
                  impressionSources: item.impressionSources,
                  wouldMergeWith: 'TikTok posts using videoId'
                };
                
              case 'LinkedIn Posts Details':
                return {
                  postId: item.postId,
                  clicks: item.clicks,
                  comments: item.comments,
                  likes: item.likes,
                  shares: item.shares,
                  impressions: item.impressions,
                  engagement: item.engagement,
                  wouldMergeWith: 'LinkedIn posts using postId'
                };
                
              default:
                return item;
            }
          });
        }

        results.push({
          test: test.name,
          description: test.description,
          url: test.url,
          status: response.status,
          ok: response.ok,
          dataCount: responseData.data?.length || 0,
          sampleData: responseData.data || null, // Full data instead of slice
          processedSample: processedData?.slice(0, 2) || null,
          headers: Object.fromEntries(response.headers.entries()),
          error: response.ok ? null : responseText,
          fullRawResponse: responseData // Add complete response for debugging
        });

      } catch (error) {
        results.push({
          test: test.name,
          description: test.description,
          url: test.url,
          error: error.message,
          status: 'NETWORK_ERROR'
        });
      }
    }

    // Create comprehensive merge example with actual database insertion data
    const basePostsResult = results.find(r => r.test.includes('Base Posts') && r.ok);
    const instagramResult = results.find(r => r.test.includes('Instagram') && r.ok);
    const facebookResult = results.find(r => r.test.includes('Facebook') && r.ok);
    const tiktokResult = results.find(r => r.test.includes('TikTok') && r.ok);
    const linkedinResult = results.find(r => r.test.includes('LinkedIn') && r.ok);
    
    let mergeExample = null;
    
    if (basePostsResult?.sampleData && Array.isArray(basePostsResult.sampleData) && basePostsResult.sampleData.length > 0) {
      const samplePost = basePostsResult.sampleData[0];
      
      // Find matching platform-specific data based on post platform
      let platformSpecificData = null;
      if (samplePost.network === 'instagram' && instagramResult?.sampleData && Array.isArray(instagramResult.sampleData)) {
        platformSpecificData = instagramResult.sampleData.find(item => 
          item.businessId === samplePost.businessId || item.postId === samplePost.id
        );
      } else if (samplePost.network === 'facebook' && facebookResult?.sampleData && Array.isArray(facebookResult.sampleData)) {
        platformSpecificData = facebookResult.sampleData.find(item => 
          item.reelId === samplePost.reelId || item.postId === samplePost.id
        );
      } else if (samplePost.network === 'tiktok' && tiktokResult?.sampleData && Array.isArray(tiktokResult.sampleData)) {
        platformSpecificData = tiktokResult.sampleData.find(item => 
          item.videoId === samplePost.videoId || item.postId === samplePost.id
        );
      } else if (samplePost.network === 'linkedin' && linkedinResult?.sampleData && Array.isArray(linkedinResult.sampleData)) {
        platformSpecificData = linkedinResult.sampleData.find(item => 
          item.postId === samplePost.id
        );
      }
      
      mergeExample = {
        strategy: "Exacte data die in database tabellen wordt opgeslagen",
        
        // Data voor de "posts" tabel
        posts_table_insert: {
          id: "UUID (wordt automatisch gegenereerd)",
          brand_id: brandId,
          platform: samplePost.network,
          post_id: samplePost.id?.toString(),
          content: samplePost.text || null,
          url: samplePost.link || null,
          media_url: samplePost.picture || null,
          posted_at: samplePost.publicationDate?.dateTime || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        
        // Data voor de "post_metrics_daily" tabel
        post_metrics_daily_insert: {
          id: "UUID (wordt automatisch gegenereerd)",
          post_id: "posts.id (foreign key naar posts tabel)",
          date: samplePost.publicationDate?.dateTime ? samplePost.publicationDate.dateTime.split('T')[0] : new Date().toISOString().split('T')[0],
          
          // Basis metrics van posts endpoint
          likes: samplePost.metrics?.INTERACTIONS || 0,
          comments: samplePost.metrics?.COMMENTS || 0,  
          shares: samplePost.metrics?.SHARES || 0,
          impressions: samplePost.metrics?.IMPRESSIONS || 0,
          engagement: samplePost.metrics?.ENGAGEMENT || 0,
          
          // Platform-specifieke metrics (indien beschikbaar)
          views: platformSpecificData?.views || platformSpecificData?.viewCount || 0,
          reach: platformSpecificData?.reach || 0,
          saves: platformSpecificData?.saved || 0,
          clicks: platformSpecificData?.clicks || 0,
          duration: platformSpecificData?.duration || platformSpecificData?.length || null,
          full_video_watched_rate: platformSpecificData?.fullVideoWatchedRate || null,
          total_time_watched: platformSpecificData?.totalTimeWatched || platformSpecificData?.postVideoViewTimeSeconds || null,
          average_time_watched: platformSpecificData?.averageTimeWatched || platformSpecificData?.postVideoAvgTimeWatchedSeconds || null,
          impression_sources: platformSpecificData?.impressionSources || null,
          
          // Volledige raw data voor debugging
          raw_data: {
            basePost: samplePost,
            platformSpecific: platformSpecificData,
            source: `${samplePost.network}_${new Date().toISOString().split('T')[0]}`
          },
          
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        
        // Originele API data ter referentie
        source_api_data: {
          base_posts_endpoint: {
            url: basePostsResult.url,
            sample_post: samplePost
          },
          platform_specific_endpoint: platformSpecificData ? {
            url: samplePost.network === 'instagram' ? instagramResult?.url :
                 samplePost.network === 'facebook' ? facebookResult?.url :
                 samplePost.network === 'tiktok' ? tiktokResult?.url :
                 samplePost.network === 'linkedin' ? linkedinResult?.url : null,
            sample_data: platformSpecificData
          } : null
        },
        
        // Workflow voor database sync
        sync_process: {
          step_1: "Haal alle posts op via brand-summary/posts endpoint",
          step_2: "Voor elke post: bepaal platform en zoek bijbehorende platform-specifieke data",
          step_3: "Insert/update record in 'posts' tabel met basis post informatie",
          step_4: "Insert record in 'post_metrics_daily' tabel met alle metrics",
          step_5: "Bewaar volledige raw API responses in raw_data veld voor debugging",
          note: "Posts worden geïdentificeerd door combinatie van Metricool post_id + platform"
        }
      };
    } else {
      mergeExample = {
        error: "Geen geldige post data beschikbaar voor merge voorbeeld",
        debug_info: {
          basePostsResult_exists: !!basePostsResult,
          basePostsResult_ok: basePostsResult?.ok,
          basePostsResult_dataCount: basePostsResult?.dataCount,
          sampleData_exists: !!basePostsResult?.sampleData,
          sampleData_isArray: Array.isArray(basePostsResult?.sampleData),
          sampleData_length: basePostsResult?.sampleData?.length || 0
        }
      };
    }

    return new Response(
      JSON.stringify({
        success: true,
        brandId,
        dateRange: { from: fromDate, to: toDate },
        userId,
        tests: results,
        mergeExample,
        summary: {
          totalTests: results.length,
          successfulTests: results.filter(r => r.ok).length,
          failedTests: results.filter(r => !r.ok).length,
          totalPostsFound: basePostsResult?.dataCount || 0,
          platformBreakdown: {
            facebook: results.find(r => r.test.includes('Facebook'))?.dataCount || 0,
            instagram: results.find(r => r.test.includes('Instagram'))?.dataCount || 0,
            tiktok: results.find(r => r.test.includes('TikTok'))?.dataCount || 0,
            linkedin: results.find(r => r.test.includes('LinkedIn'))?.dataCount || 0
          }
        }
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error in debug function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});