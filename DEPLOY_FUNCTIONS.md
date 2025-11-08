# Deploy Stripe Edge Functions - Quick Guide

Since the CLI has some issues, here are two ways to deploy:

## Option 1: Deploy via Supabase Dashboard (Easiest)

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click **Edge Functions** in the left sidebar
4. Click **Create a new function**
5. For each function:

### Function 1: `create-checkout-session`
- Name: `create-checkout-session`
- Copy the contents from `supabase/functions/create-checkout-session/index.ts`
- Paste into the editor
- Click **Deploy**

### Function 2: `stripe-webhook`
- Name: `stripe-webhook`
- Copy the contents from `supabase/functions/stripe-webhook/index.ts`
- Paste into the editor
- Click **Deploy**

### Function 3: `stripe-connect-onboarding`
- Name: `stripe-connect-onboarding`
- Copy the contents from `supabase/functions/stripe-connect-onboarding/index.ts`
- Paste into the editor
- Click **Deploy**

## Option 2: Use Supabase CLI (After updating Command Line Tools)

If you want to use CLI later:

1. Update Command Line Tools:
   ```bash
   sudo rm -rf /Library/Developer/CommandLineTools
   sudo xcode-select --install
   ```

2. Then install Supabase CLI:
   ```bash
   brew install supabase/tap/supabase
   ```

3. Login and link:
   ```bash
   supabase login
   supabase link --project-ref hjfxtwgwbxyodjfvveco
   ```

4. Deploy functions:
   ```bash
   supabase functions deploy create-checkout-session
   supabase functions deploy stripe-webhook
   supabase functions deploy stripe-connect-onboarding
   ```

## After Deployment

1. ✅ Verify functions are deployed (check Supabase Dashboard)
2. ✅ Set up Stripe webhook (see next steps)
3. ✅ Add webhook secret to Supabase secrets
4. ✅ Test a payment

