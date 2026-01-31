import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { Pool } from 'pg';
import { UpdateProfileDto } from './dto/users.dto';
import { CreateAddressDto, UpdateAddressDto, AddressResponseDto } from './dto/address.dto';

@Injectable()
export class UsersService {
  constructor(@Inject('DATABASE_POOL') private db: Pool) {}

  async getProfile(userId: string) {
    const result = await this.db.query(
      `SELECT u.id, u.email, u.role, u.is_verified, u.stripe_customer_id, u.created_at,
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
      stripeCustomerId: user.stripe_customer_id,
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

  async updateStripeCustomerId(userId: string, customerId: string) {
    await this.db.query('UPDATE users SET stripe_customer_id = $1 WHERE id = $2', [
      customerId,
      userId,
    ]);
  }

  async findById(userId: string) {
    return this.getProfile(userId);
  }

  // Address management

  async createAddress(userId: string, createAddressDto: CreateAddressDto): Promise<AddressResponseDto> {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      // If this is marked as default, unset other defaults
      if (createAddressDto.isDefault) {
        await client.query(
          'UPDATE user_addresses SET is_default = false WHERE user_id = $1',
          [userId],
        );
      }

      // Insert new address
      const result = await client.query(
        `INSERT INTO user_addresses 
         (user_id, label, address_line1, address_line2, city, state, zip_code, 
          latitude, longitude, delivery_instructions, is_default)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [
          userId,
          createAddressDto.label,
          createAddressDto.addressLine1,
          createAddressDto.addressLine2,
          createAddressDto.city,
          createAddressDto.state,
          createAddressDto.zipCode,
          createAddressDto.latitude,
          createAddressDto.longitude,
          createAddressDto.deliveryInstructions,
          createAddressDto.isDefault || false,
        ],
      );

      await client.query('COMMIT');

      return this.mapAddressRow(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getAddresses(userId: string): Promise<AddressResponseDto[]> {
    const result = await this.db.query(
      `SELECT * FROM user_addresses 
       WHERE user_id = $1 
       ORDER BY is_default DESC, created_at DESC`,
      [userId],
    );

    return result.rows.map((row) => this.mapAddressRow(row));
  }

  async updateAddress(
    userId: string,
    addressId: string,
    updateAddressDto: UpdateAddressDto,
  ): Promise<AddressResponseDto> {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      // Verify address belongs to user
      const existingResult = await client.query(
        'SELECT id FROM user_addresses WHERE id = $1 AND user_id = $2',
        [addressId, userId],
      );

      if (existingResult.rows.length === 0) {
        throw new NotFoundException('Address not found');
      }

      // If setting as default, unset other defaults
      if (updateAddressDto.isDefault) {
        await client.query(
          'UPDATE user_addresses SET is_default = false WHERE user_id = $1',
          [userId],
        );
      }

      // Build update query
      const updates: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (updateAddressDto.label !== undefined) {
        updates.push(`label = $${paramCount++}`);
        values.push(updateAddressDto.label);
      }
      if (updateAddressDto.addressLine1 !== undefined) {
        updates.push(`address_line1 = $${paramCount++}`);
        values.push(updateAddressDto.addressLine1);
      }
      if (updateAddressDto.addressLine2 !== undefined) {
        updates.push(`address_line2 = $${paramCount++}`);
        values.push(updateAddressDto.addressLine2);
      }
      if (updateAddressDto.city !== undefined) {
        updates.push(`city = $${paramCount++}`);
        values.push(updateAddressDto.city);
      }
      if (updateAddressDto.state !== undefined) {
        updates.push(`state = $${paramCount++}`);
        values.push(updateAddressDto.state);
      }
      if (updateAddressDto.zipCode !== undefined) {
        updates.push(`zip_code = $${paramCount++}`);
        values.push(updateAddressDto.zipCode);
      }
      if (updateAddressDto.latitude !== undefined) {
        updates.push(`latitude = $${paramCount++}`);
        values.push(updateAddressDto.latitude);
      }
      if (updateAddressDto.longitude !== undefined) {
        updates.push(`longitude = $${paramCount++}`);
        values.push(updateAddressDto.longitude);
      }
      if (updateAddressDto.deliveryInstructions !== undefined) {
        updates.push(`delivery_instructions = $${paramCount++}`);
        values.push(updateAddressDto.deliveryInstructions);
      }
      if (updateAddressDto.isDefault !== undefined) {
        updates.push(`is_default = $${paramCount++}`);
        values.push(updateAddressDto.isDefault);
      }

      if (updates.length === 0) {
        throw new BadRequestException('No fields to update');
      }

      updates.push(`updated_at = NOW()`);
      values.push(addressId);

      const query = `
        UPDATE user_addresses
        SET ${updates.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const result = await client.query(query, values);

      await client.query('COMMIT');

      return this.mapAddressRow(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async deleteAddress(userId: string, addressId: string): Promise<{ success: boolean }> {
    const result = await this.db.query(
      'DELETE FROM user_addresses WHERE id = $1 AND user_id = $2 RETURNING id',
      [addressId, userId],
    );

    if (result.rows.length === 0) {
      throw new NotFoundException('Address not found');
    }

    return { success: true };
  }

  private mapAddressRow(row: any): AddressResponseDto {
    return {
      id: row.id,
      userId: row.user_id,
      label: row.label,
      addressLine1: row.address_line1,
      addressLine2: row.address_line2,
      city: row.city,
      state: row.state,
      zipCode: row.zip_code,
      latitude: parseFloat(row.latitude),
      longitude: parseFloat(row.longitude),
      deliveryInstructions: row.delivery_instructions,
      isDefault: row.is_default,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
