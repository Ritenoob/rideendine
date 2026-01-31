-- RideNDine Orders Enhancements Migration
-- Migration 004: Add missing columns for order lifecycle management

-- Add missing timestamp columns to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS ready_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS picked_up_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP;

-- Add rejection and cancellation reason columns
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- Add delivery instructions column if missing
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS delivery_instructions TEXT;

-- Add chef earnings column to orders (for quick reference)
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS chef_earning_cents INT;

-- Enhance order_items table with denormalized name and notes
ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS menu_item_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS total_cents INT,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add refund tracking to payments table
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS refund_amount_cents INT;

-- Add index for order status + created_at for efficient filtering
CREATE INDEX IF NOT EXISTS idx_orders_status_created
ON orders(status, created_at DESC);

-- Add index for payment lookup by payment intent
CREATE INDEX IF NOT EXISTS idx_payments_stripe_pi
ON payments(stripe_payment_intent_id);

-- Add chef_earning_cents to chef_ledger if not exists
-- (Already exists from initial schema, but ensure consistency)

-- Update order status enum to include 'rejected' if not present
-- Note: PostgreSQL CHECK constraints need to be dropped and recreated
-- We'll handle this in the application layer since 'rejected' is already in OrderStatus enum

-- Add comments for documentation
COMMENT ON COLUMN orders.accepted_at IS 'Timestamp when chef accepted the order';
COMMENT ON COLUMN orders.ready_at IS 'Timestamp when chef marked order ready for pickup';
COMMENT ON COLUMN orders.picked_up_at IS 'Timestamp when driver picked up the order';
COMMENT ON COLUMN orders.delivered_at IS 'Timestamp when order was delivered';
COMMENT ON COLUMN orders.cancelled_at IS 'Timestamp when order was cancelled';
COMMENT ON COLUMN orders.rejection_reason IS 'Reason provided by chef for rejecting order';
COMMENT ON COLUMN orders.cancellation_reason IS 'Reason for order cancellation';
COMMENT ON COLUMN order_items.menu_item_name IS 'Snapshot of menu item name at order time';
COMMENT ON COLUMN order_items.total_cents IS 'Total price for this line item (price * quantity)';
COMMENT ON COLUMN payments.refund_amount_cents IS 'Amount refunded in cents (if any)';
