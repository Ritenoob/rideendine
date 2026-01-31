import { Injectable, NotFoundException, ConflictException, Inject, BadRequestException, ForbiddenException } from '@nestjs/common';
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

  async getAvailableOrders(userId: string) {
    // Get driver details with current location
    const driverResult = await this.db.query(
      `SELECT id, current_latitude, current_longitude, verification_status 
       FROM drivers 
       WHERE user_id = $1`,
      [userId],
    );

    if (driverResult.rows.length === 0) {
      throw new NotFoundException('Driver not found');
    }

    const driver = driverResult.rows[0];

    if (driver.verification_status !== 'approved') {
      return [];
    }

    // Get orders that are ready for pickup but not assigned to a driver
    const result = await this.db.query(
      `SELECT 
        o.id, o.order_number, o.total_cents, o.delivery_fee_cents,
        o.pickup_address, o.pickup_latitude, o.pickup_longitude,
        o.delivery_address, o.delivery_latitude, o.delivery_longitude,
        o.created_at,
        c.business_name as chef_name
       FROM orders o
       JOIN chefs c ON o.chef_id = c.id
       WHERE o.status = 'ready_for_pickup'
         AND o.driver_id IS NULL
       ORDER BY o.created_at ASC
       LIMIT 20`,
    );

    // Calculate distance from driver to pickup location
    return result.rows.map((row) => {
      const distanceKm = driver.current_latitude && driver.current_longitude
        ? this.haversineDistance(
            parseFloat(driver.current_latitude),
            parseFloat(driver.current_longitude),
            parseFloat(row.pickup_latitude),
            parseFloat(row.pickup_longitude),
          )
        : 0;

      return {
        id: row.id,
        orderNumber: row.order_number,
        chefName: row.chef_name,
        pickupAddress: row.pickup_address,
        pickupLatitude: parseFloat(row.pickup_latitude),
        pickupLongitude: parseFloat(row.pickup_longitude),
        deliveryAddress: row.delivery_address,
        deliveryLatitude: parseFloat(row.delivery_latitude),
        deliveryLongitude: parseFloat(row.delivery_longitude),
        totalCents: row.total_cents,
        estimatedDeliveryFeeCents: row.delivery_fee_cents,
        distanceKm,
        createdAt: row.created_at,
      };
    }).sort((a, b) => a.distanceKm - b.distanceKm); // Sort by distance
  }

  async acceptOrder(userId: string, orderId: string, estimatedPickupMinutes?: number) {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      // Get driver
      const driverResult = await client.query(
        'SELECT id, verification_status FROM drivers WHERE user_id = $1',
        [userId],
      );

      if (driverResult.rows.length === 0) {
        throw new NotFoundException('Driver not found');
      }

      const driver = driverResult.rows[0];

      if (driver.verification_status !== 'approved') {
        throw new BadRequestException('Driver is not verified');
      }

      // Get order and validate status
      const orderResult = await client.query(
        'SELECT id, status, driver_id FROM orders WHERE id = $1 FOR UPDATE',
        [orderId],
      );

      if (orderResult.rows.length === 0) {
        throw new NotFoundException('Order not found');
      }

      const order = orderResult.rows[0];

      if (order.status !== 'ready_for_pickup') {
        throw new BadRequestException('Order is not available for pickup');
      }

      if (order.driver_id) {
        throw new ConflictException('Order already assigned to another driver');
      }

      // Assign driver to order
      await client.query(
        `UPDATE orders 
         SET driver_id = $1, 
             status = 'assigned_to_driver',
             driver_assigned_at = NOW(),
             estimated_pickup_at = CASE 
               WHEN $2 IS NOT NULL THEN NOW() + ($2 || ' minutes')::INTERVAL
               ELSE NULL
             END,
             updated_at = NOW()
         WHERE id = $3`,
        [driver.id, estimatedPickupMinutes, orderId],
      );

      // Log state transition
      await client.query(
        `INSERT INTO order_status_history (order_id, status, changed_by_user_id, notes)
         VALUES ($1, 'assigned_to_driver', $2, 'Driver accepted order')`,
        [orderId, userId],
      );

      await client.query('COMMIT');

      return { success: true, orderId };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getActiveDelivery(userId: string) {
    const driverResult = await this.db.query(
      'SELECT id FROM drivers WHERE user_id = $1',
      [userId],
    );

    if (driverResult.rows.length === 0) {
      throw new NotFoundException('Driver not found');
    }

    const driverId = driverResult.rows[0].id;

    // Get active order (assigned, picked_up, or in_transit)
    const result = await this.db.query(
      `SELECT 
        o.id, o.order_number, o.status, o.total_cents, o.delivery_fee_cents,
        o.pickup_address, o.pickup_latitude, o.pickup_longitude,
        o.delivery_address, o.delivery_latitude, o.delivery_longitude,
        o.special_instructions, o.driver_assigned_at,
        c.business_name as chef_name,
        u.first_name as customer_first_name, u.last_name as customer_last_name,
        u.phone_number as customer_phone
       FROM orders o
       JOIN chefs c ON o.chef_id = c.id
       JOIN users cu ON o.customer_id = cu.id
       JOIN users u ON cu.id = u.id
       WHERE o.driver_id = $1
         AND o.status IN ('assigned_to_driver', 'picked_up', 'in_transit')
       ORDER BY o.driver_assigned_at DESC
       LIMIT 1`,
      [driverId],
    );

    if (result.rows.length === 0) {
      return null;
    }

    const order = result.rows[0];

    // Get order items
    const itemsResult = await this.db.query(
      `SELECT name, quantity FROM order_items WHERE order_id = $1`,
      [order.id],
    );

    return {
      orderId: order.id,
      orderNumber: order.order_number,
      status: order.status,
      chefName: order.chef_name,
      pickupAddress: order.pickup_address,
      pickupLatitude: parseFloat(order.pickup_latitude),
      pickupLongitude: parseFloat(order.pickup_longitude),
      deliveryAddress: order.delivery_address,
      deliveryLatitude: parseFloat(order.delivery_latitude),
      deliveryLongitude: parseFloat(order.delivery_longitude),
      customerName: `${order.customer_first_name} ${order.customer_last_name}`,
      customerPhone: order.customer_phone,
      totalCents: order.total_cents,
      deliveryFeeCents: order.delivery_fee_cents,
      items: itemsResult.rows,
      specialInstructions: order.special_instructions,
      assignedAt: order.driver_assigned_at,
    };
  }

  async markPickedUp(userId: string, orderId: string, estimatedDeliveryMinutes?: number) {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      // Verify driver owns this order
      const driverResult = await client.query(
        'SELECT id FROM drivers WHERE user_id = $1',
        [userId],
      );

      if (driverResult.rows.length === 0) {
        throw new NotFoundException('Driver not found');
      }

      const driverId = driverResult.rows[0].id;

      const orderResult = await client.query(
        'SELECT id, status, driver_id FROM orders WHERE id = $1 FOR UPDATE',
        [orderId],
      );

      if (orderResult.rows.length === 0) {
        throw new NotFoundException('Order not found');
      }

      const order = orderResult.rows[0];

      if (order.driver_id !== driverId) {
        throw new ForbiddenException('This order is not assigned to you');
      }

      if (order.status !== 'assigned_to_driver') {
        throw new BadRequestException('Order cannot be marked as picked up from current status');
      }

      // Update order status
      await client.query(
        `UPDATE orders 
         SET status = 'picked_up',
             picked_up_at = NOW(),
             estimated_delivery_at = CASE 
               WHEN $1 IS NOT NULL THEN NOW() + ($1 || ' minutes')::INTERVAL
               ELSE NULL
             END,
             updated_at = NOW()
         WHERE id = $2`,
        [estimatedDeliveryMinutes, orderId],
      );

      // Log state transition
      await client.query(
        `INSERT INTO order_status_history (order_id, status, changed_by_user_id, notes)
         VALUES ($1, 'picked_up', $2, 'Driver picked up order')`,
        [orderId, userId],
      );

      await client.query('COMMIT');

      return { success: true, orderId };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async markDelivered(userId: string, orderId: string, deliveryPhotoUrl?: string, notes?: string) {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      // Verify driver owns this order
      const driverResult = await client.query(
        'SELECT id FROM drivers WHERE user_id = $1',
        [userId],
      );

      if (driverResult.rows.length === 0) {
        throw new NotFoundException('Driver not found');
      }

      const driverId = driverResult.rows[0].id;

      const orderResult = await client.query(
        `SELECT id, status, driver_id, delivery_fee_cents 
         FROM orders 
         WHERE id = $1 FOR UPDATE`,
        [orderId],
      );

      if (orderResult.rows.length === 0) {
        throw new NotFoundException('Order not found');
      }

      const order = orderResult.rows[0];

      if (order.driver_id !== driverId) {
        throw new ForbiddenException('This order is not assigned to you');
      }

      if (!['picked_up', 'in_transit'].includes(order.status)) {
        throw new BadRequestException('Order cannot be marked as delivered from current status');
      }

      // Update order status
      await client.query(
        `UPDATE orders 
         SET status = 'delivered',
             delivered_at = NOW(),
             delivery_photo_url = $1,
             updated_at = NOW()
         WHERE id = $2`,
        [deliveryPhotoUrl, orderId],
      );

      // Log state transition
      await client.query(
        `INSERT INTO order_status_history (order_id, status, changed_by_user_id, notes)
         VALUES ($1, 'delivered', $2, $3)`,
        [orderId, userId, notes || 'Driver marked order as delivered'],
      );

      // Record driver earnings
      await client.query(
        `INSERT INTO driver_ledger 
         (driver_id, order_id, total_earning_cents, payout_status)
         VALUES ($1, $2, $3, 'pending')`,
        [driverId, orderId, order.delivery_fee_cents],
      );

      // Update driver stats
      await client.query(
        `UPDATE drivers 
         SET total_deliveries = total_deliveries + 1,
             successful_deliveries = successful_deliveries + 1,
             updated_at = NOW()
         WHERE id = $1`,
        [driverId],
      );

      await client.query('COMMIT');

      return { success: true, orderId };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getEarnings(userId: string, period: string = 'all') {
    const driverResult = await this.db.query(
      'SELECT id FROM drivers WHERE user_id = $1',
      [userId],
    );

    if (driverResult.rows.length === 0) {
      throw new NotFoundException('Driver not found');
    }

    const driverId = driverResult.rows[0].id;

    let dateFilter = '';
    let groupByFormat = 'YYYY-MM-DD';

    switch (period) {
      case 'today':
        dateFilter = "AND DATE(dl.created_at) = CURRENT_DATE";
        groupByFormat = 'HH24:00';
        break;
      case 'week':
        dateFilter = "AND dl.created_at >= NOW() - INTERVAL '7 days'";
        break;
      case 'month':
        dateFilter = "AND dl.created_at >= NOW() - INTERVAL '30 days'";
        break;
      default:
        dateFilter = '';
    }

    // Get total earnings
    const totalResult = await this.db.query(
      `SELECT 
        COALESCE(SUM(total_earning_cents), 0) as total_earnings,
        COUNT(*) as delivery_count
       FROM driver_ledger dl
       WHERE dl.driver_id = $1 ${dateFilter}`,
      [driverId],
    );

    // Get daily breakdown
    const breakdownResult = await this.db.query(
      `SELECT 
        TO_CHAR(dl.created_at, $2) as date,
        SUM(total_earning_cents) as earnings,
        COUNT(*) as deliveries
       FROM driver_ledger dl
       WHERE dl.driver_id = $1 ${dateFilter}
       GROUP BY TO_CHAR(dl.created_at, $2)
       ORDER BY date DESC`,
      [driverId, groupByFormat],
    );

    const totalEarnings = parseInt(totalResult.rows[0]?.total_earnings || '0');
    const deliveryCount = parseInt(totalResult.rows[0]?.delivery_count || '0');

    return {
      period,
      totalEarnings,
      deliveryCount,
      averagePerDelivery: deliveryCount > 0 ? Math.round(totalEarnings / deliveryCount) : 0,
      breakdown: breakdownResult.rows.map((row) => ({
        date: row.date,
        earnings: parseInt(row.earnings),
        deliveries: parseInt(row.deliveries),
      })),
    };
  }

  async getDeliveryHistory(userId: string, limit: number = 20) {
    const driverResult = await this.db.query(
      'SELECT id FROM drivers WHERE user_id = $1',
      [userId],
    );

    if (driverResult.rows.length === 0) {
      throw new NotFoundException('Driver not found');
    }

    const driverId = driverResult.rows[0].id;

    const result = await this.db.query(
      `SELECT 
        o.id, o.order_number, o.delivered_at, o.delivery_fee_cents,
        o.pickup_latitude, o.pickup_longitude,
        o.delivery_latitude, o.delivery_longitude,
        r.rating as customer_rating
       FROM orders o
       LEFT JOIN reviews r ON o.id = r.order_id AND r.reviewer_role = 'customer'
       WHERE o.driver_id = $1
         AND o.status = 'delivered'
       ORDER BY o.delivered_at DESC
       LIMIT $2`,
      [driverId, limit],
    );

    return result.rows.map((row) => {
      const distanceKm = this.haversineDistance(
        parseFloat(row.pickup_latitude),
        parseFloat(row.pickup_longitude),
        parseFloat(row.delivery_latitude),
        parseFloat(row.delivery_longitude),
      );

      return {
        orderId: row.id,
        orderNumber: row.order_number,
        completedAt: row.delivered_at,
        deliveryFeeCents: row.delivery_fee_cents,
        customerRating: row.customer_rating ? parseFloat(row.customer_rating) : undefined,
        distanceKm,
      };
    });
  }

  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
