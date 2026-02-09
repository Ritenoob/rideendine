-- Migration: Add Stripe Checkout Session support to orders table
-- Created: 2026-01-31

-- Add stripe_checkout_session_id column to track Stripe Checkout Sessions
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS stripe_checkout_session_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(255);

-- Add index for faster lookups by session ID
CREATE INDEX IF NOT EXISTS idx_orders_checkout_session 
ON orders(stripe_checkout_session_id);

CREATE INDEX IF NOT EXISTS idx_orders_payment_intent 
ON orders(stripe_payment_intent_id);

-- Add payment_confirmed_at timestamp
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS payment_confirmed_at TIMESTAMP;

-- Add tip support
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS tip_cents INT DEFAULT 0;
