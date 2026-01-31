import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { Pool } from 'pg';

describe('Users Endpoints (e2e)', () => {
  let app: INestApplication;
  let db: Pool;
  let accessToken: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    await app.init();

    db = app.get<Pool>('DATABASE_POOL');

    // Register and login a test user
    await request(app.getHttpServer()).post('/auth/register').send({
      email: 'test-users@example.com',
      password: 'Test1234!',
      role: 'customer',
      firstName: 'Test',
      lastName: 'User',
    });

    const loginRes = await request(app.getHttpServer()).post('/auth/login').send({
      email: 'test-users@example.com',
      password: 'Test1234!',
    });

    accessToken = loginRes.body.accessToken;
    userId = loginRes.body.user.id;
  });

  afterAll(async () => {
    // Clean up test data
    await db.query(
      'DELETE FROM refresh_tokens WHERE user_id IN (SELECT id FROM users WHERE email LIKE $1)',
      ['test-users-%@example.com'],
    );
    await db.query(
      'DELETE FROM user_profiles WHERE user_id IN (SELECT id FROM users WHERE email LIKE $1)',
      ['test-users-%@example.com'],
    );
    await db.query(
      'DELETE FROM customers WHERE user_id IN (SELECT id FROM users WHERE email LIKE $1)',
      ['test-users-%@example.com'],
    );
    await db.query('DELETE FROM users WHERE email LIKE $1', ['test-users-%@example.com']);
    await app.close();
  });

  describe('GET /users/me', () => {
    it('should get current user profile with valid token', () => {
      return request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('email');
          expect(res.body).toHaveProperty('role');
          expect(res.body).toHaveProperty('isVerified');
          expect(res.body).toHaveProperty('createdAt');
          expect(res.body).toHaveProperty('profile');
          expect(res.body.email).toBe('test-users@example.com');
          expect(res.body.role).toBe('customer');
          expect(res.body.profile.firstName).toBe('Test');
          expect(res.body.profile.lastName).toBe('User');
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer()).get('/users/me').expect(401);
    });

    it('should fail with invalid token', () => {
      return request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should fail with malformed authorization header', () => {
      return request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', 'InvalidFormat token')
        .expect(401);
    });
  });

  describe('PATCH /users/me', () => {
    it('should update user profile with valid data', () => {
      return request(app.getHttpServer())
        .patch('/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          firstName: 'Updated',
          lastName: 'Name',
          phone: '+9876543210',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('profile');
          expect(res.body.profile.firstName).toBe('Updated');
          expect(res.body.profile.lastName).toBe('Name');
          expect(res.body.profile.phone).toBe('+9876543210');
        });
    });

    it('should update only provided fields', () => {
      return request(app.getHttpServer())
        .patch('/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          firstName: 'Partial',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.profile.firstName).toBe('Partial');
        });
    });

    it('should update avatar URL', () => {
      return request(app.getHttpServer())
        .patch('/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          avatarUrl: 'https://example.com/new-avatar.jpg',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.profile.avatarUrl).toBe('https://example.com/new-avatar.jpg');
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .patch('/users/me')
        .send({
          firstName: 'Unauthorized',
        })
        .expect(401);
    });

    it('should fail with invalid phone format', () => {
      return request(app.getHttpServer())
        .patch('/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          phone: 'invalid-phone',
        })
        .expect(400);
    });

    it('should fail with too long first name', () => {
      return request(app.getHttpServer())
        .patch('/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          firstName: 'A'.repeat(101),
        })
        .expect(400);
    });

    it('should fail with too long last name', () => {
      return request(app.getHttpServer())
        .patch('/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          lastName: 'B'.repeat(101),
        })
        .expect(400);
    });

    it('should fail with invalid field type', () => {
      return request(app.getHttpServer())
        .patch('/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          firstName: 123,
        })
        .expect(400);
    });

    it('should fail with non-whitelisted field', () => {
      return request(app.getHttpServer())
        .patch('/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          firstName: 'Valid',
          invalidField: 'should be rejected',
        })
        .expect(400);
    });
  });

  describe('DELETE /users/me', () => {
    let deleteAccessToken: string;
    let deleteUserId: string;

    beforeEach(async () => {
      // Create a user for deletion tests
      await request(app.getHttpServer()).post('/auth/register').send({
        email: 'test-delete@example.com',
        password: 'Test1234!',
        role: 'customer',
      });

      const loginRes = await request(app.getHttpServer()).post('/auth/login').send({
        email: 'test-delete@example.com',
        password: 'Test1234!',
      });

      deleteAccessToken = loginRes.body.accessToken;
      deleteUserId = loginRes.body.user.id;
    });

    it('should delete user account with valid token', () => {
      return request(app.getHttpServer())
        .delete('/users/me')
        .set('Authorization', `Bearer ${deleteAccessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(res.body.message).toContain('deleted successfully');
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer()).delete('/users/me').expect(401);
    });

    it('should fail with invalid token', () => {
      return request(app.getHttpServer())
        .delete('/users/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('Profile Creation on First Update', () => {
    let newAccessToken: string;

    beforeEach(async () => {
      // Register a user without profile data
      await request(app.getHttpServer()).post('/auth/register').send({
        email: 'test-no-profile@example.com',
        password: 'Test1234!',
        role: 'customer',
      });

      const loginRes = await request(app.getHttpServer()).post('/auth/login').send({
        email: 'test-no-profile@example.com',
        password: 'Test1234!',
      });

      newAccessToken = loginRes.body.accessToken;
    });

    it('should create profile on first update', () => {
      return request(app.getHttpServer())
        .patch('/users/me')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .send({
          firstName: 'New',
          lastName: 'Profile',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.profile.firstName).toBe('New');
          expect(res.body.profile.lastName).toBe('Profile');
        });
    });
  });

  describe('Concurrent Updates', () => {
    it('should handle multiple updates correctly', async () => {
      const update1 = request(app.getHttpServer())
        .patch('/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ firstName: 'First' });

      const update2 = request(app.getHttpServer())
        .patch('/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ lastName: 'Last' });

      const [res1, res2] = await Promise.all([update1, update2]);

      expect([res1.status, res2.status]).toContain(200);
    });
  });
});
