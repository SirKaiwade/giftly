import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = await import('https://esm.sh/stripe@14.21.0?target=deno');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
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
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

    // Get the authorization header (optional - contributions can be from anonymous users)
    const authHeader = req.headers.get('Authorization');
    // Note: We allow anonymous contributions, so auth header is optional

    // Parse request body
    const {
      item_id,
      registry_id,
      amount,
      contributor_name,
      contributor_email,
      message,
      is_public,
      success_url,
      cancel_url,
    } = await req.json();

    // Validate required fields
    if (!item_id || !registry_id || !amount || !contributor_name) {
      throw new Error('Missing required fields');
    }

    // Validate amount (must be positive and in cents)
    if (amount < 50) {
      // Minimum $0.50
      throw new Error('Amount must be at least $0.50');
    }

    // Get registry and item details for metadata
    const { data: registry, error: registryError } = await supabaseClient
      .from('registries')
      .select('title, slug, user_id')
      .eq('id', registry_id)
      .single();

    if (registryError || !registry) {
      throw new Error('Registry not found');
    }

    // Platform wallet system - no Connect needed
    // All payments go to platform account, balance tracked in registry_balances table

    const { data: item, error: itemError } = await supabaseClient
      .from('registry_items')
      .select('title, item_type')
      .eq('id', item_id)
      .single();

    if (itemError || !item) {
      throw new Error('Item not found');
    }

    // Create a pending contribution record first
    const { data: contribution, error: contributionError } = await supabaseClient
      .from('contributions')
      .insert({
        registry_id,
        item_id,
        contributor_name,
        contributor_email: contributor_email || '',
        amount,
        message: message || '',
        is_public: is_public ?? true,
        payment_status: 'pending',
        stripe_payment_id: '',
      })
      .select()
      .single();

    if (contributionError || !contribution) {
      throw new Error('Failed to create contribution record');
    }

    // Create Stripe Checkout Session - charges go to platform account
    // Balance will be tracked in registry_balances table
    const session = await stripeClient.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: item.title,
              description: `Contribution to ${registry.title}`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: success_url || `${req.headers.get('origin') || ''}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancel_url || `${req.headers.get('origin') || ''}/cancel`,
      customer_email: contributor_email || undefined,
      metadata: {
        contribution_id: contribution.id,
        registry_id,
        item_id,
        registry_slug: registry.slug,
      },
      // Allow promotion codes
      allow_promotion_codes: true,
    });

    // Update contribution with session ID (we'll update with payment_intent later via webhook)
    await supabaseClient
      .from('contributions')
      .update({ stripe_payment_id: session.id })
      .eq('id', contribution.id);

    return new Response(
      JSON.stringify({
        sessionId: session.id,
        url: session.url,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to create checkout session',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});

