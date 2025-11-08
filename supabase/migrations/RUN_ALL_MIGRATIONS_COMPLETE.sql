-- ============================================
-- COMPLETE MIGRATION FILE - Run Everything
-- ============================================
-- Copy and paste this entire file into Supabase Dashboard → SQL Editor → New Query
-- This includes ALL migrations in chronological order
-- Safe to run multiple times (uses IF NOT EXISTS)

-- ============================================
-- Migration 1: Initial Schema (20251106235238)
-- ============================================
-- Create registries table
CREATE TABLE IF NOT EXISTS registries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  slug text UNIQUE NOT NULL,
  event_type text NOT NULL DEFAULT 'custom',
  theme text NOT NULL DEFAULT 'minimal',
  title text NOT NULL,
  subtitle text DEFAULT '',
  event_date date,
  hero_image_url text DEFAULT '',
  description text DEFAULT '',
  guestbook_enabled boolean DEFAULT true,
  is_published boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create registry_items table
CREATE TABLE IF NOT EXISTS registry_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registry_id uuid REFERENCES registries(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  image_url text DEFAULT '',
  item_type text NOT NULL DEFAULT 'product',
  price_amount integer DEFAULT 0,
  current_amount integer DEFAULT 0,
  external_link text DEFAULT '',
  category text DEFAULT 'other',
  priority integer DEFAULT 0,
  is_fulfilled boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create contributions table
CREATE TABLE IF NOT EXISTS contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registry_id uuid REFERENCES registries(id) ON DELETE CASCADE NOT NULL,
  item_id uuid REFERENCES registry_items(id) ON DELETE CASCADE,
  contributor_name text NOT NULL,
  contributor_email text DEFAULT '',
  amount integer NOT NULL DEFAULT 0,
  message text DEFAULT '',
  is_public boolean DEFAULT true,
  payment_status text NOT NULL DEFAULT 'pending',
  stripe_payment_id text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create guestbook_entries table
CREATE TABLE IF NOT EXISTS guestbook_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registry_id uuid REFERENCES registries(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_registries_slug ON registries(slug);
CREATE INDEX IF NOT EXISTS idx_registries_user_id ON registries(user_id);
CREATE INDEX IF NOT EXISTS idx_registry_items_registry_id ON registry_items(registry_id);
CREATE INDEX IF NOT EXISTS idx_contributions_registry_id ON contributions(registry_id);
CREATE INDEX IF NOT EXISTS idx_guestbook_registry_id ON guestbook_entries(registry_id);

-- Enable RLS
ALTER TABLE registries ENABLE ROW LEVEL SECURITY;
ALTER TABLE registry_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE guestbook_entries ENABLE ROW LEVEL SECURITY;

-- Registries policies
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'registries' AND policyname = 'Users can view own registries'
  ) THEN
    CREATE POLICY "Users can view own registries"
      ON registries FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'registries' AND policyname = 'Public can view published registries'
  ) THEN
    CREATE POLICY "Public can view published registries"
      ON registries FOR SELECT
      TO anon
      USING (is_published = true);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'registries' AND policyname = 'Users can insert own registries'
  ) THEN
    CREATE POLICY "Users can insert own registries"
      ON registries FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'registries' AND policyname = 'Users can update own registries'
  ) THEN
    CREATE POLICY "Users can update own registries"
      ON registries FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'registries' AND policyname = 'Users can delete own registries'
  ) THEN
    CREATE POLICY "Users can delete own registries"
      ON registries FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Registry items policies (simplified - using DO blocks to check)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'registry_items' AND policyname = 'Users can view own registry items'
  ) THEN
    CREATE POLICY "Users can view own registry items"
      ON registry_items FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM registries
          WHERE registries.id = registry_items.registry_id
          AND registries.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'registry_items' AND policyname = 'Public can view published registry items'
  ) THEN
    CREATE POLICY "Public can view published registry items"
      ON registry_items FOR SELECT
      TO anon
      USING (
        EXISTS (
          SELECT 1 FROM registries
          WHERE registries.id = registry_items.registry_id
          AND registries.is_published = true
        )
      );
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'registry_items' AND policyname = 'Users can insert items to own registries'
  ) THEN
    CREATE POLICY "Users can insert items to own registries"
      ON registry_items FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM registries
          WHERE registries.id = registry_items.registry_id
          AND registries.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'registry_items' AND policyname = 'Users can update own registry items'
  ) THEN
    CREATE POLICY "Users can update own registry items"
      ON registry_items FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM registries
          WHERE registries.id = registry_items.registry_id
          AND registries.user_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM registries
          WHERE registries.id = registry_items.registry_id
          AND registries.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'registry_items' AND policyname = 'Users can delete own registry items'
  ) THEN
    CREATE POLICY "Users can delete own registry items"
      ON registry_items FOR DELETE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM registries
          WHERE registries.id = registry_items.registry_id
          AND registries.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Contributions policies
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'contributions' AND policyname = 'Users can view contributions to own registries'
  ) THEN
    CREATE POLICY "Users can view contributions to own registries"
      ON contributions FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM registries
          WHERE registries.id = contributions.registry_id
          AND registries.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'contributions' AND policyname = 'Public can view public contributions'
  ) THEN
    CREATE POLICY "Public can view public contributions"
      ON contributions FOR SELECT
      TO anon
      USING (
        is_public = true
        AND EXISTS (
          SELECT 1 FROM registries
          WHERE registries.id = contributions.registry_id
          AND registries.is_published = true
        )
      );
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'contributions' AND policyname = 'Anyone can create contributions'
  ) THEN
    CREATE POLICY "Anyone can create contributions"
      ON contributions FOR INSERT
      TO anon, authenticated
      WITH CHECK (true);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'contributions' AND policyname = 'Users can update contributions to own registries'
  ) THEN
    CREATE POLICY "Users can update contributions to own registries"
      ON contributions FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM registries
          WHERE registries.id = contributions.registry_id
          AND registries.user_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM registries
          WHERE registries.id = contributions.registry_id
          AND registries.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Guestbook policies
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'guestbook_entries' AND policyname = 'Anyone can view guestbook entries for published registries'
  ) THEN
    CREATE POLICY "Anyone can view guestbook entries for published registries"
      ON guestbook_entries FOR SELECT
      TO anon, authenticated
      USING (
        EXISTS (
          SELECT 1 FROM registries
          WHERE registries.id = guestbook_entries.registry_id
          AND registries.is_published = true
          AND registries.guestbook_enabled = true
        )
      );
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'guestbook_entries' AND policyname = 'Anyone can create guestbook entries'
  ) THEN
    CREATE POLICY "Anyone can create guestbook entries"
      ON guestbook_entries FOR INSERT
      TO anon, authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM registries
          WHERE registries.id = guestbook_entries.registry_id
          AND registries.is_published = true
          AND registries.guestbook_enabled = true
        )
      );
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'guestbook_entries' AND policyname = 'Users can delete guestbook entries from own registries'
  ) THEN
    CREATE POLICY "Users can delete guestbook entries from own registries"
      ON guestbook_entries FOR DELETE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM registries
          WHERE registries.id = guestbook_entries.registry_id
          AND registries.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- ============================================
