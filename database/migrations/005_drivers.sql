-- Migration 005: Driver Management and GPS Tracking
-- Purpose: Enable driver registration, availability, location tracking, and order assignments

-- ============================================================================
-- DRIVERS TABLE (extends users table)
-- ============================================================================
CREATE TABLE IF NOT EXISTS drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Driver info
  vehicle_type VARCHAR(50) NOT NULL CHECK (vehicle_type IN ('car', 'bike', 'scooter', 'motorcycle')),
  vehicle_make VARCHAR(100),
  vehicle_model VARCHAR(100),
  vehicle_year INTEGER,
  license_plate VARCHAR(20),
  
  -- Documents
  drivers_license_number VARCHAR(50),
  drivers_license_verified BOOLEAN DEFAULT FALSE,
  insurance_verified BOOLEAN DEFAULT FALSE,
  background_check_verified BOOLEAN DEFAULT FALSE,
  
  -- Status
  verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected', 'suspended')),
  is_available BOOLEAN DEFAULT FALSE,
  
  -- Performance metrics
  total_deliveries INTEGER DEFAULT 0,
  successful_deliveries INTEGER DEFAULT 0,
  cancelled_deliveries INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0.00,
  total_ratings INTEGER DEFAULT 0,
  
  -- Current location (cached for quick queries)
  current_latitude DECIMAL(10, 8),
  current_longitude DECIMAL(11, 8),
  last_location_update TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Index for finding available drivers near a location
CREATE INDEX idx_drivers_availability ON drivers(is_available, verification_status) WHERE is_available = TRUE AND verification_status = 'approved';
CREATE INDEX idx_drivers_location ON drivers USING GIST (ll_to_earth(current_latitude, current_longitude)) WHERE is_available = TRUE;

-- ============================================================================
-- DRIVER LOCATIONS TABLE (GPS tracking history)
-- ============================================================================
CREATE TABLE IF NOT EXISTS driver_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  
  -- Optional metadata
  accuracy DECIMAL(10, 2), -- in meters
  speed DECIMAL(10, 2), -- in m/s
  heading DECIMAL(5, 2), -- in degrees
  
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for recent locations and spatial queries
CREATE INDEX idx_driver_locations_driver_time ON driver_locations(driver_id, recorded_at DESC);
CREATE INDEX idx_driver_locations_spatial ON driver_locations USING GIST (ll_to_earth(latitude, longitude));

-- ============================================================================
-- DRIVER ASSIGNMENTS TABLE (order → driver mapping)
-- ============================================================================
CREATE TABLE IF NOT EXISTS driver_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  
  -- Assignment details
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  
  -- Status tracking
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled', 'completed')),
  
  -- Distance/ETA at time of assignment
  distance_km DECIMAL(10, 2),
  estimated_pickup_time INTEGER, -- in minutes
  
  -- Decline reason (if declined)
  decline_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(order_id, driver_id)
);

-- Indexes for assignment queries
CREATE INDEX idx_driver_assignments_order ON driver_assignments(order_id);
CREATE INDEX idx_driver_assignments_driver ON driver_assignments(driver_id, status);
CREATE INDEX idx_driver_assignments_status ON driver_assignments(status, assigned_at);

-- ============================================================================
-- DRIVER LEDGER TABLE (earnings tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS driver_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  
  -- Earnings breakdown
  delivery_fee_cents INTEGER NOT NULL, -- What driver earned
  tip_cents INTEGER DEFAULT 0,
  total_earning_cents INTEGER NOT NULL,
  
  -- Payout tracking
  payout_status VARCHAR(20) DEFAULT 'pending' CHECK (payout_status IN ('pending', 'paid', 'failed')),
  payout_date TIMESTAMPTZ,
  payout_reference VARCHAR(255), -- Stripe transfer ID
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(order_id)
);

-- Index for payout queries
CREATE INDEX idx_driver_ledger_driver ON driver_ledger(driver_id, payout_status);
CREATE INDEX idx_driver_ledger_payout ON driver_ledger(payout_status, created_at);

