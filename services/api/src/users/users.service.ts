import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import { UpdateProfileDto } from './dto/users.dto';

@Injectable()
export class UsersService {
  constructor(@Inject('DATABASE_POOL') private db: Pool) {}

  async getProfile(userId: string) {
    const result = await this.db.query(
      `SELECT u.id, u.email, u.role, u.is_verified, u.created_at,
              p.first_name, p.last_name, p.phone, p.avatar_url
       FROM users u
       LEFT JOIN user_profiles p ON u.id = p.user_id
       WHERE u.id = $1`,
      [userId],
    );

    if (result.rows.length === 0) {
      throw new NotFoundException('User not found');
    }

    const user = result.rows[0];
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      isVerified: user.is_verified,
      createdAt: user.created_at,
      profile: {
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        avatarUrl: user.avatar_url,
      },
    };
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const { firstName, lastName, phone, avatarUrl } = updateProfileDto;

    // Check if profile exists
    const existingProfile = await this.db.query('SELECT id FROM user_profiles WHERE user_id = $1', [
      userId,
    ]);

    if (existingProfile.rows.length === 0) {
      // Create profile
      await this.db.query(
        'INSERT INTO user_profiles (user_id, first_name, last_name, phone, avatar_url) VALUES ($1, $2, $3, $4, $5)',
        [userId, firstName, lastName, phone, avatarUrl],
      );
    } else {
      // Update profile
      await this.db.query(
        `UPDATE user_profiles 
         SET first_name = COALESCE($1, first_name),
             last_name = COALESCE($2, last_name),
             phone = COALESCE($3, phone),
             avatar_url = COALESCE($4, avatar_url),
             updated_at = NOW()
         WHERE user_id = $5`,
        [firstName, lastName, phone, avatarUrl, userId],
      );
    }

    return this.getProfile(userId);
  }

  async deleteAccount(userId: string) {
    // Soft delete or hard delete based on requirements
    await this.db.query('DELETE FROM users WHERE id = $1', [userId]);
    return { message: 'Account deleted successfully' };
  }
}
