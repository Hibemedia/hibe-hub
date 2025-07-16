import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Metric definitions per platform
const METRICS = {
  tiktok: ['ttFollowers', 'ttViews', 'ttReach', 'ttEngagement'],
  instagram: ['igFollowers', 'igReach', 'igImpressions', 'igLikes', 'igEngagement'],
  facebook: ['facebookLikes', 'dailyImpressions', 'dailyClicks'],
  linkedin: ['inFollowers', 'inPosts', 'inCliks', 'inPostsLikes'],
  youtube: ['ytviews', 'ytlikes', 'ytsubscribersGained']
};

const PLATFORM_MAPPING = {
  ttFollowers: 'tiktok',
  ttViews: 'tiktok',
  ttReach: 'tiktok',
  ttEngagement: 'tiktok',
  igFollowers: 'instagram',
  igReach: 'instagram',
  igImpressions: 'instagram',
  igLikes: 'instagram',
  igEngagement: 'instagram',
  facebookLikes: 'facebook',
  dailyImpressions: 'facebook',
  dailyClicks: 'facebook',
  inFollowers: 'linkedin',
  inPosts: 'linkedin',
  inCliks: 'linkedin',
  inPostsLikes: 'linkedin',
  ytviews: 'youtube',
  ytlikes: 'youtube',
  ytsubscribersGained: 'youtube'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const apiToken = Deno.env.get('METRICOOL_API_TOKEN');
    if (!apiToken) {
      console.error('METRICOOL_API_TOKEN not found');
      return new Response(
        JSON.stringify({ error: 'API token not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get all active client configurations
    const { data: configs, error: configError } = await supabase
      .from('metricool_config')
      .select('*')
      .eq('is_active', true);

    if (configError || !configs) {
      console.error('Error fetching configs:', configError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch configurations' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Found ${configs.length} active configurations to sync`);

    // Calculate date range (last 30 days)
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);

    const endDate = end.toISOString().split('T')[0].replace(/-/g, '');
    const startDate = start.toISOString().split('T')[0].replace(/-/g, '');

    const syncResults = [];

    for (const config of configs) {
      console.log(`Syncing data for client ${config.client_id}, blog ${config.blog_id}`);
      
      try {
        // Sync metrics for each platform
        for (const [platform, metrics] of Object.entries(METRICS)) {
          for (const metric of metrics) {
            await syncMetric(config, metric, startDate, endDate, apiToken, supabase);
          }
        }

        // Sync posts data
        await syncPosts(config, startDate, endDate, apiToken, supabase);

        syncResults.push({
          client_id: config.client_id,
          blog_id: config.blog_id,
          status: 'success'
        });

      } catch (error) {
        console.error(`Error syncing config ${config.id}:`, error);
        syncResults.push({
          client_id: config.client_id,
          blog_id: config.blog_id,
          status: 'error',
          error: error.message
        });
      }
    }

    console.log('Sync completed. Results:', syncResults);

    return new Response(
      JSON.stringify({ 
        success: true, 
        synced: syncResults.length,
        results: syncResults
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in metricool-sync function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function syncMetric(config: any, metric: string, startDate: string, endDate: string, apiToken: string, supabase: any) {
  try {
    const url = `https://app.metricool.com/api/stats/timeline/${metric}?start=${startDate}&end=${endDate}&userId=${config.user_id}&blogId=${config.blog_id}`;
    
    const response = await fetch(url, {
      headers: {
        'X-Mc-Auth': apiToken,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch ${metric} for blog ${config.blog_id}:`, response.status);
      return;
    }

    const data = await response.json();
    const platform = PLATFORM_MAPPING[metric] || 'unknown';

    if (Array.isArray(data) && data.length > 0) {
      // Prepare data for upsert
      const metricsToUpsert = data.map(([date, value]) => ({
        client_id: config.client_id,
        blog_id: config.blog_id,
        metric_name: metric,
        metric_date: date,
        metric_value: value || 0,
        platform: platform
      }));

      // Upsert metrics data
      for (const metricData of metricsToUpsert) {
        const { error } = await supabase
          .from('metricool_metrics')
          .upsert(metricData, { 
            onConflict: 'client_id,blog_id,metric_name,metric_date' 
          });

        if (error) {
          console.error(`Error upserting metric ${metric}:`, error);
        }
      }

      console.log(`Successfully synced ${metricsToUpsert.length} data points for ${metric}`);
    }

  } catch (error) {
    console.error(`Error syncing metric ${metric}:`, error);
  }
}

async function syncPosts(config: any, startDate: string, endDate: string, apiToken: string, supabase: any) {
  try {
    // Sync scheduled posts
    const scheduledUrl = `https://app.metricool.com/api/v2/scheduler/posts?userId=${config.user_id}&blogId=${config.blog_id}`;
    
    const scheduledResponse = await fetch(scheduledUrl, {
      headers: {
        'X-Mc-Auth': apiToken,
        'Content-Type': 'application/json',
      },
    });

    if (scheduledResponse.ok) {
      const scheduledData = await scheduledResponse.json();
      await processPostsData(scheduledData, config, supabase, 'scheduled');
    }

    // Sync Instagram reels
    const reelsUrl = `https://app.metricool.com/api/stats/instagram/reels?start=${startDate}&end=${endDate}&userId=${config.user_id}&blogId=${config.blog_id}`;
    
    const reelsResponse = await fetch(reelsUrl, {
      headers: {
        'X-Mc-Auth': apiToken,
        'Content-Type': 'application/json',
      },
    });

    if (reelsResponse.ok) {
      const reelsData = await reelsResponse.json();
      await processPostsData(reelsData, config, supabase, 'published');
    }

    // Sync general posts
    const postsUrl = `https://app.metricool.com/api/stats/posts?start=${startDate}&end=${endDate}&userId=${config.user_id}&blogId=${config.blog_id}`;
    
    const postsResponse = await fetch(postsUrl, {
      headers: {
        'X-Mc-Auth': apiToken,
        'Content-Type': 'application/json',
      },
    });

    if (postsResponse.ok) {
      const postsData = await postsResponse.json();
      await processPostsData(postsData, config, supabase, 'published');
    }

  } catch (error) {
    console.error('Error syncing posts:', error);
  }
}

async function processPostsData(data: any, config: any, supabase: any, type: string) {
  if (!Array.isArray(data) || data.length === 0) return;

  for (const post of data) {
    try {
      const postData = {
        client_id: config.client_id,
        blog_id: config.blog_id,
        post_id: post.id || post.post_id || `${Date.now()}-${Math.random()}`,
        platform: post.platform || 'unknown',
        post_type: post.type || 'post',
        caption: post.caption || post.text || '',
        published_at: post.published_at ? new Date(post.published_at).toISOString() : null,
        scheduled_at: post.scheduled_at ? new Date(post.scheduled_at).toISOString() : null,
        metrics: {
          likes: post.likes || 0,
          views: post.views || 0,
          reach: post.reach || 0,
          engagement: post.engagement || 0,
          comments: post.comments || 0,
          shares: post.shares || 0
        }
      };

      const { error } = await supabase
        .from('metricool_posts')
        .upsert(postData, { 
          onConflict: 'client_id,blog_id,post_id,platform' 
        });

      if (error) {
        console.error('Error upserting post:', error);
      }

    } catch (error) {
      console.error('Error processing post:', error);
    }
  }
}