-- ============================================================================
-- UPDATE ORDERS TABLE (add driver tracking fields)
-- ============================================================================
ALTER TABLE orders ADD COLUMN IF NOT EXISTS assigned_driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS estimated_delivery_time TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS actual_delivery_time TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_orders_assigned_driver ON orders(assigned_driver_id, status);

-- ============================================================================
-- TRIGGER: Update driver location cache
-- ============================================================================
CREATE OR REPLACE FUNCTION update_driver_location_cache()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE drivers
  SET 
    current_latitude = NEW.latitude,
    current_longitude = NEW.longitude,
    last_location_update = NEW.recorded_at,
    updated_at = NOW()
  WHERE id = NEW.driver_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_driver_location_cache
  AFTER INSERT ON driver_locations
  FOR EACH ROW
  EXECUTE FUNCTION update_driver_location_cache();

-- ============================================================================
-- TRIGGER: Update driver stats on assignment completion
-- ============================================================================
CREATE OR REPLACE FUNCTION update_driver_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE drivers
    SET 
      total_deliveries = total_deliveries + 1,
      successful_deliveries = successful_deliveries + 1,
      updated_at = NOW()
    WHERE id = NEW.driver_id;
  ELSIF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    UPDATE drivers
    SET 
      cancelled_deliveries = cancelled_deliveries + 1,
      updated_at = NOW()
    WHERE id = NEW.driver_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_driver_stats
  AFTER UPDATE ON driver_assignments
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION update_driver_stats();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Calculate distance between two points (Haversine formula)
CREATE OR REPLACE FUNCTION calculate_distance_km(
  lat1 DECIMAL, lon1 DECIMAL,
  lat2 DECIMAL, lon2 DECIMAL
)
RETURNS DECIMAL AS $$
DECLARE
  earth_radius DECIMAL := 6371; -- km
  dlat DECIMAL;
  dlon DECIMAL;
  a DECIMAL;
  c DECIMAL;
BEGIN
  dlat := radians(lat2 - lat1);
  dlon := radians(lon2 - lon1);
  
  a := sin(dlat/2) * sin(dlat/2) +
       cos(radians(lat1)) * cos(radians(lat2)) *
       sin(dlon/2) * sin(dlon/2);
  
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  
  RETURN earth_radius * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Find available drivers within radius
CREATE OR REPLACE FUNCTION find_available_drivers_near(
  target_lat DECIMAL,
  target_lon DECIMAL,
  radius_km DECIMAL DEFAULT 10
)
RETURNS TABLE (
  driver_id UUID,
  user_id UUID,
  distance_km DECIMAL,
  vehicle_type VARCHAR,
  average_rating DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.user_id,
    calculate_distance_km(target_lat, target_lon, d.current_latitude, d.current_longitude) AS distance,
    d.vehicle_type,
    d.average_rating
  FROM drivers d
  WHERE 
    d.is_available = TRUE
    AND d.verification_status = 'approved'
    AND d.current_latitude IS NOT NULL
    AND d.current_longitude IS NOT NULL
    AND calculate_distance_km(target_lat, target_lon, d.current_latitude, d.current_longitude) <= radius_km
  ORDER BY distance ASC, d.average_rating DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SEED DATA (for testing)
-- ============================================================================

-- Example: Create a test driver user
-- INSERT INTO users (email, password_hash, role, first_name, last_name, phone_number, email_verified)
-- VALUES ('driver@test.com', '$2b$10$...', 'driver', 'John', 'Driver', '+15555551234', TRUE);

COMMENT ON TABLE drivers IS 'Driver profiles with vehicle info and performance metrics';
COMMENT ON TABLE driver_locations IS 'GPS tracking history for real-time location updates';
COMMENT ON TABLE driver_assignments IS 'Tracks which driver is assigned to which order';
COMMENT ON TABLE driver_ledger IS 'Driver earnings and payout tracking';
