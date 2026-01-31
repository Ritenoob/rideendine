# RideNDine Database Schema Documentation

Complete database schema documentation for the RideNDine platform.

**Database:** PostgreSQL 16 with PostGIS 3.4
**Last Updated:** 2026-01-31
**Migrations:** 10 applied (001-010)

---

## Table of Contents

1. [Overview](#overview)
2. [Entity Relationship Diagram](#entity-relationship-diagram)
3. [Tables](#tables)
4. [Indexes](#indexes)
5. [Functions](#functions)
6. [Triggers](#triggers)
7. [Migration Strategy](#migration-strategy)
8. [Data Models](#data-models)

---

## Overview

### Database Statistics

- **Total Tables:** 25
- **Total Indexes:** 40+
- **Extensions:** uuid-ossp, postgis
- **Functions:** 10+ (geospatial, triggers)
- **Size:** ~50MB (empty), scales to 10GB+ with data

### Design Principles

1. **Normalization:** 3NF for most tables
2. **Performance:** Extensive indexing for common queries
3. **Geospatial:** PostGIS for location-based features
4. **Audit:** History tables for state changes
5. **Scalability:** Partition-ready for order tables

---

## Entity Relationship Diagram

```
┌──────────┐
│  users   │────┬────────────────────────────────┐
└──────────┘    │                                │
      │         │                                │
      │         │                                │
      ├─────────┼────────────┐                   │
      │         │            │                   │
      ↓         ↓            ↓                   ↓
┌──────────┐ ┌──────────┐ ┌──────────┐    ┌──────────┐
│customers │ │  chefs   │ │ drivers  │    │  admin   │
└────┬─────┘ └────┬─────┘ └────┬─────┘    │ actions  │
     │            │            │           └──────────┘
     │            │            │
     │            ├──────┐     │
     │            ↓      ↓     │
     │      ┌─────────┐ │     │
     │      │  menus  │ │     │
     │      └────┬────┘ │     │
     │           │      │     │
     │           ↓      │     │
     │     ┌───────────┐│     │
     │     │menu_items ││     │
     │     └───────────┘│     │
     │                  │     │
     │                  │     │
     ├──────────────────┼─────┤
     │                  │     │
     ↓                  ↓     ↓
┌──────────────────────────────────┐
│           orders                 │
├──────────────────────────────────┤
│ customer_id │ chef_id │driver_id│
└───────┬──────────────────────────┘
        │
        ├────────────┬──────────────┬─────────────┐
        ↓            ↓              ↓             ↓
┌──────────────┐ ┌────────────┐ ┌──────────┐ ┌──────────┐
│ order_items  │ │ payments   │ │ reviews  │ │order_    │
│              │ │            │ │          │ │status_   │
│              │ │            │ │          │ │history   │
└──────────────┘ └────────────┘ └──────────┘ └──────────┘
```

---

## Tables

### Core Tables

#### users

**Purpose:** Unified authentication table for all roles

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('customer', 'chef', 'driver', 'admin')),
  is_verified BOOLEAN DEFAULT FALSE,
  verification_token VARCHAR(255),
  reset_token VARCHAR(255),
  reset_token_expires TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Columns:**

- `id` - UUID primary key
- `email` - Unique email address (used for login)
- `password_hash` - bcrypt hash (10 rounds)
- `role` - User type (enforced by CHECK constraint)
- `is_verified` - Email verification status
- `verification_token` - Token for email verification
- `reset_token` - Token for password reset
- `reset_token_expires` - Expiry time for reset token
- `created_at` - Account creation timestamp
- `updated_at` - Last update timestamp (auto-updated by trigger)

**Indexes:**

- `idx_users_email` (email) - Fast login lookup
- `idx_users_role` (role) - Filter by user type

**Relationships:**

- Has one `user_profile`
- Has one `customer` (if role = customer)
- Has one `chef` (if role = chef)
- Has one `driver` (if role = driver)
- Has many `refresh_tokens`

---

#### user_profiles

**Purpose:** Extended user information

```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Relationships:**

- Belongs to one `user`

---

#### customers

**Purpose:** Customer-specific data

```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  default_address TEXT,
  default_latitude DECIMAL(10, 8),
  default_longitude DECIMAL(11, 8),
  stripe_customer_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Columns:**

- `default_latitude/longitude` - Home coordinates for quick chef search
- `stripe_customer_id` - Stripe customer ID for payment methods

**Relationships:**

- Belongs to one `user`
- Has many `customer_addresses`
- Has many `orders`

---

#### chefs

**Purpose:** Chef business profiles

```sql
CREATE TABLE chefs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  business_name VARCHAR(255),
  description TEXT,
  address TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  cuisine_types TEXT[],  -- Array: ['italian', 'mexican']
  stripe_account_id VARCHAR(255),
  stripe_onboarding_complete BOOLEAN DEFAULT FALSE,
  verification_status VARCHAR(50) DEFAULT 'pending'
    CHECK (verification_status IN ('pending', 'approved', 'rejected')),
  is_active BOOLEAN DEFAULT TRUE,
  rating DECIMAL(3, 2) DEFAULT 0.00,
  total_orders INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Key Features:**

- **Geospatial:** `latitude/longitude` for distance queries
- **Array:** `cuisine_types` stores multiple cuisines
- **Stripe:** `stripe_account_id` for Connect integration
- **Rating:** Denormalized for performance (recalculated on review)

**Indexes:**

- `idx_chefs_location` (GIST on ll_to_earth) - Geospatial queries
- `idx_chefs_rating` (rating DESC) - Sort by rating
- `idx_chefs_user_id` (user_id) - Join optimization

**Relationships:**

- Belongs to one `user`
- Has many `menus`
- Has many `chef_documents`
- Has many `orders`
- Has many `reviews` (as reviewee)

---

#### menus

**Purpose:** Menu containers (e.g., "Lunch Menu", "Dinner Menu")

```sql
CREATE TABLE menus (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chef_id UUID REFERENCES chefs(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  available_days INT[],  -- [0,1,2,3,4,5,6] for Sun-Sat
  available_from TIME,
  available_until TIME,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Columns:**

- `available_days` - Array of weekday numbers (0=Sunday)
- `available_from/until` - Time range for availability

**Relationships:**

- Belongs to one `chef`
- Has many `menu_items`

---

#### menu_items

**Purpose:** Individual dishes on a menu

```sql
CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  menu_id UUID REFERENCES menus(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price_cents INT NOT NULL,
  image_url TEXT,
  category VARCHAR(100),
  dietary_tags TEXT[],  -- ['vegetarian', 'vegan', 'gluten-free']
  is_available BOOLEAN DEFAULT TRUE,
  prep_time_minutes INT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Pricing:**

- All prices stored in cents (avoid floating point errors)
- Example: $15.99 → 1599 cents

**Relationships:**

- Belongs to one `menu`
- Referenced by many `order_items`

---

#### orders

**Purpose:** Order records with complete lifecycle tracking

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id),
  chef_id UUID REFERENCES chefs(id),
  driver_id UUID REFERENCES drivers(id),
  order_number VARCHAR(50) UNIQUE NOT NULL,  -- RND-20260131-0001
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'payment_confirmed', 'accepted', 'preparing',
    'ready_for_pickup', 'assigned_to_driver', 'picked_up',
    'in_transit', 'delivered', 'cancelled', 'refunded'
  )),

  -- Pricing (all in cents)
  subtotal_cents INT NOT NULL,
  tax_cents INT NOT NULL,
  delivery_fee_cents INT NOT NULL,
  platform_fee_cents INT NOT NULL,
  total_cents INT NOT NULL,
  chef_earning_cents INT NOT NULL,
  driver_earning_cents INT,

  -- Addresses
  pickup_address TEXT NOT NULL,
  pickup_latitude DECIMAL(10, 8),
  pickup_longitude DECIMAL(11, 8),
  delivery_address TEXT NOT NULL,
  delivery_latitude DECIMAL(10, 8),
  delivery_longitude DECIMAL(11, 8),

  -- Timing
  estimated_prep_time_minutes INT,
  estimated_delivery_time_minutes INT,
  scheduled_pickup_time TIMESTAMP,
  actual_pickup_time TIMESTAMP,
  estimated_delivery_time TIMESTAMP,
  actual_delivery_time TIMESTAMP,

  -- Special instructions
  customer_notes TEXT,
  driver_notes TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**State Machine:** 12 states (see ARCHITECTURE.md)

**Indexes:**

- `idx_orders_customer_id` - Customer order history
- `idx_orders_chef_id` - Chef order list
- `idx_orders_driver_id` - Driver delivery list
- `idx_orders_status` - Filter by status
- `idx_orders_created_at` - Sort by date

**Composite Indexes:**

- `idx_orders_customer_status` (customer_id, status)
- `idx_orders_chef_status` (chef_id, status)

**Relationships:**

- Belongs to one `customer`
- Belongs to one `chef`
- Belongs to one `driver` (nullable until assigned)
- Has many `order_items`
- Has one `payment`
- Has many `order_status_history`
- Has many `reviews`

---

#### order_items

**Purpose:** Line items for an order

```sql
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id),
  quantity INT NOT NULL,
  price_cents INT NOT NULL,  -- Snapshot at order time
  special_instructions TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Note:** `price_cents` is a snapshot to preserve historical pricing

---

#### drivers

**Purpose:** Driver profiles and current status

```sql
CREATE TABLE drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Vehicle info
  vehicle_type VARCHAR(50) NOT NULL
    CHECK (vehicle_type IN ('car', 'bike', 'scooter', 'motorcycle')),
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
  verification_status VARCHAR(20) DEFAULT 'pending'
    CHECK (verification_status IN ('pending', 'approved', 'rejected', 'suspended')),
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
```

**Key Features:**

- **Cached Location:** `current_latitude/longitude` updated by trigger
- **Metrics:** Denormalized for dashboard performance
- **Availability:** Real-time toggle for going online/offline

**Indexes:**

- `idx_drivers_availability` (PARTIAL) - Only available + approved drivers
- `idx_drivers_location` (GIST) - Geospatial queries

---

#### driver_locations

**Purpose:** GPS tracking history

```sql
CREATE TABLE driver_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy DECIMAL(10, 2),  -- meters
  speed DECIMAL(10, 2),      -- m/s
  heading DECIMAL(5, 2),     -- degrees
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Data Retention:** 30 days (cleanup job)

**Indexes:**

- `idx_driver_locations_driver_time` (driver_id, recorded_at DESC)
- `idx_driver_locations_spatial` (GIST)

**Trigger:** Automatically updates `drivers.current_latitude/longitude`

---

#### payments

**Purpose:** Stripe payment tracking

```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id),
  stripe_payment_intent_id VARCHAR(255) UNIQUE,
  stripe_charge_id VARCHAR(255),
  amount_cents INT NOT NULL,
  status VARCHAR(50) NOT NULL
    CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'refunded')),
  payment_method VARCHAR(50),
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Relationship:** One-to-one with `orders`

---

#### reviews

**Purpose:** Customer reviews for chefs and drivers

```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id),
  reviewer_id UUID REFERENCES users(id),
  reviewee_id UUID REFERENCES users(id),
  reviewee_type VARCHAR(50) CHECK (reviewee_type IN ('chef', 'driver')),
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Indexes:**

- `idx_reviews_order_id` - Prevent duplicate reviews
- `idx_reviews_reviewee` (reviewee_id, reviewee_type) - Calculate avg rating

**Constraint:** One review per order per reviewee type

---

## Indexes

### B-Tree Indexes

**Standard Indexes:**

```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_chefs_user_id ON chefs(user_id);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_chef_id ON orders(chef_id);
CREATE INDEX idx_orders_driver_id ON orders(driver_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
```

### Composite Indexes

**Optimized for common queries:**

```sql
CREATE INDEX idx_orders_customer_status ON orders(customer_id, status);
CREATE INDEX idx_orders_chef_status ON orders(chef_id, status);
CREATE INDEX idx_driver_assignments_driver_status
  ON driver_assignments(driver_id, status);
```

### Partial Indexes

**Filter at index creation:**

```sql
CREATE INDEX idx_drivers_available ON drivers(is_available, verification_status)
  WHERE is_available = TRUE AND verification_status = 'approved';
```

**Benefit:** Smaller index, faster queries for active drivers

### Geospatial Indexes (GiST)

**PostGIS indexes for location queries:**

```sql
CREATE INDEX idx_chefs_location
  ON chefs USING GIST (ll_to_earth(latitude, longitude));

CREATE INDEX idx_drivers_location
  ON drivers USING GIST (ll_to_earth(current_latitude, current_longitude))
  WHERE is_available = TRUE;

CREATE INDEX idx_driver_locations_spatial
  ON driver_locations USING GIST (ll_to_earth(latitude, longitude));
```

**Usage:**

```sql
-- Find chefs within 10km
SELECT * FROM chefs
WHERE earth_box(ll_to_earth(30.2672, -97.7431), 10000) @> ll_to_earth(latitude, longitude)
ORDER BY calculate_distance_km(30.2672, -97.7431, latitude, longitude);
```

---

## Functions

### Geospatial Functions

#### calculate_distance_km

**Purpose:** Calculate distance between two coordinates (Haversine formula)

```sql
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
```

**Usage:**

```sql
SELECT calculate_distance_km(30.2672, -97.7431, 30.2750, -97.7500);
-- Returns: 0.947 (km)
```

#### find_available_drivers_near

**Purpose:** Find available drivers within radius

```sql
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
```

---

## Triggers

### update_updated_at_column

**Purpose:** Auto-update `updated_at` timestamp on row modification

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chefs_updated_at
  BEFORE UPDATE ON chefs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ... (applied to 15+ tables)
```

### update_driver_location_cache

**Purpose:** Update driver's current location when GPS update received

```sql
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
```

**Benefit:** Avoids JOIN on location history for current position

---

## Migration Strategy

### Migration Files

**Location:** `database/migrations/`

**Naming:** `NNN_description.sql` (e.g., `001_initial_schema.sql`)

**Execution Order:**

1. `001_initial_schema.sql` - Core tables
2. `002_chef_enhancements.sql` - Chef features
3. `003_admin_actions.sql` - Admin audit log
4. `004_orders_enhancements.sql` - Order improvements
5. `005_drivers.sql` - Driver management
6. `006_phase4_admin_reviews.sql` - Reviews system
7. `006_platform_settings.sql` - Platform config
8. `008_add_spatial_indexes.sql` - Location indexes
9. `009_add_composite_indexes.sql` - Performance indexes
10. `010_mobile_app_tables.sql` - Mobile app tables

### Running Migrations

```bash
# Apply all migrations
npm run db:migrate

# Reset database (drop + recreate + migrate)
npm run db:reset

# Manual execution
psql -U ridendine -d ridendine -f database/migrations/001_initial_schema.sql
```

### Migration Best Practices

1. **Idempotent:** Use `IF NOT EXISTS` and `IF EXISTS`
2. **Reversible:** Include `DROP` statements for rollback
3. **Data Safe:** Never delete data without backup
4. **Tested:** Test on staging before production
5. **Versioned:** Sequential numbering

---

## Data Models

### Sample Queries

**Find chefs near customer:**

```sql
SELECT
  id,
  business_name,
  rating,
  calculate_distance_km(
    30.2672, -97.7431,  -- Customer coordinates
    latitude, longitude
  ) AS distance_km
FROM chefs
WHERE
  is_active = TRUE
  AND verification_status = 'approved'
  AND calculate_distance_km(30.2672, -97.7431, latitude, longitude) <= 10
ORDER BY distance_km ASC, rating DESC
LIMIT 20;
```

**Get order with full details:**

```sql
SELECT
  o.id,
  o.order_number,
  o.status,
  o.total_cents,
  c.first_name || ' ' || c.last_name AS customer_name,
  ch.business_name AS chef_name,
  d.first_name || ' ' || d.last_name AS driver_name,
  array_agg(
    json_build_object(
      'name', mi.name,
      'quantity', oi.quantity,
      'price', oi.price_cents
    )
  ) AS items
FROM orders o
JOIN customers cust ON o.customer_id = cust.id
JOIN user_profiles c ON cust.user_id = c.user_id
JOIN chefs chef ON o.chef_id = chef.id
JOIN user_profiles ch ON chef.user_id = ch.user_id
LEFT JOIN drivers dr ON o.driver_id = dr.id
LEFT JOIN user_profiles d ON dr.user_id = d.user_id
JOIN order_items oi ON o.id = oi.order_id
JOIN menu_items mi ON oi.menu_item_id = mi.id
WHERE o.id = 'order-uuid'
GROUP BY o.id, c.first_name, c.last_name, ch.business_name, d.first_name, d.last_name;
```

**Driver earnings summary:**

```sql
SELECT
  d.id,
  up.first_name || ' ' || up.last_name AS driver_name,
  COUNT(da.id) AS total_deliveries,
  SUM(dl.total_earning_cents) AS total_earnings_cents,
  SUM(CASE WHEN dl.payout_status = 'pending' THEN dl.total_earning_cents ELSE 0 END) AS pending_payout_cents
FROM drivers d
JOIN user_profiles up ON d.user_id = up.user_id
LEFT JOIN driver_assignments da ON d.id = da.driver_id AND da.status = 'completed'
LEFT JOIN driver_ledger dl ON da.order_id = dl.order_id
WHERE d.id = 'driver-uuid'
GROUP BY d.id, up.first_name, up.last_name;
```

---

## Backup & Restore

### Backup

```bash
# Full database backup
pg_dump -U ridendine ridendine > backup_$(date +%Y%m%d).sql

# Schema only
pg_dump -U ridendine ridendine --schema-only > schema.sql

# Data only
pg_dump -U ridendine ridendine --data-only > data.sql
```

### Restore

```bash
# Restore from backup
psql -U ridendine ridendine < backup_20260131.sql

# Restore to new database
createdb ridendine_staging
psql -U ridendine ridendine_staging < backup_20260131.sql
```

---

## Performance Tuning

### Query Optimization

**Use EXPLAIN ANALYZE:**

```sql
EXPLAIN ANALYZE
SELECT * FROM chefs
WHERE calculate_distance_km(30.2672, -97.7431, latitude, longitude) <= 10;
```

**Check index usage:**

```sql
SELECT * FROM pg_stat_user_indexes WHERE schemaname = 'public';
```

### Connection Pooling

**Recommended Settings:**

- `max_connections = 100`
- `shared_buffers = 256MB`
- `effective_cache_size = 1GB`
- `work_mem = 4MB`

---

**Document Status:** ✅ Complete
**Maintainer:** Database Team
**Next Review:** 2026-02-15
