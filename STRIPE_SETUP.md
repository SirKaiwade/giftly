# Stripe Integration Setup Guide

This guide will help you set up Stripe payment processing for your Giftly application.

## Overview

The Stripe integration uses:
- **Stripe Checkout** - Hosted payment page (most secure, easiest to implement)
- **Supabase Edge Functions** - Serverless functions to securely handle Stripe API calls
- **Webhooks** - To update payment status in real-time

## Prerequisites

1. A Stripe account (sign up at https://stripe.com)
2. Supabase project with Edge Functions enabled
3. Your application deployed or running locally

## Step 1: Get Your Stripe API Keys

1. Log in to your [Stripe Dashboard](https://dashboard.stripe.com)
2. Go to **Developers** → **API keys**
3. Copy your **Publishable key** (starts with `pk_`)
4. Copy your **Secret key** (starts with `sk_`) - keep this secure!

**Note:** Use test keys for development, live keys for production.

## Step 2: Set Up Environment Variables

### Frontend Environment Variables

Add to your `.env` file (or your hosting platform's environment variables):

```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Supabase Edge Functions Environment Variables

You need to set these in your Supabase project:

1. Go to your Supabase Dashboard
2. Navigate to **Project Settings** → **Edge Functions**
3. Add the following secrets:

```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...  # You'll get this after setting up webhooks
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # From Supabase project settings
```

**Note:** The `SUPABASE_URL` and `SUPABASE_ANON_KEY` are automatically available to Edge Functions.

## Step 3: Deploy Supabase Edge Functions

### Install Supabase CLI (if not already installed)

```bash
npm install -g supabase
```

### Login to Supabase

```bash
supabase login
```

### Link Your Project

```bash
supabase link --project-ref your-project-ref
```

### Deploy the Functions

```bash
# Deploy checkout session function
supabase functions deploy create-checkout-session

# Deploy webhook handler function
supabase functions deploy stripe-webhook
```

## Step 4: Set Up Stripe Webhooks

Webhooks allow Stripe to notify your application when payments are completed.

### For Local Development:

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login: `stripe login`
3. Forward webhooks to your local function:
   ```bash
   stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook
   ```
4. Copy the webhook signing secret (starts with `whsec_`) and add it to your Supabase secrets

### For Production:

1. Go to Stripe Dashboard → **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Enter your webhook URL:
   ```
   https://your-project-ref.supabase.co/functions/v1/stripe-webhook
   ```
4. Select events to listen for:
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
   - `checkout.session.async_payment_failed`
   - `charge.refunded`
5. Copy the webhook signing secret and add it to your Supabase secrets as `STRIPE_WEBHOOK_SECRET`

## Step 5: Update Your Frontend Environment

Make sure your frontend has access to the Stripe publishable key:

1. Add `VITE_STRIPE_PUBLISHABLE_KEY` to your `.env` file
2. Restart your development server if running locally
3. For production, add the environment variable to your hosting platform (Vercel, Netlify, etc.)

## Step 6: Test the Integration

### Test Mode

1. Use Stripe test cards:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - Use any future expiry date, any CVC, any ZIP
2. Make a test contribution through your app
3. Check Stripe Dashboard → **Payments** to see the test payment
4. Verify the contribution status updates in your database

### Test Webhook Locally

```bash
# In one terminal, forward webhooks
stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook

# In another terminal, trigger a test event
stripe trigger checkout.session.completed
```

## Step 7: Go Live

When ready for production:

1. Switch to **Live mode** in Stripe Dashboard
2. Get your live API keys
3. Update environment variables with live keys
4. Update webhook endpoint to production URL
5. Test with a small real payment first

## Architecture Overview

```
User clicks "Contribute"
  ↓
ContributionModal collects info
  ↓
Calls createCheckoutSession() → Supabase Edge Function
  ↓
Edge Function creates Stripe Checkout Session
  ↓
User redirected to Stripe Checkout
  ↓
User completes payment
  ↓
Stripe sends webhook → stripe-webhook Edge Function
  ↓
Edge Function updates contribution status in database
  ↓
User redirected back to registry with success message
```

## Troubleshooting

### Payment not processing

- Check browser console for errors
- Verify `VITE_STRIPE_PUBLISHABLE_KEY` is set correctly
- Check Supabase Edge Function logs for errors

### Webhook not working

- Verify `STRIPE_WEBHOOK_SECRET` is set correctly
- Check webhook endpoint URL is correct
- View webhook events in Stripe Dashboard → **Developers** → **Webhooks**
- Check Supabase Edge Function logs

### Contribution status not updating

- Verify webhook is receiving events (check Stripe Dashboard)
- Check Supabase Edge Function logs
- Verify database permissions for the service role key

## Security Notes

- **Never** expose your Stripe secret key in frontend code
- Always use Edge Functions or a backend server for Stripe API calls
- Verify webhook signatures to ensure requests are from Stripe
- Use environment variables for all sensitive keys
- Enable Row Level Security (RLS) on your database tables

## Additional Resources

- [Stripe Checkout Documentation](https://stripe.com/docs/payments/checkout)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Stripe Testing Guide](https://stripe.com/docs/testing)

## Support

If you encounter issues:
1. Check the browser console for frontend errors
2. Check Supabase Edge Function logs
3. Check Stripe Dashboard for payment/webhook status
4. Review the error messages in the code

