import { loadStripe, Stripe } from '@stripe/stripe-js';
import { supabase } from './supabase';

// Initialize Stripe - use publishable key from environment
let stripePromise: Promise<Stripe | null> | null = null;

export const getStripe = () => {
  if (!stripePromise) {
    const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    if (!publishableKey) {
      console.warn('Stripe publishable key not found. Payment features will not work.');
      return Promise.resolve(null);
    }
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
};

/**
 * Create a Stripe Checkout session for a contribution
 * This calls a Supabase Edge Function that securely creates the session
 */
export const createCheckoutSession = async (params: {
  itemId: string;
  registryId: string;
  amount: number; // in cents
  contributorName: string;
  contributorEmail?: string;
  message?: string;
  isPublic: boolean;
  successUrl: string;
  cancelUrl: string;
}): Promise<{ sessionId: string; url: string } | null> => {
  try {
    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: {
        item_id: params.itemId,
        registry_id: params.registryId,
        amount: params.amount,
        contributor_name: params.contributorName,
        contributor_email: params.contributorEmail || '',
        message: params.message || '',
        is_public: params.isPublic,
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
      },
    });

    if (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }

    if (!data || !data.sessionId || !data.url) {
      throw new Error('Invalid response from checkout session creation');
    }

    return {
      sessionId: data.sessionId,
      url: data.url,
    };
  } catch (error) {
    console.error('Failed to create checkout session:', error);
    throw error;
  }
};

/**
 * Redirect to Stripe Checkout
 */
export const redirectToCheckout = async (checkoutUrl: string) => {
  window.location.href = checkoutUrl;
};

