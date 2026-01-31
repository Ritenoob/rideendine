import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { Pool } from 'pg';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let db: Pool;
  let jwtService: JwtService;

  const mockDb = {
    query: jest.fn(),
    connect: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockClient = {
    query: jest.fn(),
    release: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: 'DATABASE_POOL',
          useValue: mockDb,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    db = module.get<Pool>('DATABASE_POOL');
    jwtService = module.get<JwtService>(JwtService);

    // Reset mocks
    jest.clearAllMocks();
    mockDb.connect.mockResolvedValue(mockClient);
  });

  describe('register', () => {
    const registerDto = {
      email: 'test@example.com',
      password: 'Test1234!',
      role: 'customer',
      firstName: 'Test',
      lastName: 'User',
      phone: '+1234567890',
    };

    it('should successfully register a new user', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] }); // No existing user
      mockClient.query.mockResolvedValueOnce({ rows: [{ id: 'user-id', email: registerDto.email, role: registerDto.role, is_verified: false, created_at: new Date() }] }); // Insert user
      mockClient.query.mockResolvedValueOnce({ rows: [] }); // Insert profile
      mockClient.query.mockResolvedValueOnce({ rows: [] }); // Insert customer

      const result = await service.register(registerDto);

      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe(registerDto.email);
      expect(result.user.role).toBe(registerDto.role);
      expect(mockDb.query).toHaveBeenCalledWith('SELECT id FROM users WHERE email = $1', [registerDto.email]);
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    });

    it('should throw ConflictException if email already exists', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [{ id: 'existing-id' }] });

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
      await expect(service.register(registerDto)).rejects.toThrow('Email already registered');
    });

    it('should hash password with bcrypt', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] });
      mockClient.query.mockResolvedValueOnce({ rows: [{ id: 'user-id', email: registerDto.email, role: registerDto.role, is_verified: false, created_at: new Date() }] });
      mockClient.query.mockResolvedValueOnce({ rows: [] });
      mockClient.query.mockResolvedValueOnce({ rows: [] });

      await service.register(registerDto);

      const insertCall = mockClient.query.mock.calls.find(call => 
        call[0].includes('INSERT INTO users')
      );
      expect(insertCall).toBeDefined();
      const passwordHash = insertCall[1][1];
      expect(passwordHash).not.toBe(registerDto.password);
    });

    it('should create role-specific record for chef', async () => {
      const chefDto = { ...registerDto, role: 'chef' as const };
      mockDb.query.mockResolvedValueOnce({ rows: [] });
      mockClient.query.mockResolvedValueOnce({ rows: [{ id: 'user-id', email: chefDto.email, role: chefDto.role, is_verified: false, created_at: new Date() }] });
      mockClient.query.mockResolvedValueOnce({ rows: [] });
      mockClient.query.mockResolvedValueOnce({ rows: [] });

      await service.register(chefDto);

      const chefInsertCall = mockClient.query.mock.calls.find(call => 
        call[0].includes('INSERT INTO chefs')
      );
      expect(chefInsertCall).toBeDefined();
    });

    it('should create role-specific record for driver', async () => {
      const driverDto = { ...registerDto, role: 'driver' as const };
      mockDb.query.mockResolvedValueOnce({ rows: [] });
      mockClient.query.mockResolvedValueOnce({ rows: [{ id: 'user-id', email: driverDto.email, role: driverDto.role, is_verified: false, created_at: new Date() }] });
      mockClient.query.mockResolvedValueOnce({ rows: [] });
      mockClient.query.mockResolvedValueOnce({ rows: [] });

      await service.register(driverDto);

      const driverInsertCall = mockClient.query.mock.calls.find(call => 
        call[0].includes('INSERT INTO drivers')
      );
      expect(driverInsertCall).toBeDefined();
    });

    it('should rollback transaction on error', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] });
      mockClient.query.mockRejectedValueOnce(new Error('Database error'));

      await expect(service.register(registerDto)).rejects.toThrow();
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });

    it('should not insert profile if no profile data provided', async () => {
      const minimalDto = {
        email: 'test@example.com',
        password: 'Test1234!',
        role: 'customer' as const,
      };
      mockDb.query.mockResolvedValueOnce({ rows: [] });
      mockClient.query.mockResolvedValueOnce({ rows: [{ id: 'user-id', email: minimalDto.email, role: minimalDto.role, is_verified: false, created_at: new Date() }] });
      mockClient.query.mockResolvedValueOnce({ rows: [] });

      await service.register(minimalDto);

      const profileInsertCall = mockClient.query.mock.calls.find(call => 
        call[0].includes('INSERT INTO user_profiles')
      );
      expect(profileInsertCall).toBeUndefined();
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'Test1234!',
    };

    const mockUser = {
      id: 'user-id',
      email: loginDto.email,
      password_hash: 'hashed-password',
      role: 'customer',
      is_verified: true,
      first_name: 'Test',
      last_name: 'User',
      phone: '+1234567890',
      avatar_url: null,
    };

    it('should successfully login with valid credentials', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [mockUser] });
      jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(true as never);
      mockJwtService.sign.mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe(loginDto.email);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT u.*, p.first_name'),
        [loginDto.email]
      );
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(loginDto)).rejects.toThrow('Invalid credentials');
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [mockUser] });
      jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(false as never);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(loginDto)).rejects.toThrow('Invalid credentials');
    });

    it('should generate both access and refresh tokens', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [mockUser] });
      jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(true as never);
      mockJwtService.sign.mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');

      const result = await service.login(loginDto);

      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(mockJwtService.sign).toHaveBeenCalledTimes(2);
    });

    it('should include user profile in response', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [mockUser] });
      jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(true as never);
      mockJwtService.sign.mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');

      const result = await service.login(loginDto);

      expect(result.user.profile).toBeDefined();
      expect(result.user.profile.firstName).toBe('Test');
      expect(result.user.profile.lastName).toBe('User');
      expect(result.user.profile.phone).toBe('+1234567890');
    });
  });

  describe('refreshTokens', () => {
    const refreshTokenDto = {
      refreshToken: 'valid-refresh-token',
    };

    const mockPayload = {
      sub: 'user-id',
      email: 'test@example.com',
      role: 'customer',
    };

    const mockUser = {
      id: 'user-id',
      email: 'test@example.com',
      role: 'customer',
    };

    it('should successfully refresh tokens with valid refresh token', async () => {
      mockJwtService.verify.mockReturnValueOnce(mockPayload);
      mockDb.query.mockResolvedValueOnce({ rows: [{ token: refreshTokenDto.refreshToken }] });
      mockDb.query.mockResolvedValueOnce({ rows: [mockUser] });
      mockDb.query.mockResolvedValueOnce({ rows: [] });
      mockJwtService.sign.mockReturnValueOnce('new-access-token').mockReturnValueOnce('new-refresh-token');

      const result = await service.refreshTokens(refreshTokenDto);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(mockDb.query).toHaveBeenCalledWith(
        'DELETE FROM refresh_tokens WHERE token = $1',
        [refreshTokenDto.refreshToken]
      );
    });

    it('should throw UnauthorizedException if refresh token is invalid', async () => {
      mockJwtService.verify.mockImplementationOnce(() => {
        throw new Error('Invalid token');
      });

      await expect(service.refreshTokens(refreshTokenDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if token not found in database', async () => {
      mockJwtService.verify.mockReturnValueOnce(mockPayload);
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      await expect(service.refreshTokens(refreshTokenDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockJwtService.verify.mockReturnValueOnce(mockPayload);
      mockDb.query.mockResolvedValueOnce({ rows: [{ token: refreshTokenDto.refreshToken }] });
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      await expect(service.refreshTokens(refreshTokenDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should delete old refresh token', async () => {
      mockJwtService.verify.mockReturnValueOnce(mockPayload);
      mockDb.query.mockResolvedValueOnce({ rows: [{ token: refreshTokenDto.refreshToken }] });
      mockDb.query.mockResolvedValueOnce({ rows: [mockUser] });
      mockDb.query.mockResolvedValueOnce({ rows: [] });
      mockJwtService.sign.mockReturnValueOnce('new-access-token').mockReturnValueOnce('new-refresh-token');

      await service.refreshTokens(refreshTokenDto);

      expect(mockDb.query).toHaveBeenCalledWith(
        'DELETE FROM refresh_tokens WHERE token = $1',
        [refreshTokenDto.refreshToken]
      );
    });
  });

  describe('verifyEmail', () => {
    const verifyEmailDto = {
      token: 'valid-verification-token',
    };

    it('should successfully verify email with valid token', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [{ id: 'user-id', email: 'test@example.com' }],
      });

      const result = await service.verifyEmail(verifyEmailDto);

      expect(result).toHaveProperty('message');
      expect(result.message).toBe('Email verified successfully');
      expect(result).toHaveProperty('user');
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users SET is_verified = TRUE'),
        [verifyEmailDto.token]
      );
    });

    it('should throw UnauthorizedException if token is invalid', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      await expect(service.verifyEmail(verifyEmailDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.verifyEmail(verifyEmailDto)).rejects.toThrow('Invalid verification token');
    });
  });

  describe('forgotPassword', () => {
    const forgotPasswordDto = {
      email: 'test@example.com',
    };

    it('should generate reset token and update user', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      const result = await service.forgotPassword(forgotPasswordDto);

      expect(result).toHaveProperty('message');
      expect(result.message).toBe('Password reset email sent');
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users SET reset_token ='),
        expect.any(String),
        expect.any(Date),
        [forgotPasswordDto.email]
      );
    });

    it('should set reset token expiry to 1 hour', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      await service.forgotPassword(forgotPasswordDto);

      const updateCall = mockDb.query.mock.calls.find(call => 
        call[0].includes('UPDATE users SET reset_token =')
      );
      expect(updateCall).toBeDefined();
      const expiresAt = updateCall[1][2];
      const expectedExpiry = new Date(Date.now() + 3600000);
      expect(expiresAt.getTime()).toBeCloseTo(expectedExpiry.getTime(), -3);
    });
  });

  describe('resetPassword', () => {
    const resetPasswordDto = {
      token: 'valid-reset-token',
      newPassword: 'NewPassword123!',
    };

    it('should successfully reset password with valid token', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [{ id: 'user-id' }] });
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      const result = await service.resetPassword(resetPasswordDto);

      expect(result).toHaveProperty('message');
      expect(result.message).toBe('Password reset successfully');
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users SET password_hash ='),
        expect.any(String),
        null,
        null,
        ['user-id']
      );
    });

    it('should throw UnauthorizedException if token is invalid', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      await expect(service.resetPassword(resetPasswordDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.resetPassword(resetPasswordDto)).rejects.toThrow('Invalid or expired reset token');
    });

    it('should hash new password', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [{ id: 'user-id' }] });
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      await service.resetPassword(resetPasswordDto);

      const updateCall = mockDb.query.mock.calls.find(call => 
        call[0].includes('UPDATE users SET password_hash =')
      );
      expect(updateCall).toBeDefined();
      const passwordHash = updateCall[1][1];
      expect(passwordHash).not.toBe(resetPasswordDto.newPassword);
    });

    it('should delete all refresh tokens for user', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [{ id: 'user-id' }] });
      mockDb.query.mockResolvedValueOnce({ rows: [] });
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      await service.resetPassword(resetPasswordDto);

      expect(mockDb.query).toHaveBeenCalledWith(
        'DELETE FROM refresh_tokens WHERE user_id = $1',
        ['user-id']
      );
    });
  });

  describe('logout', () => {
    it('should successfully logout user', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      const result = await service.logout('user-id', 'refresh-token');

      expect(result).toHaveProperty('message');
      expect(result.message).toBe('Logged out successfully');
      expect(mockDb.query).toHaveBeenCalledWith(
        'DELETE FROM refresh_tokens WHERE user_id = $1 AND token = $2',
        ['user-id', 'refresh-token']
      );
    });
  });

  describe('generateTokens (private)', () => {
    const mockUser = {
      id: 'user-id',
      email: 'test@example.com',
      role: 'customer',
    };

    it('should generate access token with correct payload', async () => {
      mockJwtService.sign.mockReturnValueOnce('access-token');
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      await service['generateTokens'](mockUser);

      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      });
    });

    it('should generate refresh token with correct secret and expiry', async () => {
      mockJwtService.sign.mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      await service['generateTokens'](mockUser);

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        {
          sub: mockUser.id,
          email: mockUser.email,
          role: mockUser.role,
        },
        {
          secret: process.env.REFRESH_TOKEN_SECRET,
          expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
        }
      );
    });

    it('should store refresh token in database', async () => {
      mockJwtService.sign.mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      await service['generateTokens'](mockUser);

      expect(mockDb.query).toHaveBeenCalledWith(
        'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
        [mockUser.id, 'refresh-token', expect.any(Date)]
      );
    });
  });
});
