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
  console.error('Please check your .env file in the project root.');
  console.error('Required variables:');
  console.error('  VITE_SUPABASE_URL=https://your-project.supabase.co');
  console.error('  VITE_SUPABASE_ANON_KEY=your-anon-key');
  console.error('');
  console.error('After updating .env, restart your dev server with: npm run dev');
  console.error('');
  console.error('Current working directory:', import.meta.url);
}

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase credentials. Please check your .env file and restart the dev server.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
  description: string;
  guestbook_enabled: boolean;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type RegistryItem = {
  id: string;
  registry_id: string;
  title: string;
  description: string;
  image_url: string;
  item_type: 'cash' | 'product' | 'service' | 'experience' | 'charity';
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
