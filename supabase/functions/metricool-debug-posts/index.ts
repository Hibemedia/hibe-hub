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

    // Create comprehensive merge example
    const basePostsResult = results.find(r => r.test.includes('Base Posts'));
    const instagramResult = results.find(r => r.test.includes('Instagram'));
    const tiktokResult = results.find(r => r.test.includes('TikTok'));
    const linkedinResult = results.find(r => r.test.includes('LinkedIn'));
    
    const mergeExample = basePostsResult?.sampleData?.[0] ? {
      strategy: "Data merge strategie voor database opslag",
      
      sourceData: {
        basePosts: {
          endpoint: "brand-summary/posts",
          beschrijving: "Bevat basis post informatie voor alle platforms",
          voorbeeld: {
            id: basePostsResult.sampleData[0]?.id,
            network: basePostsResult.sampleData[0]?.network,
            text: basePostsResult.sampleData[0]?.text?.substring(0, 100) + "...",
            link: basePostsResult.sampleData[0]?.link,
            publicationDate: basePostsResult.sampleData[0]?.publicationDate,
            basicMetrics: basePostsResult.sampleData[0]?.metrics
          }
        },
        
        platformSpecific: {
          instagram: instagramResult?.sampleData?.[0] ? {
            endpoint: "reels/instagram",
            extraData: {
              businessId: instagramResult.sampleData[0]?.businessId,
              views: instagramResult.sampleData[0]?.views,
              reach: instagramResult.sampleData[0]?.reach,
              saved: instagramResult.sampleData[0]?.saved
            }
          } : "Geen Instagram data gevonden",
          
          tiktok: tiktokResult?.sampleData?.[0] ? {
            endpoint: "posts/tiktok", 
            extraData: {
              videoId: tiktokResult.sampleData[0]?.videoId,
              duration: tiktokResult.sampleData[0]?.duration,
              fullVideoWatchedRate: tiktokResult.sampleData[0]?.fullVideoWatchedRate,
              impressionSources: tiktokResult.sampleData[0]?.impressionSources
            }
          } : "Geen TikTok data gevonden"
        }
      },
      
      databaseStructure: {
        posts_table: {
          beschrijving: "Hoofdtabel met basis post informatie",
          velden: {
            id: "gen_random_uuid()",
            brand_id: brandId,
            platform: basePostsResult.sampleData[0]?.network,
            post_id: basePostsResult.sampleData[0]?.id + " (Metricool ID)",
            content: basePostsResult.sampleData[0]?.text,
            posted_at: basePostsResult.sampleData[0]?.publicationDate?.dateTime,
            url: basePostsResult.sampleData[0]?.link,
            media_url: basePostsResult.sampleData[0]?.picture,
            created_at: "now()",
            updated_at: "now()"
          }
        },
        
        post_metrics_daily_table: {
          beschrijving: "Dagelijkse metrics per post (kan multiple records per post)",
          velden: {
            id: "gen_random_uuid()",
            post_id: "posts.id (foreign key)",
            date: basePostsResult.sampleData[0]?.publicationDate?.dateTime?.split('T')[0],
            likes: basePostsResult.sampleData[0]?.metrics?.INTERACTIONS || 0,
            comments: basePostsResult.sampleData[0]?.metrics?.COMMENTS || 0,
            shares: basePostsResult.sampleData[0]?.metrics?.SHARES || 0,
            views: instagramResult?.sampleData?.[0]?.views || 0,
            impressions: basePostsResult.sampleData[0]?.metrics?.IMPRESSIONS || 0,
            reach: instagramResult?.sampleData?.[0]?.reach || 0,
            saves: instagramResult?.sampleData?.[0]?.saved || 0,
            engagement: basePostsResult.sampleData[0]?.metrics?.ENGAGEMENT || 0,
            raw_data: "Volledige API response voor debugging",
            created_at: "now()",
            updated_at: "now()"
          }
        }
      },
      
      syncWorkflow: {
        stap1: "Haal alle posts op via brand-summary/posts endpoint",
        stap2: "Voor elke post: kijk welk platform het is",
        stap3: "Haal platform-specifieke data op (instagram/tiktok/linkedin endpoints)",
        stap4: "Merge basis post data met platform-specifieke metrics",
        stap5: "Insert/update posts tabel met basis informatie",
        stap6: "Insert dagelijkse metrics in post_metrics_daily tabel",
        stap7: "Bewaar volledige raw data voor debugging",
        notitie: "Posts worden geïdentificeerd door Metricool ID + platform combinatie"
      }
    } : {
      error: "Geen basis post data beschikbaar voor merge voorbeeld"
    };

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
          totalPostsFound: results.reduce((sum, r) => sum + (r.dataCount || 0), 0)
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