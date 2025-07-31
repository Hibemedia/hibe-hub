import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0'

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
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { userId } = await req.json()
    
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`Starting deletion process for user: ${userId}`)

    // First, try to delete from public.users table (if exists)
    const { error: publicDeleteError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userId)

    if (publicDeleteError) {
      console.log(`Note: Could not delete from public.users (user may not exist there): ${publicDeleteError.message}`)
    } else {
      console.log(`Successfully deleted user from public.users: ${userId}`)
    }

    // Then delete from auth.users using admin API
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (authDeleteError) {
      console.error(`Failed to delete user from auth.users: ${authDeleteError.message}`)
      return new Response(
        JSON.stringify({ 
          error: `Failed to delete user from auth: ${authDeleteError.message}`,
          partial_success: !publicDeleteError 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`Successfully deleted user from auth.users: ${userId}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'User deleted successfully from all systems',
        userId 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in delete-user function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})