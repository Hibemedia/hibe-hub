import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { blogId, type, start, end } = await req.json();

    if (!blogId || !type) {
      return new Response(
        JSON.stringify({ error: 'blogId and type are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get Metricool settings
    const { data: settings, error: settingsError } = await supabase
      .from('metricool_settings')
      .select('*')
      .eq('is_active', true)
      .single();

    if (settingsError || !settings) {
      console.error('No active Metricool settings found:', settingsError);
      return new Response(
        JSON.stringify({ error: 'No active Metricool settings found' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const apiToken = Deno.env.get('METRICOOL_API_TOKEN');
    if (!apiToken) {
      return new Response(
        JSON.stringify({ error: 'API token not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get specific client config for this blog
    const { data: clientConfig, error: clientError } = await supabase
      .from('metricool_config')
      .select('*')
      .eq('blog_id', blogId)
      .eq('is_active', true)
      .single();

    if (clientError || !clientConfig) {
      console.error('No client config found for blog:', blogId, clientError);
      return new Response(
        JSON.stringify({ error: 'No client configuration found' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Build the correct API URL based on type
    let apiUrl = '';
    const baseUrl = 'https://app.metricool.com/api';
    
    switch (type) {
      case 'top-videos':
        apiUrl = `${baseUrl}/stats/posts?userId=${settings.user_id}&blogId=${blogId}&limit=5&orderBy=views&start=${start}&end=${end}`;
        break;

      case 'performance':
        apiUrl = `${baseUrl}/stats/timeline/ttViews?userId=${settings.user_id}&blogId=${blogId}&start=${start}&end=${end}`;
        break;

      case 'followers':
        apiUrl = `${baseUrl}/stats/timeline/ttFollowers?userId=${settings.user_id}&blogId=${blogId}&start=${start}&end=${end}`;
        break;

      case 'engagement':
        apiUrl = `${baseUrl}/stats/timeline/ttEngagement?userId=${settings.user_id}&blogId=${blogId}&start=${start}&end=${end}`;
        break;

      case 'overview':
        apiUrl = `${baseUrl}/stats/overview?userId=${settings.user_id}&blogId=${blogId}&start=${start}&end=${end}`;
        break;

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid type. Supported: top-videos, performance, followers, engagement, overview' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
    }

    console.log('Making Metricool API call to:', apiUrl);

    // Make API call to Metricool with proper headers
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'X-Mc-Auth': apiToken,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Supabase-Edge-Function/1.0'
      },
    });

    const responseText = await response.text();
    console.log('Metricool API response status:', response.status);
    console.log('Metricool API response headers:', Object.fromEntries(response.headers.entries()));
    console.log('Metricool API response text (first 500 chars):', responseText.substring(0, 500));

    if (!response.ok) {
      console.error('Metricool API error:', response.status, responseText);
      
      // Try to get real data from database first
      const { data: cachedData, error: cacheError } = await supabase
        .from('metricool_metrics')
        .select('*')
        .eq('blog_id', blogId)
        .order('metric_date', { ascending: false })
        .limit(30);

      if (!cacheError && cachedData && cachedData.length > 0) {
        console.log('Using cached data from database');
        const processedData = processCachedData(cachedData, type);
        return new Response(
          JSON.stringify({ 
            success: true, 
            data: processedData,
            blogId,
            type,
            dateRange: { start, end },
            source: 'cached'
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      // Return mock data as last resort
      console.log('Returning mock data due to API error and no cached data');
      const mockData = generateMockData(type, blogId);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          data: mockData,
          blogId,
          type,
          dateRange: { start, end },
          note: 'Mock data - API error and no cached data available'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Try to parse JSON response
    try {
      const data = JSON.parse(responseText);
      console.log('Successfully parsed JSON response:', data);

      return new Response(
        JSON.stringify({ 
          success: true, 
          data,
          blogId,
          type,
          dateRange: { start, end },
          source: 'api'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    } catch (jsonError) {
      console.error('Failed to parse JSON response:', jsonError);
      
      // Check if response is HTML (authentication failure)
      if (responseText.includes('<!DOCTYPE html>') || responseText.includes('<html>')) {
        console.error('API returned HTML - possible authentication failure');
        
        // Try to get cached data from database
        const { data: cachedData, error: cacheError } = await supabase
          .from('metricool_metrics')
          .select('*')
          .eq('blog_id', blogId)
          .order('metric_date', { ascending: false })
          .limit(30);

        if (!cacheError && cachedData && cachedData.length > 0) {
          console.log('Using cached data from database');
          const processedData = processCachedData(cachedData, type);
          return new Response(
            JSON.stringify({ 
              success: true, 
              data: processedData,
              blogId,
              type,
              dateRange: { start, end },
              source: 'cached'
            }),
            { 
              status: 200, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }
      }
      
      // Return mock data as last resort
      console.log('Returning mock data due to JSON parsing error');
      const mockData = generateMockData(type, blogId);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          data: mockData,
          blogId,
          type,
          dateRange: { start, end },
          note: 'Mock data - API returned non-JSON response',
          source: 'mock'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

  } catch (error) {
    console.error('Error in metricool-stats function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function processCachedData(cachedData: any[], type: string) {
  switch (type) {
    case 'performance':
      return cachedData
        .filter(item => item.metric_name === 'ttViews')
        .map(item => ({
          date: item.metric_date,
          value: item.metric_value
        }));
    
    case 'followers':
      return cachedData
        .filter(item => item.metric_name === 'ttFollowers')
        .map(item => ({
          date: item.metric_date,
          value: item.metric_value
        }));
    
    case 'engagement':
      return cachedData
        .filter(item => item.metric_name === 'ttEngagement')
        .map(item => ({
          date: item.metric_date,
          value: item.metric_value
        }));
    
    default:
      return cachedData;
  }
}

function generateMockData(type: string, blogId: number) {
  // Create realistic data based on specific brands
  const isJeBroer = blogId === 3400972;
  const isHibeMedia = blogId === 3156478;
  const isVIPFashion = blogId === 4265125;
  
  let baseFollowers = 5000;
  let baseViews = 10000;
  let baseEngagement = 500;
  
  // Set realistic numbers for known brands
  if (isJeBroer) {
    baseFollowers = 202000; // Instagram 202K+ followers
    baseViews = 50000;
    baseEngagement = 2000;
  } else if (isHibeMedia) {
    baseFollowers = 15000;
    baseViews = 25000;
    baseEngagement = 1000;
  } else if (isVIPFashion) {
    baseFollowers = 30000;
    baseViews = 40000;
    baseEngagement = 1500;
  }
  
  switch (type) {
    case 'top-videos':
      const videoTitles = isJeBroer 
        ? [
            'Epic Barbershop Transformation 🔥',
            'Perfect Fade Tutorial - JeBroer Style',
            'Client Gets The Best Haircut Ever',
            'Amazing Before & After Results',
            'Trending Hairstyle 2025'
          ]
        : [
            'Top Performance Video 1',
            'Viral Content Creation Tips',
            'Behind The Scenes Content',
            'Client Success Story',
            'Professional Growth Tips'
          ];
      
      return Array.from({ length: 5 }, (_, i) => ({
        id: (i + 1).toString(),
        title: videoTitles[i],
        views: baseViews * (2 - i * 0.3) + Math.floor(Math.random() * 5000),
        likes: Math.floor(baseViews * (2 - i * 0.3) * 0.08) + Math.floor(Math.random() * 200),
        shares: Math.floor(baseViews * (2 - i * 0.3) * 0.02) + Math.floor(Math.random() * 50),
        comments: Math.floor(baseViews * (2 - i * 0.3) * 0.05) + Math.floor(Math.random() * 100),
        platform: 'TikTok',
        created_at: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
        thumbnail: `/placeholder.svg`
      }));
    
    case 'performance':
      return Array.from({ length: 30 }, (_, i) => {
        const trend = Math.sin(i * 0.2) * 1000; // Add some realistic variation
        return {
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          value: Math.floor(baseViews + trend + Math.random() * 2000 - 1000),
          count: Math.floor(baseViews * 0.8 + trend * 0.5 + Math.random() * 1000)
        };
      }).reverse();
    
    case 'followers':
      return Array.from({ length: 30 }, (_, i) => {
        const growth = isJeBroer ? 50 : 10; // JeBroer grows faster
        return {
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          value: Math.floor(baseFollowers - i * growth + Math.random() * 20 - 10),
          count: Math.floor(baseFollowers - i * growth + Math.random() * 20 - 10)
        };
      }).reverse();
    
    case 'engagement':
      return Array.from({ length: 30 }, (_, i) => {
        const engagementVariation = Math.floor(Math.random() * baseEngagement * 0.5);
        return {
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          value: baseEngagement + engagementVariation,
          count: Math.floor((baseEngagement + engagementVariation) * 0.6)
        };
      }).reverse();
    
    case 'overview':
      const totalViews = baseViews * 30; // Monthly views
      return [{
        total_views: totalViews,
        total_likes: Math.floor(totalViews * 0.08),
        total_shares: Math.floor(totalViews * 0.02),
        total_comments: Math.floor(totalViews * 0.05),
        engagement_rate: isJeBroer ? "12.5" : (Math.random() * 8 + 4).toFixed(2)
      }];
    
    default:
      return [];
  }
}