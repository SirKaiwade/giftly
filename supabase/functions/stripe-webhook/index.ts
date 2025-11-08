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
        
        // Update contribution status to paid
        const { error: updateError } = await supabaseClient
          .from('contributions')
          .update({
            payment_status: 'paid',
            stripe_payment_id: session.payment_intent || session.id,
          })
          .eq('stripe_payment_id', session.id);

        if (updateError) {
          console.error('Error updating contribution:', updateError);
          throw updateError;
        }

        // Update the item's current_amount
        if (session.metadata?.item_id) {
          // Get current contribution amount
          const { data: contribution } = await supabaseClient
            .from('contributions')
            .select('amount, item_id')
            .eq('stripe_payment_id', session.id)
            .single();

          if (contribution) {
            // Update item's current_amount
            const { data: item } = await supabaseClient
              .from('registry_items')
              .select('current_amount')
              .eq('id', contribution.item_id)
              .single();

            if (item) {
              const newAmount = (item.current_amount || 0) + contribution.amount;
              
              // Check if item is fulfilled
              const { data: fullItem } = await supabaseClient
                .from('registry_items')
                .select('price_amount')
                .eq('id', contribution.item_id)
                .single();

              const isFulfilled = fullItem && newAmount >= fullItem.price_amount;

              await supabaseClient
                .from('registry_items')
                .update({
                  current_amount: newAmount,
                  is_fulfilled: isFulfilled,
                })
                .eq('id', contribution.item_id);
            }
          }
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
        }

        console.log('Refund processed:', charge.id);
        break;
      }

      case 'account.updated': {
        const account = event.data.object as any;
        
        // Update user profile with account status
        const { data: profile } = await supabaseClient
          .from('user_profiles')
          .select('id')
          .eq('stripe_account_id', account.id)
          .single();

        if (profile) {
          let accountStatus = 'pending';
          if (account.charges_enabled && account.payouts_enabled) {
            accountStatus = 'active';
          } else if (account.charges_enabled || account.payouts_enabled) {
            accountStatus = 'restricted';
          }

          await supabaseClient
            .from('user_profiles')
            .update({
              stripe_account_status: accountStatus,
              stripe_onboarding_complete: account.details_submitted || false,
            })
            .eq('stripe_account_id', account.id);

          console.log('Account status updated:', account.id, accountStatus);
        }
        break;
      }

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

