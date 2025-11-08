# Troubleshooting Edge Functions

## "Failed to send a request to the Edge Function" Error

This error typically means the Edge Function hasn't been deployed yet. Here's how to fix it:

### Step 1: Verify Function is Deployed

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click **Edge Functions** in the left sidebar
4. Check if `stripe-connect-onboarding` appears in the list
5. If it's not there, you need to deploy it

### Step 2: Deploy the Function

#### Option A: Via Supabase Dashboard (Recommended)

1. In the Edge Functions page, click **Create a new function**
2. Name it exactly: `stripe-connect-onboarding`
3. Open the file `supabase/functions/stripe-connect-onboarding/index.ts` in your code editor
4. Copy ALL the contents
5. Paste into the Supabase editor
6. Click **Deploy**

#### Option B: Check Function Name

Make sure the function name matches exactly:
- Function name in Supabase: `stripe-connect-onboarding`
- Called in code: `supabase.functions.invoke('stripe-connect-onboarding')`

### Step 3: Verify Environment Variables

The function needs these environment variables set in Supabase:

1. Go to **Settings** → **Edge Functions** → **Secrets**
2. Make sure these are set:
   - `STRIPE_SECRET_KEY` - Your Stripe secret key (starts with `sk_`)
   - `SUPABASE_URL` - Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY` - Your service role key (starts with `eyJ...`)

### Step 4: Test the Function

After deploying, try the "Connect Stripe Account" button again.

### Step 5: Check Logs

If it still doesn't work:

1. Go to **Edge Functions** → `stripe-connect-onboarding`
2. Click on the function
3. Check the **Logs** tab for any errors
4. Common issues:
   - Missing environment variables
   - Stripe API key is invalid
   - Database connection issues

### Common Errors

**"STRIPE_SECRET_KEY environment variable is not set"**
- Solution: Add `STRIPE_SECRET_KEY` to Edge Function secrets

**"Invalid authentication"**
- Solution: Make sure you're logged in when clicking the button

**"Failed to fetch user profile"**
- Solution: Check that the `user_profiles` table exists and has the correct schema

**Network/CORS errors**
- Solution: Check your Supabase project settings and CORS configuration

## Still Having Issues?

1. Check the browser console (F12) for detailed error messages
2. Check Supabase Edge Function logs
3. Verify all environment variables are set correctly
4. Make sure you're using the correct Supabase project