-- Migration 2: User Profiles (20251107000000)
-- ============================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  full_name text DEFAULT '',
  phone text DEFAULT '',
  address_line1 text DEFAULT '',
  address_line2 text DEFAULT '',
  city text DEFAULT '',
  state text DEFAULT '',
  zip_code text DEFAULT '',
  country text DEFAULT 'US',
  business_name text DEFAULT '',
  website text DEFAULT '',
  bio text DEFAULT '',
  stripe_account_id text DEFAULT '',
  stripe_account_status text DEFAULT NULL,
  stripe_onboarding_complete boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- User profiles policies
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Users can view own profile'
  ) THEN
    CREATE POLICY "Users can view own profile"
      ON user_profiles FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Users can insert own profile'
  ) THEN
    CREATE POLICY "Users can insert own profile"
      ON user_profiles FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile"
      ON user_profiles FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Users can delete own profile'
  ) THEN
    CREATE POLICY "Users can delete own profile"
      ON user_profiles FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at (only if it doesn't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_profiles_updated_at'
  ) THEN
    CREATE TRIGGER update_user_profiles_updated_at
      BEFORE UPDATE ON user_profiles
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ============================================
-- Migration 3: Hero Image Position (20251107000001)
-- ============================================
ALTER TABLE registries 
ADD COLUMN IF NOT EXISTS hero_image_position text DEFAULT 'center';

-- ============================================
-- Migration 4: Profile Picture (20251107000002)
-- ============================================
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS profile_picture_url text DEFAULT '';

-- ============================================
-- Migration 5: Item Image Position & Scale (20251107000003)
-- ============================================
ALTER TABLE registry_items 
ADD COLUMN IF NOT EXISTS image_position text DEFAULT 'center',
ADD COLUMN IF NOT EXISTS image_scale numeric DEFAULT 1.0;

-- Add time donation fields to registry_items
ALTER TABLE registry_items
ADD COLUMN IF NOT EXISTS hours_needed numeric,
ADD COLUMN IF NOT EXISTS hourly_rate integer;

-- ============================================
-- Migration 6: Typography Font Families (20251107000004)
-- ============================================
ALTER TABLE registries
ADD COLUMN IF NOT EXISTS title_font_family text DEFAULT 'sans',
ADD COLUMN IF NOT EXISTS subtitle_font_family text DEFAULT 'sans',
ADD COLUMN IF NOT EXISTS body_font_family text DEFAULT 'sans';

-- ============================================
-- Migration 7: Custom Theme Colors (20251107000005)
-- ============================================
ALTER TABLE registries
ADD COLUMN IF NOT EXISTS custom_theme_colors text;

-- ============================================
-- Migration 8: Typography Weight/Style/Decoration (20251107000006)
-- ============================================
ALTER TABLE registries
ADD COLUMN IF NOT EXISTS title_font_weight text DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS title_font_style text DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS title_text_decoration text DEFAULT 'none',
ADD COLUMN IF NOT EXISTS subtitle_font_weight text DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS subtitle_font_style text DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS subtitle_text_decoration text DEFAULT 'none',
ADD COLUMN IF NOT EXISTS body_font_weight text DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS body_font_style text DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS body_text_decoration text DEFAULT 'none';

