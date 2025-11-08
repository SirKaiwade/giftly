import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = await import('https://esm.sh/stripe@14.21.0?target=deno');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  try {
    // Initialize Stripe
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set');
    }
    const stripeClient = new stripe.Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
      httpClient: stripe.Stripe.createFetchHttpClient(),
    });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Get the user from the token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Invalid authentication');
    }

    // Get user profile to check if they already have a Stripe account
    const { data: profile, error: profileError } = await supabaseClient
      .from('user_profiles')
      .select('stripe_account_id, stripe_account_status')
      .eq('user_id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      throw new Error('Failed to fetch user profile');
    }

    // If user already has a connected account, create a new onboarding link
    if (profile?.stripe_account_id) {
      const account = await stripeClient.accounts.retrieve(profile.stripe_account_id);
      
      // Check if account needs more information
      if (account.details_submitted) {
        // Account is fully onboarded, return account link for dashboard
        const accountLink = await stripeClient.accountLinks.create({
          account: profile.stripe_account_id,
          refresh_url: `${req.headers.get('origin') || ''}/profile?stripe_refresh=true`,
          return_url: `${req.headers.get('origin') || ''}/profile?stripe_return=true`,
          type: 'account_onboarding',
        });

        return new Response(
          JSON.stringify({
            accountId: profile.stripe_account_id,
            url: accountLink.url,
            status: account.charges_enabled ? 'active' : 'pending',
          }),
          {
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
            status: 200,
          }
        );
      }

      // Create onboarding link for existing account
      const accountLink = await stripeClient.accountLinks.create({
        account: profile.stripe_account_id,
        refresh_url: `${req.headers.get('origin') || ''}/profile?stripe_refresh=true`,
        return_url: `${req.headers.get('origin') || ''}/profile?stripe_return=true`,
        type: 'account_onboarding',
      });

      return new Response(
        JSON.stringify({
          accountId: profile.stripe_account_id,
          url: accountLink.url,
          status: 'pending',
        }),
        {
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          status: 200,
        }
      );
    }

    // Create a new Stripe Connect account
    const account = await stripeClient.accounts.create({
      type: 'express',
      country: 'US', // Default, can be updated during onboarding
      email: user.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      settings: {
        payouts: {
          schedule: {
            interval: 'manual', // Can be changed to automatic later
          },
        },
      },
    });

    // Create onboarding link
    const accountLink = await stripeClient.accountLinks.create({
      account: account.id,
      refresh_url: `${req.headers.get('origin') || ''}/profile?stripe_refresh=true`,
      return_url: `${req.headers.get('origin') || ''}/profile?stripe_return=true`,
      type: 'account_onboarding',
    });

    // Save account ID to user profile
    if (profile) {
      await supabaseClient
        .from('user_profiles')
        .update({
          stripe_account_id: account.id,
          stripe_account_status: 'pending',
          stripe_onboarding_complete: false,
        })
        .eq('user_id', user.id);
    } else {
      await supabaseClient
        .from('user_profiles')
        .insert({
          user_id: user.id,
          stripe_account_id: account.id,
          stripe_account_status: 'pending',
          stripe_onboarding_complete: false,
        });
    }

    return new Response(
      JSON.stringify({
        accountId: account.id,
        url: accountLink.url,
        status: 'pending',
      }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Error creating Stripe Connect account:', error);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);
    
    // Return more detailed error information
    const errorMessage = error.message || 'Failed to create Stripe Connect account';
    const errorDetails = {
      error: errorMessage,
      type: error.name || 'UnknownError',
      details: process.env.DENO_ENV === 'development' ? error.stack : undefined,
    };
    
    return new Response(
      JSON.stringify(errorDetails),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        status: 400,
      }
    );
  }
});

