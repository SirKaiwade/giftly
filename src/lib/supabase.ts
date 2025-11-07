import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.');
  console.error('Required: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
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
