-- Migration: 010_mobile_app_tables
-- Description: Add tables for mobile app features (device tokens, user addresses)
-- Created: 2026-01-31

-- Device tokens for push notifications
CREATE TABLE IF NOT EXISTS device_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL,
  platform VARCHAR(20) NOT NULL CHECK (platform IN ('ios', 'android')),
  device_id VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  last_seen_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, token)
);

CREATE INDEX idx_device_tokens_user_id ON device_tokens(user_id);
CREATE INDEX idx_device_tokens_active ON device_tokens(is_active) WHERE is_active = true;
CREATE INDEX idx_device_tokens_token ON device_tokens(token);

COMMENT ON TABLE device_tokens IS 'Stores Expo push notification tokens for mobile devices';
COMMENT ON COLUMN device_tokens.token IS 'Expo push token (format: ExponentPushToken[...])';
COMMENT ON COLUMN device_tokens.platform IS 'Device platform: ios or android';
COMMENT ON COLUMN device_tokens.is_active IS 'Whether this token is still valid';
COMMENT ON COLUMN device_tokens.last_seen_at IS 'Last time this device checked in';

-- User addresses (saved delivery addresses)
CREATE TABLE IF NOT EXISTS user_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label VARCHAR(50) NOT NULL,
  address_line1 VARCHAR(255) NOT NULL,
  address_line2 VARCHAR(255),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(50) NOT NULL,
  zip_code VARCHAR(20) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  delivery_instructions TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_addresses_user_id ON user_addresses(user_id);
CREATE INDEX idx_user_addresses_default ON user_addresses(user_id, is_default) WHERE is_default = true;
CREATE INDEX idx_user_addresses_location ON user_addresses USING GIST (
  ll_to_earth(latitude, longitude)
);

COMMENT ON TABLE user_addresses IS 'Saved delivery addresses for customers';
COMMENT ON COLUMN user_addresses.label IS 'Address label (e.g., Home, Work, Other)';
COMMENT ON COLUMN user_addresses.is_default IS 'Whether this is the default delivery address';
COMMENT ON COLUMN user_addresses.delivery_instructions IS 'Special delivery instructions (e.g., gate code, apt number)';

-- Add delivery_photo_url column to orders if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'delivery_photo_url'
  ) THEN
    ALTER TABLE orders ADD COLUMN delivery_photo_url VARCHAR(500);
    COMMENT ON COLUMN orders.delivery_photo_url IS 'URL of delivery confirmation photo';
  END IF;
END $$;

-- Add estimated pickup/delivery timestamps to orders if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'estimated_pickup_at'
  ) THEN
    ALTER TABLE orders ADD COLUMN estimated_pickup_at TIMESTAMP;
    COMMENT ON COLUMN orders.estimated_pickup_at IS 'Driver estimated time to pick up from chef';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'estimated_delivery_at'
  ) THEN
    ALTER TABLE orders ADD COLUMN estimated_delivery_at TIMESTAMP;
    COMMENT ON COLUMN orders.estimated_delivery_at IS 'Driver estimated time to deliver to customer';
  END IF;
END $$;

-- Add driver_assigned_at timestamp to orders if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'driver_assigned_at'
  ) THEN
    ALTER TABLE orders ADD COLUMN driver_assigned_at TIMESTAMP;
    COMMENT ON COLUMN orders.driver_assigned_at IS 'When driver accepted the order';
  END IF;
END $$;

-- Add picked_up_at timestamp to orders if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'picked_up_at'
  ) THEN
    ALTER TABLE orders ADD COLUMN picked_up_at TIMESTAMP;
    COMMENT ON COLUMN orders.picked_up_at IS 'When driver picked up from chef';
  END IF;
END $$;

-- Function to ensure only one default address per user
CREATE OR REPLACE FUNCTION ensure_one_default_address()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    -- Unset all other default addresses for this user
    UPDATE user_addresses 
    SET is_default = false 
    WHERE user_id = NEW.user_id 
      AND id != NEW.id 
      AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce single default address
DROP TRIGGER IF EXISTS trigger_ensure_one_default_address ON user_addresses;
CREATE TRIGGER trigger_ensure_one_default_address
  BEFORE INSERT OR UPDATE ON user_addresses
  FOR EACH ROW
  EXECUTE FUNCTION ensure_one_default_address();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON device_tokens TO ridendine;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_addresses TO ridendine;

-- Insert test data for development
DO $$
DECLARE
  test_customer_id UUID;
BEGIN
  -- Get test customer ID
  SELECT id INTO test_customer_id 
  FROM users 
  WHERE email = 'customer@test.com' 
  LIMIT 1;

  IF test_customer_id IS NOT NULL THEN
    -- Add test address for customer
    INSERT INTO user_addresses (
      user_id, label, address_line1, city, state, zip_code,
      latitude, longitude, is_default, delivery_instructions
    ) VALUES (
      test_customer_id,
      'Home',
      '123 Main Street',
      'San Francisco',
      'CA',
      '94102',
      37.7749,
      -122.4194,
      true,
      'Ring doorbell twice'
    ) ON CONFLICT DO NOTHING;

    INSERT INTO user_addresses (
      user_id, label, address_line1, city, state, zip_code,
      latitude, longitude, is_default
    ) VALUES (
      test_customer_id,
      'Work',
      '456 Market Street, Suite 100',
      'San Francisco',
      'CA',
      '94103',
      37.7899,
      -122.4017,
      false
    ) ON CONFLICT DO NOTHING;
  END IF;
END $$;
