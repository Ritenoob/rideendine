-- Migration 002: Add Chef Enhancements (minimum order, delivery radius, operating hours, accepting orders)

-- Add new fields to chefs table
ALTER TABLE chefs ADD COLUMN IF NOT EXISTS minimum_order_cents INT DEFAULT 1000;
ALTER TABLE chefs ADD COLUMN IF NOT EXISTS delivery_radius_km DECIMAL(5,2) DEFAULT 10.00;
ALTER TABLE chefs ADD COLUMN IF NOT EXISTS operating_hours JSONB DEFAULT '{}'::jsonb;
ALTER TABLE chefs ADD COLUMN IF NOT EXISTS is_accepting_orders BOOLEAN DEFAULT TRUE;

-- Add comments for documentation
COMMENT ON COLUMN chefs.minimum_order_cents IS 'Minimum order amount in cents';
COMMENT ON COLUMN chefs.delivery_radius_km IS 'Maximum delivery radius in kilometers';
COMMENT ON COLUMN chefs.operating_hours IS 'JSON object with operating schedule per day';
COMMENT ON COLUMN chefs.is_accepting_orders IS 'Vacation mode toggle - false means chef is not accepting new orders';

-- Add index for accepting orders (for search filtering)
CREATE INDEX IF NOT EXISTS idx_chefs_accepting_orders ON chefs(is_accepting_orders);
