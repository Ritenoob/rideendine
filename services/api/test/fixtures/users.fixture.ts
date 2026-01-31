import { UserRole } from '../../src/common/interfaces/user.interface';

/**
 * User test fixtures
 * Provides consistent test data for user-related tests
 */

export const validCustomer = {
  id: 'customer-uuid-1',
  email: 'customer@example.com',
  password_hash: '$2b$10$hashedPasswordExample',
  role: UserRole.CUSTOMER,
  is_verified: true,
  verification_token: null,
  reset_token: null,
  reset_token_expires: null,
  stripe_customer_id: 'cus_test123',
  created_at: new Date('2026-01-01T00:00:00Z'),
  updated_at: new Date('2026-01-01T00:00:00Z'),
  first_name: 'John',
  last_name: 'Doe',
  phone: '+1234567890',
  avatar_url: 'https://example.com/avatars/customer1.jpg',
};

export const validChef = {
  id: 'chef-uuid-1',
  email: 'chef@example.com',
  password_hash: '$2b$10$hashedPasswordExample',
  role: UserRole.CHEF,
  is_verified: true,
  verification_token: null,
  reset_token: null,
  reset_token_expires: null,
  stripe_customer_id: null,
  created_at: new Date('2026-01-01T00:00:00Z'),
  updated_at: new Date('2026-01-01T00:00:00Z'),
  first_name: 'Gordon',
  last_name: 'Ramsay',
  phone: '+1234567891',
  avatar_url: 'https://example.com/avatars/chef1.jpg',
};

export const validDriver = {
  id: 'driver-uuid-1',
  email: 'driver@example.com',
  password_hash: '$2b$10$hashedPasswordExample',
  role: UserRole.DRIVER,
  is_verified: true,
  verification_token: null,
  reset_token: null,
  reset_token_expires: null,
  stripe_customer_id: null,
  created_at: new Date('2026-01-01T00:00:00Z'),
  updated_at: new Date('2026-01-01T00:00:00Z'),
  first_name: 'Speed',
  last_name: 'Racer',
  phone: '+1234567892',
  avatar_url: 'https://example.com/avatars/driver1.jpg',
};

export const unverifiedUser = {
  id: 'unverified-uuid-1',
  email: 'unverified@example.com',
  password_hash: '$2b$10$hashedPasswordExample',
  role: UserRole.CUSTOMER,
  is_verified: false,
  verification_token: 'verification-token-123',
  reset_token: null,
  reset_token_expires: null,
  stripe_customer_id: null,
  created_at: new Date('2026-01-01T00:00:00Z'),
  updated_at: new Date('2026-01-01T00:00:00Z'),
  first_name: null,
  last_name: null,
  phone: null,
  avatar_url: null,
};

export const adminUser = {
  id: 'admin-uuid-1',
  email: 'admin@ridendine.com',
  password_hash: '$2b$10$hashedPasswordExample',
  role: UserRole.ADMIN,
  is_verified: true,
  verification_token: null,
  reset_token: null,
  reset_token_expires: null,
  stripe_customer_id: null,
  created_at: new Date('2026-01-01T00:00:00Z'),
  updated_at: new Date('2026-01-01T00:00:00Z'),
  first_name: 'Admin',
  last_name: 'User',
  phone: '+1234567893',
  avatar_url: null,
};

export const validRegisterDto = {
  email: 'newuser@example.com',
  password: 'Test1234!',
  role: UserRole.CUSTOMER,
  firstName: 'New',
  lastName: 'User',
  phone: '+1234567894',
};

export const validLoginDto = {
  email: 'customer@example.com',
  password: 'Test1234!',
};

export const invalidLoginDto = {
  email: 'customer@example.com',
  password: 'WrongPassword123!',
};

export const validUpdateProfileDto = {
  firstName: 'Updated',
  lastName: 'Name',
  phone: '+9876543210',
  avatarUrl: 'https://example.com/new-avatar.jpg',
};

/**
 * Mock JWT tokens for testing
 */
export const mockTokens = {
  accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock-access-token',
  refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock-refresh-token',
};

/**
 * Mock JWT payload for testing
 */
export const mockJwtPayload = {
  sub: validCustomer.id,
  email: validCustomer.email,
  role: validCustomer.role,
};
