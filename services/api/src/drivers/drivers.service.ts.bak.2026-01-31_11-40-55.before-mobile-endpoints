import { Injectable, NotFoundException, ConflictException, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import {
  RegisterDriverDto,
  UpdateDriverProfileDto,
  UpdateAvailabilityDto,
  UpdateLocationDto,
  DriverProfileResponseDto,
  DriverStatsResponseDto,
  DriverLocationHistoryDto,
  DriverVerificationStatus,
} from './dto/driver.dto';

@Injectable()
export class DriversService {
  constructor(@Inject('DATABASE_POOL') private readonly db: Pool) {}

  async registerDriver(dto: RegisterDriverDto): Promise<DriverProfileResponseDto> {
    const existingUser = await this.db.query('SELECT id FROM users WHERE email = $1', [dto.email]);

    if (existingUser.rows.length > 0) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const userResult = await this.db.query(
      `INSERT INTO users (email, password_hash, role, first_name, last_name, phone_number, email_verified)
       VALUES ($1, $2, 'driver', $3, $4, $5, FALSE)
       RETURNING id`,
      [dto.email, passwordHash, dto.firstName, dto.lastName, dto.phoneNumber],
    );

    const userId = userResult.rows[0].id;

    await this.db.query(
      `INSERT INTO drivers 
       (user_id, vehicle_type, vehicle_make, vehicle_model, vehicle_year, license_plate, drivers_license_number)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        userId,
        dto.vehicleType,
        dto.vehicleMake || null,
        dto.vehicleModel || null,
        dto.vehicleYear || null,
        dto.licensePlate || null,
        dto.driversLicenseNumber || null,
      ],
    );

    return this.getDriverProfile(userId);
  }

  async getDriverProfile(userId: string): Promise<DriverProfileResponseDto> {
    const result = await this.db.query(
      `SELECT 
        d.id, d.user_id, u.email, u.first_name, u.last_name, u.phone_number,
        d.vehicle_type, d.vehicle_make, d.vehicle_model, d.vehicle_year,
        d.license_plate, d.drivers_license_number,
        d.drivers_license_verified, d.insurance_verified, d.background_check_verified,
        d.verification_status, d.is_available,
        d.current_latitude, d.current_longitude, d.last_location_update,
        d.total_deliveries, d.successful_deliveries, d.cancelled_deliveries,
        d.average_rating, d.total_ratings
       FROM drivers d
       JOIN users u ON d.user_id = u.id
       WHERE d.user_id = $1`,
      [userId],
    );

    if (result.rows.length === 0) {
      throw new NotFoundException('Driver not found');
    }

    const row = result.rows[0];

    const earnings = await this.getDriverEarnings(row.id);

    return {
      id: row.id,
      userId: row.user_id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      phoneNumber: row.phone_number,
      vehicleType: row.vehicle_type,
      vehicleMake: row.vehicle_make,
      vehicleModel: row.vehicle_model,
      vehicleYear: row.vehicle_year,
      licensePlate: row.license_plate,
      driversLicenseNumber: row.drivers_license_number,
      driversLicenseVerified: row.drivers_license_verified,
      insuranceVerified: row.insurance_verified,
      backgroundCheckVerified: row.background_check_verified,
      verificationStatus: row.verification_status as DriverVerificationStatus,
      isAvailable: row.is_available,
      currentLatitude: row.current_latitude ? parseFloat(row.current_latitude) : undefined,
      currentLongitude: row.current_longitude ? parseFloat(row.current_longitude) : undefined,
      lastLocationUpdate: row.last_location_update,
      stats: {
        totalDeliveries: row.total_deliveries,
        successfulDeliveries: row.successful_deliveries,
        cancelledDeliveries: row.cancelled_deliveries,
        averageRating: parseFloat(row.average_rating) || 0,
        totalRatings: row.total_ratings,
        totalEarnings: earnings.totalEarnings,
        pendingPayouts: earnings.pendingPayouts,
      },
    };
  }

  async updateDriverProfile(
    userId: string,
    dto: UpdateDriverProfileDto,
  ): Promise<DriverProfileResponseDto> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (dto.vehicleMake !== undefined) {
      updates.push(`vehicle_make = $${paramCount++}`);
      values.push(dto.vehicleMake);
    }
    if (dto.vehicleModel !== undefined) {
      updates.push(`vehicle_model = $${paramCount++}`);
      values.push(dto.vehicleModel);
    }
    if (dto.vehicleYear !== undefined) {
      updates.push(`vehicle_year = $${paramCount++}`);
      values.push(dto.vehicleYear);
    }
    if (dto.licensePlate !== undefined) {
      updates.push(`license_plate = $${paramCount++}`);
      values.push(dto.licensePlate);
    }
    if (dto.driversLicenseNumber !== undefined) {
      updates.push(`drivers_license_number = $${paramCount++}`);
      values.push(dto.driversLicenseNumber);
    }

    if (updates.length === 0) {
      return this.getDriverProfile(userId);
    }

    updates.push(`updated_at = NOW()`);
    values.push(userId);

    const query = `
      UPDATE drivers
      SET ${updates.join(', ')}
      WHERE user_id = $${paramCount}
      RETURNING id
    `;

    const result = await this.db.query(query, values);

    if (result.rows.length === 0) {
      throw new NotFoundException('Driver not found');
    }

    return this.getDriverProfile(userId);
  }

  async updateAvailability(
    userId: string,
    dto: UpdateAvailabilityDto,
  ): Promise<{ isAvailable: boolean }> {
    const result = await this.db.query(
      `UPDATE drivers
       SET is_available = $1, updated_at = NOW()
       WHERE user_id = $2
       RETURNING is_available`,
      [dto.isAvailable, userId],
    );

    if (result.rows.length === 0) {
      throw new NotFoundException('Driver not found');
    }

    return { isAvailable: result.rows[0].is_available };
  }

  async updateLocation(userId: string, dto: UpdateLocationDto): Promise<{ success: boolean }> {
    const driverResult = await this.db.query(
      'SELECT id, verification_status FROM drivers WHERE user_id = $1',
      [userId],
    );

    if (driverResult.rows.length === 0) {
      throw new NotFoundException('Driver not found');
    }

    const driverId = driverResult.rows[0].id;

    await this.db.query(
      `INSERT INTO driver_locations (driver_id, latitude, longitude, accuracy, speed, heading, recorded_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [
        driverId,
        dto.latitude,
        dto.longitude,
        dto.accuracy || null,
        dto.speed || null,
        dto.heading || null,
      ],
    );

    return { success: true };
  }

  async getDriverStats(userId: string): Promise<DriverStatsResponseDto> {
    const driverResult = await this.db.query(
      `SELECT id, total_deliveries, successful_deliveries, cancelled_deliveries,
              average_rating, total_ratings
       FROM drivers
       WHERE user_id = $1`,
      [userId],
    );

    if (driverResult.rows.length === 0) {
      throw new NotFoundException('Driver not found');
    }

    const row = driverResult.rows[0];
    const earnings = await this.getDriverEarnings(row.id);

    return {
      totalDeliveries: row.total_deliveries,
      successfulDeliveries: row.successful_deliveries,
      cancelledDeliveries: row.cancelled_deliveries,
      averageRating: parseFloat(row.average_rating) || 0,
      totalRatings: row.total_ratings,
      totalEarnings: earnings.totalEarnings,
      pendingPayouts: earnings.pendingPayouts,
    };
  }

  async getLocationHistory(
    userId: string,
    limit: number = 50,
  ): Promise<DriverLocationHistoryDto[]> {
    const driverResult = await this.db.query('SELECT id FROM drivers WHERE user_id = $1', [userId]);

    if (driverResult.rows.length === 0) {
      throw new NotFoundException('Driver not found');
    }

    const driverId = driverResult.rows[0].id;

    const result = await this.db.query(
      `SELECT latitude, longitude, accuracy, speed, heading, recorded_at
       FROM driver_locations
       WHERE driver_id = $1
       ORDER BY recorded_at DESC
       LIMIT $2`,
      [driverId, limit],
    );

    return result.rows.map((row) => ({
      latitude: parseFloat(row.latitude),
      longitude: parseFloat(row.longitude),
      accuracy: row.accuracy ? parseFloat(row.accuracy) : undefined,
      speed: row.speed ? parseFloat(row.speed) : undefined,
      heading: row.heading ? parseFloat(row.heading) : undefined,
      recordedAt: row.recorded_at,
    }));
  }

  private async getDriverEarnings(
    driverId: string,
  ): Promise<{ totalEarnings: number; pendingPayouts: number }> {
    const result = await this.db.query(
      `SELECT 
        COALESCE(SUM(total_earning_cents), 0) as total_earnings,
        COALESCE(SUM(CASE WHEN payout_status = 'pending' THEN total_earning_cents ELSE 0 END), 0) as pending_payouts
       FROM driver_ledger
       WHERE driver_id = $1`,
      [driverId],
    );

    return {
      totalEarnings: parseInt(result.rows[0].total_earnings) || 0,
      pendingPayouts: parseInt(result.rows[0].pending_payouts) || 0,
    };
  }

  async getDriverById(driverId: string) {
    const result = await this.db.query(
      `SELECT 
        d.id, d.user_id, u.first_name, u.last_name, u.email, u.phone_number,
        d.vehicle_type, d.is_available, d.verification_status,
        d.current_latitude, d.current_longitude, d.average_rating
       FROM drivers d
       JOIN users u ON d.user_id = u.id
       WHERE d.id = $1`,
      [driverId],
    );

    if (result.rows.length === 0) {
      throw new NotFoundException('Driver not found');
    }

    return result.rows[0];
  }
}
