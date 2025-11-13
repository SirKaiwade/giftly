-- Platform Wallet System Migration
-- Pivot from Stripe Connect to platform-held balances with redemption options

-- 1. Registry balances table - tracks balance per registry
CREATE TABLE IF NOT EXISTS registry_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registry_id uuid REFERENCES registries(id) ON DELETE CASCADE UNIQUE NOT NULL,
  balance_cents integer NOT NULL DEFAULT 0,
  total_contributed_cents integer NOT NULL DEFAULT 0,
  total_redeemed_cents integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Shipping tokens table - for tokenized address reveals (defined before redemptions)
CREATE TABLE IF NOT EXISTS shipping_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registry_id uuid REFERENCES registries(id) ON DELETE CASCADE NOT NULL,
  contribution_id uuid REFERENCES contributions(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL, -- Single-use nonce
  recipient_address jsonb NOT NULL, -- Encrypted/sensitive address data
  purchaser_email text NOT NULL, -- Email to send token to
  is_revealed boolean DEFAULT false,
  revealed_at timestamptz DEFAULT NULL,
  expires_at timestamptz NOT NULL, -- 48 hours from creation
  created_at timestamptz DEFAULT now()
);

-- 3. Redemptions table - tracks redemption requests
CREATE TABLE IF NOT EXISTS redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registry_id uuid REFERENCES registries(id) ON DELETE CASCADE NOT NULL,
  redemption_type text NOT NULL, -- 'gift_card', 'shipping_token', 'manual'
  amount_cents integer NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'cancelled', 'flagged'
  gift_card_type text DEFAULT NULL, -- 'amazon', 'visa', etc.
  gift_card_code text DEFAULT NULL, -- Code if issued
  gift_card_email text DEFAULT NULL, -- Email to send gift card to
  shipping_token_id uuid REFERENCES shipping_tokens(id) ON DELETE SET NULL,
  admin_notes text DEFAULT NULL,
  flagged_reason text DEFAULT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. Flagged transactions table - for admin review
CREATE TABLE IF NOT EXISTS flagged_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contribution_id uuid REFERENCES contributions(id) ON DELETE CASCADE,
  redemption_id uuid REFERENCES redemptions(id) ON DELETE CASCADE,
  flag_reason text NOT NULL, -- 'high_amount', 'suspicious_pattern', 'fraud_indicators', etc.
  flag_details jsonb DEFAULT NULL,
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'reviewed', 'approved', 'rejected'
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz DEFAULT NULL,
  admin_notes text DEFAULT NULL,
  created_at timestamptz DEFAULT now()
);

-- 5. Address reveal logs - audit trail
CREATE TABLE IF NOT EXISTS address_reveal_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipping_token_id uuid REFERENCES shipping_tokens(id) ON DELETE CASCADE NOT NULL,
  revealed_to_email text NOT NULL,
  revealed_at timestamptz DEFAULT now(),
  ip_address text DEFAULT NULL,
  user_agent text DEFAULT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_registry_balances_registry_id ON registry_balances(registry_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_registry_id ON redemptions(registry_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_status ON redemptions(status);
CREATE INDEX IF NOT EXISTS idx_shipping_tokens_token ON shipping_tokens(token);
CREATE INDEX IF NOT EXISTS idx_shipping_tokens_registry_id ON shipping_tokens(registry_id);
CREATE INDEX IF NOT EXISTS idx_shipping_tokens_expires_at ON shipping_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_flagged_transactions_status ON flagged_transactions(status);
CREATE INDEX IF NOT EXISTS idx_flagged_transactions_contribution_id ON flagged_transactions(contribution_id);
CREATE INDEX IF NOT EXISTS idx_address_reveal_logs_token_id ON address_reveal_logs(shipping_token_id);

-- Enable RLS
ALTER TABLE registry_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE flagged_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE address_reveal_logs ENABLE ROW LEVEL SECURITY;

-- Registry balances policies
CREATE POLICY "Users can view own registry balances"
  ON registry_balances FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM registries
      WHERE registries.id = registry_balances.registry_id
      AND registries.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage registry balances"
  ON registry_balances FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Redemptions policies
CREATE POLICY "Users can view own registry redemptions"
  ON redemptions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM registries
      WHERE registries.id = redemptions.registry_id
      AND registries.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create redemptions for own registries"
  ON redemptions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM registries
      WHERE registries.id = redemptions.registry_id
      AND registries.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own registry redemptions"
  ON redemptions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM registries
      WHERE registries.id = redemptions.registry_id
      AND registries.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM registries
      WHERE registries.id = redemptions.registry_id
      AND registries.user_id = auth.uid()
    )
  );

