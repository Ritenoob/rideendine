-- Migration 006: Phase 4 - Admin & Reviews Features
-- Purpose: Add review moderation capabilities, platform settings, admin activity logging, and user suspension
-- Date: 2026-01-31

-- ============================================================================
-- 1. REVIEWS TABLE ENHANCEMENTS (Moderation Features)
-- ============================================================================

-- Add moderation flag
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT FALSE;

-- Add hidden status for moderated content
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE;

-- Add moderation timestamp
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMP;

-- Add reference to moderating admin
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reviews' AND column_name = 'moderated_by'
  ) THEN
    ALTER TABLE reviews ADD COLUMN moderated_by UUID REFERENCES users(id);
  END IF;
END $$;

-- Add moderation reason
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS moderation_reason TEXT;

COMMENT ON COLUMN reviews.is_flagged IS 'Whether the review has been flagged for moderation';
COMMENT ON COLUMN reviews.is_hidden IS 'Whether the review is hidden from public view';
COMMENT ON COLUMN reviews.moderated_at IS 'Timestamp when the review was moderated';
COMMENT ON COLUMN reviews.moderated_by IS 'Admin user who moderated the review';
COMMENT ON COLUMN reviews.moderation_reason IS 'Reason for moderation action';

-- ============================================================================
-- 2. PLATFORM SETTINGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS platform_settings (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by UUID REFERENCES users(id)
);

COMMENT ON TABLE platform_settings IS 'Centralized platform configuration settings';
COMMENT ON COLUMN platform_settings.key IS 'Unique setting identifier';
COMMENT ON COLUMN platform_settings.value IS 'Setting value stored as JSONB for flexibility';
COMMENT ON COLUMN platform_settings.updated_by IS 'Admin who last updated this setting';

-- Insert default platform settings (using ON CONFLICT to make idempotent)
INSERT INTO platform_settings (key, value) VALUES
  ('commission_rate', '0.15'::jsonb),
  ('tax_rate', '0.08'::jsonb),
  ('delivery_fee_cents', '500'::jsonb),
  ('min_order_cents', '1500'::jsonb),
  ('max_delivery_radius_km', '25'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- 3. ADMIN ACTIVITY LOG TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS admin_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(50),
  target_id UUID,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE admin_activity_log IS 'Comprehensive audit log for all admin activities';
COMMENT ON COLUMN admin_activity_log.admin_id IS 'Admin user who performed the action';
COMMENT ON COLUMN admin_activity_log.action IS 'Action performed (e.g., user_suspended, review_hidden, setting_updated)';
COMMENT ON COLUMN admin_activity_log.target_type IS 'Type of entity affected (user, review, chef, order, setting)';
COMMENT ON COLUMN admin_activity_log.target_id IS 'ID of the affected entity';
COMMENT ON COLUMN admin_activity_log.details IS 'Additional context about the action (before/after values, reason, etc.)';

-- ============================================================================
-- 4. USER SUSPENSION TRACKING
-- ============================================================================

-- Add suspension status
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE;

-- Add suspension timestamp
ALTER TABLE users ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMP;

-- Add reference to suspending admin
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'suspended_by'
  ) THEN
    ALTER TABLE users ADD COLUMN suspended_by UUID REFERENCES users(id);
  END IF;
END $$;

-- Add suspension reason
ALTER TABLE users ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

COMMENT ON COLUMN users.is_suspended IS 'Whether the user account is currently suspended';
COMMENT ON COLUMN users.suspended_at IS 'Timestamp when the user was suspended';
COMMENT ON COLUMN users.suspended_by IS 'Admin user who suspended the account';
COMMENT ON COLUMN users.suspension_reason IS 'Reason for the suspension';

-- ============================================================================
-- 5. PERFORMANCE INDEXES
-- ============================================================================

-- Partial index for flagged reviews (efficient for moderation queries)
CREATE INDEX IF NOT EXISTS idx_reviews_flagged ON reviews(is_flagged) WHERE is_flagged = TRUE;

-- Index for hidden reviews
CREATE INDEX IF NOT EXISTS idx_reviews_hidden ON reviews(is_hidden);

-- Index for admin activity log (time-based queries)
CREATE INDEX IF NOT EXISTS idx_admin_activity_created ON admin_activity_log(created_at DESC);

-- Index for admin activity by admin user
CREATE INDEX IF NOT EXISTS idx_admin_activity_admin ON admin_activity_log(admin_id);

-- Index for admin activity by target
CREATE INDEX IF NOT EXISTS idx_admin_activity_target ON admin_activity_log(target_type, target_id);

-- Partial index for suspended users (efficient for auth checks)
CREATE INDEX IF NOT EXISTS idx_users_suspended ON users(is_suspended) WHERE is_suspended = TRUE;

-- ============================================================================
-- 6. TRIGGER: Auto-update platform_settings.updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_platform_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_platform_settings_updated_at ON platform_settings;
CREATE TRIGGER trigger_platform_settings_updated_at
  BEFORE UPDATE ON platform_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_platform_settings_updated_at();

-- ============================================================================
-- 7. HELPER FUNCTION: Log Admin Activity
-- ============================================================================

CREATE OR REPLACE FUNCTION log_admin_activity(
  p_admin_id UUID,
  p_action VARCHAR(100),
  p_target_type VARCHAR(50) DEFAULT NULL,
  p_target_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO admin_activity_log (admin_id, action, target_type, target_id, details)
  VALUES (p_admin_id, p_action, p_target_type, p_target_id, p_details)
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION log_admin_activity IS 'Helper function to log admin activities with consistent format';

-- ============================================================================
-- 8. HELPER FUNCTION: Get Platform Setting
-- ============================================================================

CREATE OR REPLACE FUNCTION get_platform_setting(p_key VARCHAR(100))
RETURNS JSONB AS $$
DECLARE
  v_value JSONB;
BEGIN
  SELECT value INTO v_value
  FROM platform_settings
  WHERE key = p_key;

  RETURN v_value;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_platform_setting IS 'Helper function to retrieve platform settings by key';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
