
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Auto-sync function started');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if there's a sync schedule configured
    const { data: schedule, error: scheduleError } = await supabase
      .from('metricool_sync_schedule')
      .select('*')
      .single();

    if (scheduleError) {
      console.error('Error fetching sync schedule:', scheduleError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch sync schedule' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Check if auto-sync is enabled
    if (!schedule.enabled) {
      console.log('Auto-sync is disabled');
      return new Response(
        JSON.stringify({ message: 'Auto-sync is disabled' }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Check if it's time to run a sync
    const now = new Date();
    const nextRunAt = schedule.next_run_at ? new Date(schedule.next_run_at) : null;

    if (nextRunAt && now < nextRunAt) {
      console.log(`Next sync scheduled for ${nextRunAt.toISOString()}, current time: ${now.toISOString()}`);
      return new Response(
        JSON.stringify({ 
          message: 'Not time for sync yet',
          next_run_at: nextRunAt.toISOString()
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Time to run sync, calling metricool-sync-brands function');

    // Call the existing sync function for brands only
    const { data: syncResult, error: syncError } = await supabase.functions.invoke('metricool-sync-brands', {
      body: { source: 'auto' }
    });

    if (syncError) {
      console.error('Error calling sync function:', syncError);
      return new Response(
        JSON.stringify({ error: 'Failed to call sync function', details: syncError }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Update the schedule with new next run time
    const nextRun = new Date(now.getTime() + schedule.interval_hours * 60 * 60 * 1000);
    
    const { error: updateError } = await supabase
      .from('metricool_sync_schedule')
      .update({
        last_run_at: now.toISOString(),
        next_run_at: nextRun.toISOString()
      })
      .eq('id', schedule.id);

    if (updateError) {
      console.error('Error updating schedule:', updateError);
    }

    console.log(`Auto-sync completed successfully. Next run: ${nextRun.toISOString()}`);

    return new Response(
      JSON.stringify({ 
        message: 'Auto-sync completed successfully',
        sync_result: syncResult,
        next_run_at: nextRun.toISOString()
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in auto-sync function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
