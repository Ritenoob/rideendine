-- Migration 006: Platform Settings Table
-- Purpose: Store configurable platform settings for admin management
-- Date: 2026-01-31

-- ============================================================================
-- PLATFORM SETTINGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Fee structure
  platform_fee_percent DECIMAL(5,2) DEFAULT 15.00,
  minimum_order_cents INT DEFAULT 1000,
  delivery_fee_cents INT DEFAULT 499,
  driver_commission_percent DECIMAL(5,2) DEFAULT 80.00,
  chef_commission_percent DECIMAL(5,2) DEFAULT 85.00,
  tax_rate_percent DECIMAL(5,2) DEFAULT 8.25,

  -- Platform controls
  maintenance_mode BOOLEAN DEFAULT FALSE,
  new_registrations_enabled BOOLEAN DEFAULT TRUE,
  orders_enabled BOOLEAN DEFAULT TRUE,

  -- Delivery settings
  max_delivery_radius_km DECIMAL(5,2) DEFAULT 25.00,

  -- Support contact
  support_email VARCHAR(255) DEFAULT 'support@ridendine.com',
  support_phone VARCHAR(50) DEFAULT '+1-800-RIDENDINE',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings if table is empty
INSERT INTO platform_settings (id)
SELECT gen_random_uuid()
WHERE NOT EXISTS (SELECT 1 FROM platform_settings LIMIT 1);

-- Add trigger to update updated_at on changes
CREATE OR REPLACE FUNCTION update_platform_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_platform_settings ON platform_settings;
CREATE TRIGGER trigger_update_platform_settings
  BEFORE UPDATE ON platform_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_platform_settings_updated_at();

-- Comments
COMMENT ON TABLE platform_settings IS 'Configurable platform-wide settings managed by admins';
COMMENT ON COLUMN platform_settings.platform_fee_percent IS 'Percentage fee charged on each order (platform commission)';
COMMENT ON COLUMN platform_settings.minimum_order_cents IS 'Minimum order amount in cents';
COMMENT ON COLUMN platform_settings.delivery_fee_cents IS 'Base delivery fee in cents';
COMMENT ON COLUMN platform_settings.driver_commission_percent IS 'Percentage of delivery fee that goes to drivers';
COMMENT ON COLUMN platform_settings.chef_commission_percent IS 'Percentage of order value that goes to chefs (after platform fee)';
COMMENT ON COLUMN platform_settings.maintenance_mode IS 'When true, platform shows maintenance message';
COMMENT ON COLUMN platform_settings.new_registrations_enabled IS 'When false, new user registrations are disabled';
COMMENT ON COLUMN platform_settings.orders_enabled IS 'When false, new orders cannot be placed';
COMMENT ON COLUMN platform_settings.max_delivery_radius_km IS 'Maximum distance for deliveries in kilometers';
COMMENT ON COLUMN platform_settings.tax_rate_percent IS 'Tax rate applied to orders';
