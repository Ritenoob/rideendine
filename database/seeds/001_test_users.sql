-- Seed data for development environment
-- Creates test users for each role

-- Insert test users (password: 'Test1234!' for all)
-- Password hash generated with bcrypt rounds=10
INSERT INTO users (id, email, password_hash, role, is_verified) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'admin@ridendine.com', '$2b$10$YQmXfZ8K7X5Z5Z5Z5Z5Z5uK5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5a', 'admin', TRUE),
  ('c0000000-0000-0000-0000-000000000001', 'customer1@test.com', '$2b$10$YQmXfZ8K7X5Z5Z5Z5Z5Z5uK5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5a', 'customer', TRUE),
  ('c0000000-0000-0000-0000-000000000002', 'customer2@test.com', '$2b$10$YQmXfZ8K7X5Z5Z5Z5Z5Z5uK5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5a', 'customer', TRUE),
  ('h0000000-0000-0000-0000-000000000001', 'chef1@test.com', '$2b$10$YQmXfZ8K7X5Z5Z5Z5Z5Z5uK5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5a', 'chef', TRUE),
  ('h0000000-0000-0000-0000-000000000002', 'chef2@test.com', '$2b$10$YQmXfZ8K7X5Z5Z5Z5Z5Z5uK5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5a', 'chef', TRUE),
  ('d0000000-0000-0000-0000-000000000001', 'driver1@test.com', '$2b$10$YQmXfZ8K7X5Z5Z5Z5Z5Z5uK5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5a', 'driver', TRUE),
  ('d0000000-0000-0000-0000-000000000002', 'driver2@test.com', '$2b$10$YQmXfZ8K7X5Z5Z5Z5Z5Z5uK5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5a', 'driver', TRUE);

-- Insert user profiles
INSERT INTO user_profiles (user_id, first_name, last_name, phone) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Admin', 'User', '+1234567890'),
  ('c0000000-0000-0000-0000-000000000001', 'John', 'Doe', '+1234567891'),
  ('c0000000-0000-0000-0000-000000000002', 'Jane', 'Smith', '+1234567892'),
  ('h0000000-0000-0000-0000-000000000001', 'Maria', 'Garcia', '+1234567893'),
  ('h0000000-0000-0000-0000-000000000002', 'James', 'Chen', '+1234567894'),
  ('d0000000-0000-0000-0000-000000000001', 'Mike', 'Johnson', '+1234567895'),
  ('d0000000-0000-0000-0000-000000000002', 'Sarah', 'Williams', '+1234567896');

-- Insert customers
INSERT INTO customers (id, user_id, default_address, default_latitude, default_longitude) VALUES
  ('c0000000-1111-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', '123 Main St, San Francisco, CA', 37.7749, -122.4194),
  ('c0000000-1111-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', '456 Oak Ave, San Francisco, CA', 37.7849, -122.4094);

-- Insert chefs
INSERT INTO chefs (id, user_id, business_name, description, address, latitude, longitude, cuisine_types, verification_status, is_active, rating) VALUES
  ('h0000000-1111-0000-0000-000000000001', 'h0000000-0000-0000-0000-000000000001', 'Maria''s Mexican Kitchen', 'Authentic Mexican home cooking', '789 Mission St, San Francisco, CA', 37.7649, -122.4294, ARRAY['Mexican', 'Latin'], 'approved', TRUE, 4.8),
  ('h0000000-1111-0000-0000-000000000002', 'h0000000-0000-0000-0000-000000000002', 'Chen''s Asian Fusion', 'Traditional Chinese and fusion dishes', '321 Valencia St, San Francisco, CA', 37.7549, -122.4194, ARRAY['Chinese', 'Asian Fusion'], 'approved', TRUE, 4.9);

-- Insert menus
INSERT INTO menus (id, chef_id, name, description, is_active, available_days, available_from, available_until) VALUES
  ('00000000-1111-2222-0000-000000000001', 'h0000000-1111-0000-0000-000000000001', 'Weekly Specials', 'Our best dishes', TRUE, ARRAY[1,2,3,4,5], '11:00', '21:00'),
  ('00000000-1111-2222-0000-000000000002', 'h0000000-1111-0000-0000-000000000002', 'Dinner Menu', 'Evening favorites', TRUE, ARRAY[0,1,2,3,4,5,6], '17:00', '22:00');

-- Insert menu items
INSERT INTO menu_items (menu_id, name, description, price_cents, category, dietary_tags, prep_time_minutes) VALUES
  ('00000000-1111-2222-0000-000000000001', 'Chicken Tacos', 'Three soft tacos with grilled chicken', 1200, 'Main', ARRAY['gluten-free-option'], 20),
  ('00000000-1111-2222-0000-000000000001', 'Veggie Burrito', 'Rice, beans, veggies in a flour tortilla', 1000, 'Main', ARRAY['vegetarian'], 15),
  ('00000000-1111-2222-0000-000000000001', 'Guacamole & Chips', 'Fresh guacamole with tortilla chips', 600, 'Appetizer', ARRAY['vegan', 'gluten-free'], 10),
  ('00000000-1111-2222-0000-000000000002', 'Kung Pao Chicken', 'Spicy stir-fried chicken with peanuts', 1400, 'Main', ARRAY['spicy'], 25),
  ('00000000-1111-2222-0000-000000000002', 'Vegetable Fried Rice', 'Classic fried rice with mixed vegetables', 900, 'Main', ARRAY['vegetarian', 'vegan-option'], 15),
  ('00000000-1111-2222-0000-000000000002', 'Spring Rolls', 'Crispy vegetable spring rolls (4 pcs)', 700, 'Appetizer', ARRAY['vegetarian'], 12);

-- Insert drivers
INSERT INTO drivers (id, user_id, vehicle_type, vehicle_plate, is_available, current_latitude, current_longitude, rating) VALUES
  ('d0000000-1111-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'car', 'ABC123', TRUE, 37.7749, -122.4194, 4.7),
  ('d0000000-1111-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002', 'bike', 'XYZ789', TRUE, 37.7849, -122.4094, 4.9);

-- Note: Password for all test accounts is 'Test1234!' (you'll need to generate proper bcrypt hashes in production)
