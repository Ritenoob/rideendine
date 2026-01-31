import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { Pool } from 'pg';

describe('Auth Endpoints (e2e)', () => {
  let app: INestApplication;
  let db: Pool;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    await app.init();

    db = app.get<Pool>('DATABASE_POOL');
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up test data
    await db.query(
      'DELETE FROM refresh_tokens WHERE user_id IN (SELECT id FROM users WHERE email LIKE $1)',
      ['test-%@example.com'],
    );
    await db.query(
      'DELETE FROM user_profiles WHERE user_id IN (SELECT id FROM users WHERE email LIKE $1)',
      ['test-%@example.com'],
    );
    await db.query(
      'DELETE FROM customers WHERE user_id IN (SELECT id FROM users WHERE email LIKE $1)',
      ['test-%@example.com'],
    );
    await db.query(
      'DELETE FROM chefs WHERE user_id IN (SELECT id FROM users WHERE email LIKE $1)',
      ['test-%@example.com'],
    );
    await db.query(
      'DELETE FROM drivers WHERE user_id IN (SELECT id FROM users WHERE email LIKE $1)',
      ['test-%@example.com'],
    );
    await db.query('DELETE FROM users WHERE email LIKE $1', ['test-%@example.com']);
  });

  describe('POST /auth/register', () => {
    it('should register a new customer', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test-register@example.com',
          password: 'Test1234!',
          role: 'customer',
          firstName: 'Test',
          lastName: 'User',
          phone: '+1234567890',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(res.body).toHaveProperty('user');
          expect(res.body.user).toHaveProperty('id');
          expect(res.body.user).toHaveProperty('email');
          expect(res.body.user).toHaveProperty('role');
          expect(res.body.user).toHaveProperty('isVerified');
          expect(res.body.user.email).toBe('test-register@example.com');
          expect(res.body.user.role).toBe('customer');
        });
    });

    it('should register a new chef', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test-chef@example.com',
          password: 'Test1234!',
          role: 'chef',
          firstName: 'Chef',
          lastName: 'Name',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.user.role).toBe('chef');
        });
    });

    it('should register a new driver', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test-driver@example.com',
          password: 'Test1234!',
          role: 'driver',
          firstName: 'Driver',
          lastName: 'Name',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.user.role).toBe('driver');
        });
    });

    it('should fail with duplicate email', async () => {
      const userData = {
        email: 'test-duplicate@example.com',
        password: 'Test1234!',
        role: 'customer' as const,
        firstName: 'Test',
        lastName: 'User',
      };

      // First registration
      await request(app.getHttpServer()).post('/auth/register').send(userData).expect(201);

      // Second registration with same email
      return request(app.getHttpServer())
        .post('/auth/register')
        .send(userData)
        .expect(409)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(res.body.message).toContain('already registered');
        });
    });

    it('should fail with invalid email format', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'invalid-email',
          password: 'Test1234!',
          role: 'customer',
        })
        .expect(400);
    });

    it('should fail with weak password', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test-weak@example.com',
          password: 'weak',
          role: 'customer',
        })
        .expect(400);
    });

    it('should fail with invalid role', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test-invalid-role@example.com',
          password: 'Test1234!',
          role: 'invalid-role',
        })
        .expect(400);
    });

    it('should fail with missing required fields', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test-missing@example.com',
        })
        .expect(400);
    });
  });

  describe('POST /auth/login', () => {
    let registeredUser: any;

    beforeEach(async () => {
      const res = await request(app.getHttpServer()).post('/auth/register').send({
        email: 'test-login@example.com',
        password: 'Test1234!',
        role: 'customer',
        firstName: 'Test',
        lastName: 'User',
      });
      registeredUser = res.body.user;
    });

    it('should login with valid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test-login@example.com',
          password: 'Test1234!',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('refreshToken');
          expect(res.body).toHaveProperty('user');
          expect(res.body.user).toHaveProperty('id');
          expect(res.body.user).toHaveProperty('email');
          expect(res.body.user).toHaveProperty('role');
          expect(res.body.user.email).toBe('test-login@example.com');
        });
    });

    it('should fail with invalid email', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Test1234!',
        })
        .expect(401)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(res.body.message).toContain('Invalid credentials');
        });
    });

    it('should fail with invalid password', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test-login@example.com',
          password: 'WrongPassword123!',
        })
        .expect(401)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(res.body.message).toContain('Invalid credentials');
        });
    });

    it('should fail with missing email', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          password: 'Test1234!',
        })
        .expect(400);
    });

    it('should fail with missing password', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test-login@example.com',
        })
        .expect(400);
    });
  });

  describe('POST /auth/refresh', () => {
    let refreshToken: string;

    beforeEach(async () => {
      // Register and login to get refresh token
      await request(app.getHttpServer()).post('/auth/register').send({
        email: 'test-refresh@example.com',
        password: 'Test1234!',
        role: 'customer',
      });

      const loginRes = await request(app.getHttpServer()).post('/auth/login').send({
        email: 'test-refresh@example.com',
        password: 'Test1234!',
      });

      refreshToken = loginRes.body.refreshToken;
    });

    it('should refresh tokens with valid refresh token', () => {
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('refreshToken');
          expect(res.body.accessToken).toBeDefined();
          expect(res.body.refreshToken).toBeDefined();
        });
    });

    it('should fail with invalid refresh token', () => {
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);
    });

    it('should fail with missing refresh token', () => {
      return request(app.getHttpServer()).post('/auth/refresh').send({}).expect(400);
    });
  });

  describe('POST /auth/verify-email', () => {
    let verificationToken: string;

    beforeEach(async () => {
      // Register a user
      const registerRes = await request(app.getHttpServer()).post('/auth/register').send({
        email: 'test-verify@example.com',
        password: 'Test1234!',
        role: 'customer',
      });

      // Get verification token from database
      const userRes = await db.query('SELECT verification_token FROM users WHERE email = $1', [
        'test-verify@example.com',
      ]);
      verificationToken = userRes.rows[0].verification_token;
    });

    it('should verify email with valid token', () => {
      return request(app.getHttpServer())
        .post('/auth/verify-email')
        .send({ token: verificationToken })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(res.body.message).toContain('verified successfully');
        });
    });

    it('should fail with invalid token', () => {
      return request(app.getHttpServer())
        .post('/auth/verify-email')
        .send({ token: 'invalid-token' })
        .expect(401);
    });

    it('should fail with missing token', () => {
      return request(app.getHttpServer()).post('/auth/verify-email').send({}).expect(400);
    });
  });

  describe('POST /auth/forgot-password', () => {
    beforeEach(async () => {
      await request(app.getHttpServer()).post('/auth/register').send({
        email: 'test-forgot@example.com',
        password: 'Test1234!',
        role: 'customer',
      });
    });

    it('should send password reset email', () => {
      return request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: 'test-forgot@example.com' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(res.body.message).toContain('Password reset email sent');
        });
    });

    it('should still return success for non-existent email (security)', () => {
      return request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(200);
    });

    it('should fail with missing email', () => {
      return request(app.getHttpServer()).post('/auth/forgot-password').send({}).expect(400);
    });
  });

  describe('POST /auth/reset-password', () => {
    let resetToken: string;

    beforeEach(async () => {
      // Register a user
      await request(app.getHttpServer()).post('/auth/register').send({
        email: 'test-reset@example.com',
        password: 'Test1234!',
        role: 'customer',
      });

      // Request password reset
      await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: 'test-reset@example.com' });

      // Get reset token from database
      const userRes = await db.query('SELECT reset_token FROM users WHERE email = $1', [
        'test-reset@example.com',
      ]);
      resetToken = userRes.rows[0].reset_token;
    });

    it('should reset password with valid token', () => {
      return request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({
          token: resetToken,
          newPassword: 'NewPassword123!',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(res.body.message).toContain('Password reset successfully');
        });
    });

    it('should fail with invalid token', () => {
      return request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({
          token: 'invalid-token',
          newPassword: 'NewPassword123!',
        })
        .expect(401);
    });

    it('should fail with weak new password', () => {
      return request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({
          token: resetToken,
          newPassword: 'weak',
        })
        .expect(400);
    });

    it('should fail with missing token', () => {
      return request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({ newPassword: 'NewPassword123!' })
        .expect(400);
    });

    it('should fail with missing new password', () => {
      return request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({ token: resetToken })
        .expect(400);
    });
  });

  describe('POST /auth/logout', () => {
    let accessToken: string;
    let refreshToken: string;

    beforeEach(async () => {
      // Register and login
      await request(app.getHttpServer()).post('/auth/register').send({
        email: 'test-logout@example.com',
        password: 'Test1234!',
        role: 'customer',
      });

      const loginRes = await request(app.getHttpServer()).post('/auth/login').send({
        email: 'test-logout@example.com',
        password: 'Test1234!',
      });

      accessToken = loginRes.body.accessToken;
      refreshToken = loginRes.body.refreshToken;
    });

    it('should logout successfully', () => {
      return request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(res.body.message).toContain('Logged out successfully');
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer()).post('/auth/logout').send({ refreshToken }).expect(401);
    });
  });
});
