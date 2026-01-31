import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { Pool } from 'pg';
import { NotFoundException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  let db: Pool;

  const mockDb = {
    query: jest.fn(),
  };

  const mockUser = {
    id: 'user-id',
    email: 'test@example.com',
    role: 'customer',
    is_verified: true,
    stripe_customer_id: 'stripe-cust-id',
    created_at: new Date(),
    first_name: 'Test',
    last_name: 'User',
    phone: '+1234567890',
    avatar_url: 'https://example.com/avatar.jpg',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: 'DATABASE_POOL',
          useValue: mockDb,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    db = module.get<Pool>('DATABASE_POOL');

    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should return user profile with all fields', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [mockUser] });

      const result = await service.getProfile('user-id');

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('role');
      expect(result).toHaveProperty('isVerified');
      expect(result).toHaveProperty('stripe_customer_id');
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('profile');
      expect(result.id).toBe('user-id');
      expect(result.email).toBe('test@example.com');
      expect(result.role).toBe('customer');
      expect(result.isVerified).toBe(true);
      expect(result.profile.firstName).toBe('Test');
      expect(result.profile.lastName).toBe('User');
      expect(result.profile.phone).toBe('+1234567890');
      expect(result.profile.avatarUrl).toBe('https://example.com/avatar.jpg');
    });

    it('should throw NotFoundException if user not found', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      await expect(service.getProfile('non-existent-id')).rejects.toThrow(NotFoundException);
      await expect(service.getProfile('non-existent-id')).rejects.toThrow('User not found');
    });

    it('should handle user without profile', async () => {
      const userWithoutProfile = {
        ...mockUser,
        first_name: null,
        last_name: null,
        phone: null,
        avatar_url: null,
      };
      mockDb.query.mockResolvedValueOnce({ rows: [userWithoutProfile] });

      const result = await service.getProfile('user-id');

      expect(result.profile.firstName).toBeNull();
      expect(result.profile.lastName).toBeNull();
      expect(result.profile.phone).toBeNull();
      expect(result.profile.avatarUrl).toBeNull();
    });

    it('should query with correct SQL and parameters', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [mockUser] });

      await service.getProfile('user-id');

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT u.id, u.email, u.role'),
        ['user-id']
      );
    });
  });

  describe('updateProfile', () => {
    const updateProfileDto = {
      firstName: 'Updated',
      lastName: 'Name',
      phone: '+9876543210',
      avatarUrl: 'https://example.com/new-avatar.jpg',
    };

    it('should create new profile if it does not exist', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] }); // Profile does not exist
      mockDb.query.mockResolvedValueOnce({ rows: [] }); // Insert profile
      mockDb.query.mockResolvedValueOnce({ rows: [mockUser] }); // Get updated profile

      const result = await service.updateProfile('user-id', updateProfileDto);

      expect(mockDb.query).toHaveBeenCalledWith(
        'INSERT INTO user_profiles (user_id, first_name, last_name, phone, avatar_url) VALUES ($1, $2, $3, $4, $5)',
        ['user-id', updateProfileDto.firstName, updateProfileDto.lastName, updateProfileDto.phone, updateProfileDto.avatarUrl]
      );
      expect(result).toHaveProperty('id');
    });

    it('should update existing profile', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [{ id: 'profile-id' }] }); // Profile exists
      mockDb.query.mockResolvedValueOnce({ rows: [] }); // Update profile
      mockDb.query.mockResolvedValueOnce({ rows: [mockUser] }); // Get updated profile

      const result = await service.updateProfile('user-id', updateProfileDto);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE user_profiles'),
        expect.arrayContaining([
          updateProfileDto.firstName,
          updateProfileDto.lastName,
          updateProfileDto.phone,
          updateProfileDto.avatarUrl,
          'user-id',
        ])
      );
      expect(result).toHaveProperty('id');
    });

    it('should handle partial updates with undefined values', async () => {
      const partialUpdate = {
        firstName: 'New First',
      };
      mockDb.query.mockResolvedValueOnce({ rows: [{ id: 'profile-id' }] });
      mockDb.query.mockResolvedValueOnce({ rows: [] });
      mockDb.query.mockResolvedValueOnce({ rows: [mockUser] });

      await service.updateProfile('user-id', partialUpdate);

      const updateCall = mockDb.query.mock.calls.find(call =>
        call[0].includes('UPDATE user_profiles')
      );
      expect(updateCall).toBeDefined();
      expect(updateCall[1][0]).toBe('New First');
      expect(updateCall[1][1]).toBeUndefined();
    });

    it('should use COALESCE for partial updates', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [{ id: 'profile-id' }] });
      mockDb.query.mockResolvedValueOnce({ rows: [] });
      mockDb.query.mockResolvedValueOnce({ rows: [mockUser] });

      await service.updateProfile('user-id', updateProfileDto);

      const updateCall = mockDb.query.mock.calls.find(call => 
        call[0].includes('UPDATE user_profiles')
      );
      expect(updateCall[0]).toContain('COALESCE($1, first_name)');
      expect(updateCall[0]).toContain('COALESCE($2, last_name)');
      expect(updateCall[0]).toContain('COALESCE($3, phone)');
      expect(updateCall[0]).toContain('COALESCE($4, avatar_url)');
    });

    it('should update updated_at timestamp', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [{ id: 'profile-id' }] });
      mockDb.query.mockResolvedValueOnce({ rows: [] });
      mockDb.query.mockResolvedValueOnce({ rows: [mockUser] });

      await service.updateProfile('user-id', updateProfileDto);

      const updateCall = mockDb.query.mock.calls.find(call => 
        call[0].includes('UPDATE user_profiles')
      );
      expect(updateCall[0]).toContain('updated_at = NOW()');
    });

    it('should return updated profile', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [{ id: 'profile-id' }] });
      mockDb.query.mockResolvedValueOnce({ rows: [] });
      mockDb.query.mockResolvedValueOnce({ rows: [mockUser] });

      const result = await service.updateProfile('user-id', updateProfileDto);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('profile');
    });
  });

  describe('deleteAccount', () => {
    it('should delete user account', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      const result = await service.deleteAccount('user-id');

      expect(result).toHaveProperty('message');
      expect(result.message).toBe('Account deleted successfully');
      expect(mockDb.query).toHaveBeenCalledWith('DELETE FROM users WHERE id = $1', ['user-id']);
    });

    it('should handle database errors gracefully', async () => {
      mockDb.query.mockRejectedValueOnce(new Error('Database error'));

      await expect(service.deleteAccount('user-id')).rejects.toThrow('Database error');
    });
  });

  describe('updateStripeCustomerId', () => {
    it('should update stripe customer id for user', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      await service.updateStripeCustomerId('user-id', 'stripe-cust-123');

      expect(mockDb.query).toHaveBeenCalledWith(
        'UPDATE users SET stripe_customer_id = $1 WHERE id = $2',
        ['stripe-cust-123', 'user-id']
      );
    });

    it('should handle empty string customer id', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      await service.updateStripeCustomerId('user-id', '');

      expect(mockDb.query).toHaveBeenCalledWith(
        'UPDATE users SET stripe_customer_id = $1 WHERE id = $2',
        ['', 'user-id']
      );
    });
  });

  describe('findById', () => {
    it('should call getProfile with user id', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [mockUser] });

      const result = await service.findById('user-id');

      expect(result).toHaveProperty('id');
      expect(result.id).toBe('user-id');
    });

    it('should throw NotFoundException if user not found', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      await expect(service.findById('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });
});
