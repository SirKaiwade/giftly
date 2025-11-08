import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug: Log what we're getting from environment
console.log('[Supabase Init] Environment check:');
console.log('  VITE_SUPABASE_URL:', supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'MISSING');
console.log('  VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'MISSING');
console.log('  All env vars:', Object.keys(import.meta.env).filter(key => key.startsWith('VITE_')));

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables!');
  if (import.meta.env.DEV) {
    console.error('For local development:');
    console.error('  - Check your .env file in the project root');
    console.error('  - Restart your dev server: npm run dev');
  } else {
    console.error('For production:');
    console.error('  - Set environment variables in your hosting platform');
    console.error('  - Vercel: Project Settings → Environment Variables');
    console.error('  - Netlify: Site Settings → Environment Variables');
    console.error('  - Required: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  }
}

if (!supabaseUrl || !supabaseAnonKey) {
  // Don't throw in production - show a user-friendly error instead
  if (import.meta.env.DEV) {
    throw new Error(
      'Missing Supabase credentials. Please check your .env file and restart the dev server.'
    );
  }
  // In production, create a client that will fail gracefully
  console.error('⚠️ Supabase not configured - app will not work properly');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

export type Registry = {
  id: string;
  user_id: string;
  slug: string;
  event_type: string;
  theme: string;
  title: string;
  subtitle: string;
  event_date: string;
  hero_image_url: string;
  hero_image_position?: string; // CSS object-position value (e.g., "center", "top", "50% 30%")
  description: string;
  guestbook_enabled: boolean;
  is_published: boolean;
  // Typography settings - only font families
  title_font_family?: string; // 'sans' | 'serif' | 'mono' | 'display' | 'handwriting'
  subtitle_font_family?: string; // 'sans' | 'serif' | 'mono' | 'display' | 'handwriting'
  body_font_family?: string; // 'sans' | 'serif' | 'mono' | 'display' | 'handwriting'
  created_at: string;
  updated_at: string;
};

export type RegistryItem = {
  id: string;
  registry_id: string;
  title: string;
  description: string;
  image_url: string;
  image_position?: string; // CSS object-position value (e.g., "center", "50% 30%")
  image_scale?: number; // Scale factor (e.g., 1.5 for 150%)
  item_type: 'cash' | 'product' | 'service' | 'experience' | 'charity' | 'partial';
  price_amount: number;
  current_amount: number;
  external_link: string;
  category: string;
  priority: number;
  is_fulfilled: boolean;
  created_at: string;
};

export type Contribution = {
  id: string;
  registry_id: string;
  item_id: string | null;
  contributor_name: string;
  contributor_email: string;
  amount: number;
  message: string;
  is_public: boolean;
  payment_status: 'paid' | 'pending' | 'refunded';
  stripe_payment_id: string;
  created_at: string;
};

export type GuestbookEntry = {
  id: string;
  registry_id: string;
  name: string;
  message: string;
  created_at: string;
};