-- Shipping tokens policies
CREATE POLICY "Users can view own registry shipping tokens"
  ON shipping_tokens FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM registries
      WHERE registries.id = shipping_tokens.registry_id
      AND registries.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage shipping tokens"
  ON shipping_tokens FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Flagged transactions policies (admin only)
CREATE POLICY "Admins can view flagged transactions"
  ON flagged_transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_id IN (
        -- Add admin user IDs here or use a role system
        SELECT user_id FROM user_profiles WHERE full_name LIKE '%admin%'
      )
    )
  );

-- Address reveal logs policies
CREATE POLICY "Users can view own registry address reveal logs"
  ON address_reveal_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM shipping_tokens
      JOIN registries ON registries.id = shipping_tokens.registry_id
      WHERE shipping_tokens.id = address_reveal_logs.shipping_token_id
      AND registries.user_id = auth.uid()
    )
  );

-- Function to update registry balance when contribution is paid
CREATE OR REPLACE FUNCTION update_registry_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update when payment status changes to 'paid'
  IF NEW.payment_status = 'paid' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'paid') THEN
    -- Insert or update registry balance
    INSERT INTO registry_balances (registry_id, balance_cents, total_contributed_cents)
    VALUES (NEW.registry_id, NEW.amount, NEW.amount)
    ON CONFLICT (registry_id) DO UPDATE
    SET 
      balance_cents = registry_balances.balance_cents + NEW.amount,
      total_contributed_cents = registry_balances.total_contributed_cents + NEW.amount,
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update balance when contribution is paid
CREATE TRIGGER update_balance_on_payment
  AFTER UPDATE OF payment_status ON contributions
  FOR EACH ROW
  WHEN (NEW.payment_status = 'paid' AND OLD.payment_status != 'paid')
  EXECUTE FUNCTION update_registry_balance();

-- Function to update balance on redemption
CREATE OR REPLACE FUNCTION update_balance_on_redemption()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    UPDATE registry_balances
    SET 
      balance_cents = balance_cents - NEW.amount_cents,
      total_redeemed_cents = total_redeemed_cents + NEW.amount_cents,
      updated_at = now()
    WHERE registry_id = NEW.registry_id;
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update balance when redemption completes
CREATE TRIGGER update_balance_on_redemption_complete
  AFTER UPDATE OF status ON redemptions
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
  EXECUTE FUNCTION update_balance_on_redemption();

-- Function to generate shipping token
CREATE OR REPLACE FUNCTION generate_shipping_token()
RETURNS TRIGGER AS $$
DECLARE
  token_value text;
BEGIN
  -- Generate a secure random token
  token_value := encode(gen_random_bytes(32), 'base64');
  
  -- Set token and expiration (48 hours)
  NEW.token := token_value;
  NEW.expires_at := now() + interval '48 hours';
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-generate shipping token
CREATE TRIGGER generate_shipping_token_trigger
  BEFORE INSERT ON shipping_tokens
  FOR EACH ROW
  EXECUTE FUNCTION generate_shipping_token();

-- Function to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_redemptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_redemptions_updated_at
  BEFORE UPDATE ON redemptions
  FOR EACH ROW
  EXECUTE FUNCTION update_redemptions_updated_at();

CREATE TRIGGER update_registry_balances_updated_at
  BEFORE UPDATE ON registry_balances
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

