import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = await import('https://esm.sh/stripe@14.21.0?target=deno');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Stripe
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set');
    }
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET environment variable is not set');
    }

    const stripeClient = new stripe.Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
      httpClient: stripe.Stripe.createFetchHttpClient(),
    });

    // Initialize Supabase client with service role key for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get the raw body and signature
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      throw new Error('No stripe-signature header');
    }

    const body = await req.text();

    // Verify webhook signature
    let event;
    try {
      event = stripeClient.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return new Response(
        JSON.stringify({ error: 'Webhook signature verification failed' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        
        // Get contribution details
        const { data: contribution, error: contribError } = await supabaseClient
          .from('contributions')
          .select('id, amount, registry_id, contributor_email, contributor_name')
          .eq('stripe_payment_id', session.id)
          .single();

        if (contribError || !contribution) {
          console.error('Contribution not found:', contribError);
          break;
        }

        // Update contribution status to paid
        const { error: updateError } = await supabaseClient
          .from('contributions')
          .update({
            payment_status: 'paid',
            stripe_payment_id: session.payment_intent || session.id,
          })
          .eq('id', contribution.id);

        if (updateError) {
          console.error('Error updating contribution:', updateError);
          throw updateError;
        }

        // Platform wallet: Ensure registry_balances record exists and increment
        // The trigger will handle the increment, but we ensure the record exists first
        const { data: existingBalance } = await supabaseClient
          .from('registry_balances')
          .select('id')
          .eq('registry_id', contribution.registry_id)
          .single();

        if (!existingBalance) {
          // Create initial balance record (trigger will increment it)
          await supabaseClient
            .from('registry_balances')
            .insert({
              registry_id: contribution.registry_id,
              balance_cents: 0,
              total_contributed_cents: 0,
            });
        }
        // Balance increment happens via database trigger when payment_status changes to 'paid'

        // Update the item's current_amount
        if (session.metadata?.item_id) {
          const { data: item } = await supabaseClient
            .from('registry_items')
            .select('current_amount, price_amount')
            .eq('id', session.metadata.item_id)
            .single();

          if (item) {
            const newAmount = (item.current_amount || 0) + contribution.amount;
            const isFulfilled = newAmount >= item.price_amount;

            await supabaseClient
              .from('registry_items')
              .update({
                current_amount: newAmount,
                is_fulfilled: isFulfilled,
              })
              .eq('id', session.metadata.item_id);
          }
        }

        // Fraud rules: Flag high amounts (> $1,000) for manual review
        const HIGH_AMOUNT_THRESHOLD = 100000; // $1,000 in cents
        if (contribution.amount >= HIGH_AMOUNT_THRESHOLD) {
          await supabaseClient
            .from('flagged_transactions')
            .insert({
              contribution_id: contribution.id,
              flag_reason: 'high_amount',
              flag_details: {
                amount: contribution.amount,
                threshold: HIGH_AMOUNT_THRESHOLD,
              },
              status: 'pending',
            });
          
          console.log('High amount contribution flagged:', contribution.id, contribution.amount);
        }

        // Fraud rules: Check for suspicious patterns (multiple contributions from same email in short time)
        // This is a simple check - can be enhanced
        const { data: recentContributions } = await supabaseClient
          .from('contributions')
          .select('id, created_at')
          .eq('contributor_email', contribution.contributor_email)
          .eq('payment_status', 'paid')
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
          .limit(10);

        if (recentContributions && recentContributions.length >= 5) {
          await supabaseClient
            .from('flagged_transactions')
            .insert({
              contribution_id: contribution.id,
              flag_reason: 'suspicious_pattern',
              flag_details: {
                pattern: 'multiple_contributions_24h',
                count: recentContributions.length,
              },
              status: 'pending',
            });
          
          console.log('Suspicious pattern flagged:', contribution.id);
        }

        console.log('Payment succeeded:', session.id);
        break;
      }

      case 'checkout.session.async_payment_succeeded': {
        const session = event.data.object as any;
        
        await supabaseClient
          .from('contributions')
          .update({
            payment_status: 'paid',
            stripe_payment_id: session.payment_intent || session.id,
          })
          .eq('stripe_payment_id', session.id);

        console.log('Async payment succeeded:', session.id);
        break;
      }

      case 'checkout.session.async_payment_failed': {
        const session = event.data.object as any;
        
        await supabaseClient
          .from('contributions')
          .update({
            payment_status: 'pending',
          })
          .eq('stripe_payment_id', session.id);

        console.log('Async payment failed:', session.id);
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as any;
        
        // Find contribution by payment intent
        const { data: contribution } = await supabaseClient
          .from('contributions')
          .select('id, amount, item_id')
          .eq('stripe_payment_id', charge.payment_intent)
          .single();

        if (contribution) {
          // Update contribution status
          await supabaseClient
            .from('contributions')
            .update({
              payment_status: 'refunded',
            })
            .eq('id', contribution.id);

          // Decrease item's current_amount
          const { data: item } = await supabaseClient
            .from('registry_items')
            .select('current_amount, price_amount')
            .eq('id', contribution.item_id)
            .single();

          if (item) {
            const newAmount = Math.max(0, (item.current_amount || 0) - contribution.amount);
            const isFulfilled = newAmount >= item.price_amount;

            await supabaseClient
              .from('registry_items')
              .update({
                current_amount: newAmount,
                is_fulfilled: isFulfilled,
              })
              .eq('id', contribution.item_id);
          }

          // Decrease registry balance (platform wallet) on refund
          if (contribution.registry_id) {
            // Get current balance
            const { data: balance } = await supabaseClient
              .from('registry_balances')
              .select('balance_cents')
              .eq('registry_id', contribution.registry_id)
              .single();

            if (balance) {
              const newBalance = Math.max(0, balance.balance_cents - contribution.amount);
              await supabaseClient
                .from('registry_balances')
                .update({ balance_cents: newBalance })
                .eq('registry_id', contribution.registry_id);
            }
          }
        }

        console.log('Refund processed:', charge.id);
        break;
      }

      // Removed account.updated handler - no longer using Stripe Connect

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Webhook handler failed',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

