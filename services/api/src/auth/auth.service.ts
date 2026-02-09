import { Injectable, Inject, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import * as https from 'https';
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  VerifyEmailDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/auth.dto';
import { User, JwtPayload } from '../common/interfaces/user.interface';

@Injectable()
export class AuthService {
  constructor(
    @Inject('DATABASE_POOL') private db: Pool,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, role, firstName, lastName, phone } = registerDto;

    // Check if user exists
    const existingUser = await this.db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);
    const verification_token = randomBytes(32).toString('hex');

    // Start transaction
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');

      // Insert user
      const userResult = await client.query(
        `INSERT INTO users (email, password_hash, role, verification_token) 
         VALUES ($1, $2, $3, $4) RETURNING id, email, role, is_verified, created_at`,
        [email, password_hash, role, verification_token],
      );
      const user = userResult.rows[0];

      // Insert profile if data provided
      if (firstName || lastName || phone) {
        await client.query(
          `INSERT INTO user_profiles (user_id, first_name, last_name, phone) 
           VALUES ($1, $2, $3, $4)`,
          [user.id, firstName || null, lastName || null, phone || null],
        );
      }

      // Create role-specific record
      if (role === 'customer') {
        await client.query('INSERT INTO customers (user_id) VALUES ($1)', [user.id]);
      } else if (role === 'chef') {
        await client.query('INSERT INTO chefs (user_id) VALUES ($1)', [user.id]);
      } else if (role === 'driver') {
        await client.query('INSERT INTO drivers (user_id) VALUES ($1)', [user.id]);
      }

      await client.query('COMMIT');

      await this.sendVerificationEmail(email, verification_token);

      return {
        message: 'Registration successful. Please check your email to verify your account.',
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          isVerified: user.is_verified,
        },
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // DEMO MODE: Bypass authentication if enabled
    const isDemoMode = process.env.DEMO_MODE === 'true';
    if (isDemoMode) {
      // Extract role from email prefix (chef@, driver@, admin@, or default to customer)
      let role = 'customer';
      if (email.startsWith('chef@')) role = 'chef';
      else if (email.startsWith('driver@')) role = 'driver';
      else if (email.startsWith('admin@')) role = 'admin';

      const demoUser = {
        id: `demo-${role}-${Date.now()}`,
        email: email,
        role: role,
        is_verified: true,
        first_name: 'Demo',
        last_name: role.charAt(0).toUpperCase() + role.slice(1),
        phone: '+1234567890',
        avatar_url: null,
      };

      const tokens = await this.generateTokens(demoUser as any);
      return {
        ...tokens,
        user: {
          id: demoUser.id,
          email: demoUser.email,
          role: demoUser.role,
          isVerified: demoUser.is_verified,
          profile: {
            firstName: demoUser.first_name,
            lastName: demoUser.last_name,
            phone: demoUser.phone,
            avatarUrl: demoUser.avatar_url,
          },
        },
      };
    }

    // Get user with profile
    const result = await this.db.query(
      `SELECT u.*, p.first_name, p.last_name, p.phone, p.avatar_url
       FROM users u
       LEFT JOIN user_profiles p ON u.id = p.user_id
       WHERE u.email = $1`,
      [email],
    );

    if (result.rows.length === 0) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const user = result.rows[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isVerified: user.is_verified,
        profile: {
          firstName: user.first_name,
          lastName: user.last_name,
          phone: user.phone,
          avatarUrl: user.avatar_url,
        },
      },
    };
  }

  async refreshTokens(refreshTokenDto: RefreshTokenDto) {
    const { refreshToken } = refreshTokenDto;

    try {
      // Verify refresh token
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.REFRESH_TOKEN_SECRET,
      });

      // Check if token exists in database
      const tokenResult = await this.db.query(
        'SELECT * FROM refresh_tokens WHERE token = $1 AND expires_at > NOW()',
        [refreshToken],
      );

      if (tokenResult.rows.length === 0) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Get user
      const userResult = await this.db.query('SELECT * FROM users WHERE id = $1', [payload.sub]);
      if (userResult.rows.length === 0) {
        throw new UnauthorizedException('User not found');
      }

      const user = userResult.rows[0];

      // Delete old refresh token
      await this.db.query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);

      // Generate new tokens
      return await this.generateTokens(user);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async verifyEmail(verifyEmailDto: VerifyEmailDto) {
    const { token } = verifyEmailDto;

    const result = await this.db.query(
      'UPDATE users SET is_verified = TRUE, verification_token = NULL WHERE verification_token = $1 RETURNING id, email',
      [token],
    );

    if (result.rows.length === 0) {
      throw new UnauthorizedException('Invalid verification token');
    }

    return { message: 'Email verified successfully', user: result.rows[0] };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;

    const resetToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    await this.db.query(
      'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE email = $3',
      [resetToken, expiresAt, email],
    );

    await this.sendPasswordResetEmail(email, resetToken);

    return { message: 'Password reset email sent' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, newPassword } = resetPasswordDto;

    const userResult = await this.db.query(
      'SELECT id FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()',
      [token],
    );

    if (userResult.rows.length === 0) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    const password_hash = await bcrypt.hash(newPassword, 10);

    await this.db.query(
      'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2',
      [password_hash, userResult.rows[0].id],
    );

    // Delete all refresh tokens for this user
    await this.db.query('DELETE FROM refresh_tokens WHERE user_id = $1', [userResult.rows[0].id]);

    return { message: 'Password reset successfully' };
  }

  private async generateTokens(user: User) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.REFRESH_TOKEN_SECRET,
      expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
    });

    // Store refresh token in database
    const refreshTokenExpiryMs = parseInt(process.env.REFRESH_TOKEN_EXPIRY_MS || '604800000', 10); // Default 7 days
    const expiresAt = new Date(Date.now() + refreshTokenExpiryMs);
    await this.db.query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, refreshToken, expiresAt],
    );

    return {
      accessToken,
      refreshToken,
    };
  }

  async logout(userId: string, refreshToken: string) {
    await this.db.query('DELETE FROM refresh_tokens WHERE user_id = $1 AND token = $2', [
      userId,
      refreshToken,
    ]);
    return { message: 'Logged out successfully' };
  }

  async getSession(userId: string) {
    // Get user with profile
    const result = await this.db.query(
      `SELECT u.*, p.first_name, p.last_name, p.phone, p.avatar_url
       FROM users u
       LEFT JOIN user_profiles p ON u.id = p.user_id
       WHERE u.id = $1`,
      [userId],
    );

    if (result.rows.length === 0) {
      throw new UnauthorizedException('User not found');
    }

    const user = result.rows[0];

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isVerified: user.is_verified,
        profile: {
          firstName: user.first_name,
          lastName: user.last_name,
          phone: user.phone,
          avatarUrl: user.avatar_url,
        },
      },
    };
  }

  private async sendVerificationEmail(email: string, token: string) {
    const appUrl = process.env.CUSTOMER_WEB_URL || 'http://localhost:8010';
    const verifyUrl = `${appUrl}/verify-email?token=${token}`;
    const subject = 'Verify your RideNDine account';
    const text = [
      'Welcome to RideNDine!',
      `Verify your account using this token: ${token}`,
      `Verify link: ${verifyUrl}`,
      'Or POST /auth/verify-email with { "token": "<token>" }',
    ].join('\n');
    const html = `
      <p>Welcome to RideNDine!</p>
      <p>Verify your account using this token:</p>
      <p><strong>${token}</strong></p>
      <p>Verify link: <a href="${verifyUrl}">${verifyUrl}</a></p>
    `;
    await this.sendEmail(email, subject, text, html);
  }

  private async sendPasswordResetEmail(email: string, token: string) {
    const appUrl = process.env.CUSTOMER_WEB_URL || 'http://localhost:8010';
    const resetUrl = `${appUrl}/reset-password?token=${token}`;
    const subject = 'Reset your RideNDine password';
    const text = [
      'Reset your password using this token:',
      token,
      `Reset link: ${resetUrl}`,
      'Or POST /auth/reset-password with { "token": "<token>", "newPassword": "..." }',
    ].join('\n');
    const html = `
      <p>Reset your password using this token:</p>
      <p><strong>${token}</strong></p>
      <p>Reset link: <a href="${resetUrl}">${resetUrl}</a></p>
    `;
    await this.sendEmail(email, subject, text, html);
  }

  private async sendEmail(to: string, subject: string, text: string, html?: string) {
    const apiKey = process.env.SENDGRID_API_KEY;
    const fromEmail = process.env.FROM_EMAIL || 'noreply@ridendine.com';

    if (!apiKey) {
      console.warn('SENDGRID_API_KEY not set; skipping email send.');
      return;
    }

    const content = [{ type: 'text/plain', value: text }];
    if (html) {
      content.push({ type: 'text/html', value: html });
    }

    const body = JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: fromEmail },
      subject,
      content,
    });

    await new Promise<void>((resolve, reject) => {
      const req = https.request(
        {
          hostname: 'api.sendgrid.com',
          path: '/v3/mail/send',
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body),
          },
        },
        (res) => {
          let responseBody = '';
          res.on('data', (chunk) => {
            responseBody += chunk;
          });
          res.on('end', () => {
            if (res.statusCode && res.statusCode >= 400) {
              return reject(new Error(`SendGrid error ${res.statusCode}: ${responseBody}`));
            }
            resolve();
          });
        },
      );

      req.on('error', reject);
      req.write(body);
      req.end();
    }).catch((err: Error) => {
      console.warn(`Email send failed: ${err.message}`);
    });
  }
}
