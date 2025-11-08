# Quick Deploy Guide - Get Stripe Working Now! 🚀

## Step 1: Deploy Edge Functions via Supabase Dashboard

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project

2. **Navigate to Edge Functions**
   - Click **Edge Functions** in the left sidebar
   - Click **Create a new function** button

3. **Deploy Function 1: `create-checkout-session`**
   - Function name: `create-checkout-session`
   - Copy ALL the code from: `supabase/functions/create-checkout-session/index.ts`
   - Paste into the code editor
   - Click **Deploy** button
   - Wait for deployment to complete ✅

4. **Deploy Function 2: `stripe-webhook`**
   - Click **Create a new function** again
   - Function name: `stripe-webhook`
   - Copy ALL the code from: `supabase/functions/stripe-webhook/index.ts`
   - Paste into the code editor
   - Click **Deploy** button
   - Wait for deployment to complete ✅

## Step 2: Add Required Secrets

Make sure you have these secrets set in Supabase:

1. **Go to Project Settings → Edge Functions → Secrets**
2. **Add these secrets** (if not already added):
   - `STRIPE_SECRET_KEY` = your Stripe secret key (sk_live_...)
   - `SUPABASE_SERVICE_ROLE_KEY` = from Project Settings → API → service_role key
   - `STRIPE_WEBHOOK_SECRET` = you'll get this in Step 3

## Step 3: Set Up Stripe Webhook

1. **Go to Stripe Dashboard**
   - Visit: https://dashboard.stripe.com
   - Make sure you're in **Live mode** (toggle top right)

2. **Create Webhook Endpoint**
   - Go to **Developers** → **Webhooks**
   - Click **Add endpoint**
   - Endpoint URL: `https://hjfxtwgwbxyodjfvveco.supabase.co/functions/v1/stripe-webhook`
   - Description: "Giftly payment webhook"

3. **Select Events to Listen For**
   - Click **Select events**
   - Check these events:
     - ✅ `checkout.session.completed`
     - ✅ `checkout.session.async_payment_succeeded`
     - ✅ `checkout.session.async_payment_failed`
     - ✅ `charge.refunded`
   - Click **Add events**

4. **Get Webhook Secret**
   - After creating the endpoint, click on it
   - Find **Signing secret** section
   - Click **Reveal** and copy the secret (starts with `whsec_`)

5. **Add Webhook Secret to Supabase**
   - Go back to Supabase Dashboard
   - Project Settings → Edge Functions → Secrets
   - Add secret: `STRIPE_WEBHOOK_SECRET` = the `whsec_...` value you just copied

## Step 4: Test It! 🎉

1. **Restart your dev server** (if running locally):
   ```bash
   npm run dev
   ```

2. **Test a payment**:
   - Go to a registry page
   - Click "Contribute" on an item
   - Fill out the form
   - Click "Contribute $X"
   - You should be redirected to Stripe Checkout
   - Use test card: `4242 4242 4242 4242` (any future date, any CVC)
   - Complete the payment
   - You should be redirected back with a success message!

## Troubleshooting

**Payment not working?**
- Check browser console for errors
- Check Supabase Edge Functions logs (Dashboard → Edge Functions → click function → Logs)
- Verify all secrets are set correctly

**Webhook not updating payment status?**
- Check Stripe Dashboard → Webhooks → click your endpoint → see if events are being received
- Check Supabase Edge Functions logs for the `stripe-webhook` function
- Verify `STRIPE_WEBHOOK_SECRET` is set correctly

**Need help?**
- Check function logs in Supabase Dashboard
- Check Stripe Dashboard for payment/webhook status
- Review error messages in browser console

