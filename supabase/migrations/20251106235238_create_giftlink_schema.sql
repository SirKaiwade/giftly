/*
  # GiftLink Registry Platform Schema

  1. New Tables
    - `registries`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `slug` (text, unique) - URL-friendly identifier
      - `event_type` (text) - wedding, baby, birthday, custom
      - `theme` (text) - minimal, pastel, dark, floral, gold
      - `title` (text) - Event name/couple names
      - `subtitle` (text) - Optional tagline
      - `event_date` (date) - Event date
      - `hero_image_url` (text) - Header photo
      - `description` (text) - About section
      - `guestbook_enabled` (boolean) - Allow guestbook
      - `is_published` (boolean) - Public visibility
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `registry_items`
      - `id` (uuid, primary key)
      - `registry_id` (uuid, references registries)
      - `title` (text) - Item name
      - `description` (text) - Item details
      - `image_url` (text) - Item photo
      - `item_type` (text) - cash, product, service, experience, charity
      - `price_amount` (integer) - Amount in cents
      - `current_amount` (integer) - Funded amount in cents
      - `external_link` (text) - Amazon/store link
      - `category` (text) - honeymoon, home, baby, etc.
      - `priority` (integer) - Display order
      - `is_fulfilled` (boolean) - Completed status
      - `created_at` (timestamptz)

    - `contributions`
      - `id` (uuid, primary key)
      - `registry_id` (uuid, references registries)
      - `item_id` (uuid, references registry_items)
      - `contributor_name` (text)
      - `contributor_email` (text)
      - `amount` (integer) - Amount in cents
      - `message` (text) - Optional note
      - `is_public` (boolean) - Show on registry
      - `payment_status` (text) - paid, pending, refunded
      - `stripe_payment_id` (text) - Stripe reference
      - `created_at` (timestamptz)

    - `guestbook_entries`
      - `id` (uuid, primary key)
      - `registry_id` (uuid, references registries)
      - `name` (text)
      - `message` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Registries: Users can manage their own, public can read published
    - Registry items: Same as registries
    - Contributions: Users can read their registry contributions, contributors can create
    - Guestbook: Public can create if enabled, users can read their entries

  3. Indexes
    - Registry slug for fast lookups
    - Registry user_id for dashboard queries
    - Item registry_id for item lists
    - Contribution registry_id for stats
*/

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
CREATE POLICY "Users can view own registries"
  ON registries FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Public can view published registries"
  ON registries FOR SELECT
  TO anon
  USING (is_published = true);

CREATE POLICY "Users can insert own registries"
  ON registries FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own registries"
  ON registries FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own registries"
  ON registries FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Registry items policies
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

-- Contributions policies
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

CREATE POLICY "Anyone can create contributions"
  ON contributions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

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

-- Guestbook policies
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