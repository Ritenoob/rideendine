-- Migration: Create admin_actions table for audit logging
-- Description: Tracks all admin actions (chef verification, etc.)
-- Date: 2026-01-30

CREATE TABLE IF NOT EXISTS admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_type VARCHAR(50) NOT NULL,  -- 'chef_approved', 'chef_rejected', 'order_refunded', etc.
  target_type VARCHAR(50) NOT NULL,  -- 'chef', 'order', 'user', 'driver', etc.
  target_id UUID NOT NULL,
  details JSONB,  -- Additional context about the action
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for querying by admin
CREATE INDEX idx_admin_actions_admin_id ON admin_actions(admin_id);

-- Index for querying by target
CREATE INDEX idx_admin_actions_target ON admin_actions(target_type, target_id);

-- Index for querying by action type
CREATE INDEX idx_admin_actions_type ON admin_actions(action_type);

-- Index for time-based queries
CREATE INDEX idx_admin_actions_created_at ON admin_actions(created_at DESC);

-- Comment
COMMENT ON TABLE admin_actions IS 'Audit log for all admin actions on the platform';
COMMENT ON COLUMN admin_actions.action_type IS 'Type of action performed (chef_approved, chef_rejected, etc.)';
COMMENT ON COLUMN admin_actions.target_type IS 'Type of entity the action was performed on';
COMMENT ON COLUMN admin_actions.target_id IS 'ID of the entity the action was performed on';
COMMENT ON COLUMN admin_actions.details IS 'JSON object with additional context about the action';
