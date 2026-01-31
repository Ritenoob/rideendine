import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Pool } from 'pg';
import {
  DashboardStats,
  ActivityItem,
  CommissionStats,
  PlatformSettings,
  UpdateSettingsDto,
  UpdateUserDto,
} from './dto/admin.dto';

// Default platform settings (used when no settings exist in DB)
const DEFAULT_SETTINGS: PlatformSettings = {
  platform_fee_percent: 15,
  minimum_order_cents: 1000,
  delivery_fee_cents: 499,
  driver_commission_percent: 80,
  chef_commission_percent: 85,
  maintenance_mode: false,
  new_registrations_enabled: true,
  orders_enabled: true,
  support_email: 'support@ridendine.com',
  support_phone: '+1-800-RIDENDINE',
  tax_rate_percent: 8.25,
  max_delivery_radius_km: 25,
};

@Injectable()
export class AdminService {
  constructor(@Inject('DATABASE_POOL') private db: Pool) {}

  // ============================================================================
  // DASHBOARD
  // ============================================================================

  async getDashboardStats(): Promise<DashboardStats> {
    const client = await this.db.connect();
    try {
      // Execute all stats queries in parallel for performance
      const [
        ordersResult,
        activeOrdersResult,
        revenueResult,
        pendingChefsResult,
        pendingDriversResult,
        activeDriversResult,
        totalUsersResult,
      ] = await Promise.all([
        // Total orders count
        client.query('SELECT COUNT(*) as count FROM orders'),
        // Active orders (not delivered, refunded, or cancelled)
        client.query(`
          SELECT COUNT(*) as count FROM orders
          WHERE status NOT IN ('delivered', 'refunded', 'cancelled')
        `),
        // Revenue and commission (from completed orders)
        client.query(`
          SELECT
            COALESCE(SUM(total_cents), 0) as total_revenue,
            COALESCE(SUM(platform_fee_cents), 0) as total_commission
          FROM orders
          WHERE status = 'delivered'
        `),
        // Pending chefs awaiting approval
        client.query(`
          SELECT COUNT(*) as count FROM chefs
          WHERE verification_status = 'pending'
        `),
        // Pending drivers awaiting approval
        client.query(`
          SELECT COUNT(*) as count FROM drivers
          WHERE verification_status = 'pending'
        `),
        // Active/available drivers
        client.query(`
          SELECT COUNT(*) as count FROM drivers
          WHERE is_available = TRUE AND verification_status = 'approved'
        `),
        // Total users
        client.query('SELECT COUNT(*) as count FROM users'),
      ]);

      return {
        totalOrders: parseInt(ordersResult.rows[0].count, 10),
        activeOrders: parseInt(activeOrdersResult.rows[0].count, 10),
        totalRevenue: parseInt(revenueResult.rows[0].total_revenue, 10),
        totalCommission: parseInt(revenueResult.rows[0].total_commission, 10),
        pendingChefs: parseInt(pendingChefsResult.rows[0].count, 10),
        pendingDrivers: parseInt(pendingDriversResult.rows[0].count, 10),
        activeDrivers: parseInt(activeDriversResult.rows[0].count, 10),
        totalUsers: parseInt(totalUsersResult.rows[0].count, 10),
      };
    } finally {
      client.release();
    }
  }

  async getRecentActivity(limit: number = 50): Promise<{ activities: ActivityItem[] }> {
    // Combine recent admin actions and order status changes into an activity feed
    const result = await this.db.query<ActivityItem & { action_type?: string; target_type?: string; details?: any }>(
      `
      (
        SELECT
          aa.id::text,
          aa.action_type as type,
          CASE
            WHEN aa.action_type = 'chef_approved' THEN 'Chef was approved'
            WHEN aa.action_type = 'chef_rejected' THEN 'Chef was rejected'
            WHEN aa.action_type = 'driver_approved' THEN 'Driver was approved'
            WHEN aa.action_type = 'driver_rejected' THEN 'Driver was rejected'
            WHEN aa.action_type = 'order_refunded' THEN 'Order was refunded'
            WHEN aa.action_type = 'user_suspended' THEN 'User was suspended'
            WHEN aa.action_type = 'review_removed' THEN 'Review was removed'
            ELSE aa.action_type
          END as message,
          aa.created_at as timestamp,
          aa.details as metadata
        FROM admin_actions aa
        ORDER BY aa.created_at DESC
        LIMIT $1
      )
      UNION ALL
      (
        SELECT
          o.id::text,
          'order_created' as type,
          'New order #' || o.order_number as message,
          o.created_at as timestamp,
          json_build_object('order_id', o.id, 'total_cents', o.total_cents, 'status', o.status) as metadata
        FROM orders o
        ORDER BY o.created_at DESC
        LIMIT $1
      )
      ORDER BY timestamp DESC
      LIMIT $1
    `,
      [limit],
    );

    return { activities: result.rows };
  }

  // ============================================================================
  // CHEFS MANAGEMENT
  // ============================================================================

  async listChefs(status?: string, search?: string) {
    const values: string[] = [];
    let paramIndex = 1;
    let sql = `
      SELECT c.id, c.business_name, c.verification_status, c.rating, c.address,
             c.total_orders, c.is_active, c.created_at, u.email,
             up.first_name, up.last_name, up.phone
      FROM chefs c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE 1=1
    `;

    if (status) {
      sql += ` AND c.verification_status = $${paramIndex++}`;
      values.push(status);
    }

    if (search) {
      sql += ` AND (c.business_name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`;
      values.push(`%${search}%`);
      paramIndex++;
    }

    sql += ' ORDER BY c.created_at DESC LIMIT 200';
    const result = await this.db.query(sql, values);
    return { chefs: result.rows };
  }

  async getChefDetails(chefId: string) {
    const result = await this.db.query(
      `
      SELECT c.*, u.email, u.is_verified as user_verified,
             up.first_name, up.last_name, up.phone, up.avatar_url,
             (SELECT COUNT(*) FROM orders WHERE chef_id = c.id) as order_count,
             (SELECT COALESCE(SUM(total_cents), 0) FROM orders WHERE chef_id = c.id AND status = 'delivered') as total_revenue
      FROM chefs c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE c.id = $1
    `,
      [chefId],
    );

    if (result.rows.length === 0) {
      throw new NotFoundException('Chef not found');
    }

    // Get chef documents
    const docsResult = await this.db.query(
      'SELECT * FROM chef_documents WHERE chef_id = $1 ORDER BY uploaded_at DESC',
      [chefId],
    );

    return {
      chef: {
        ...result.rows[0],
        documents: docsResult.rows,
      },
    };
  }

  async updateChefStatus(chefId: string, status: 'approved' | 'rejected', reason?: string, adminId?: string) {
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');

      const result = await client.query(
        'UPDATE chefs SET verification_status = $1, updated_at = NOW() WHERE id = $2 RETURNING id, verification_status, user_id',
        [status, chefId],
      );

      if (result.rows.length === 0) {
        throw new NotFoundException('Chef not found');
      }

      // Log admin action
      if (adminId) {
        await client.query(
          `INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, details)
           VALUES ($1, $2, 'chef', $3, $4)`,
          [
            adminId,
            status === 'approved' ? 'chef_approved' : 'chef_rejected',
            chefId,
            JSON.stringify({ reason: reason || null }),
          ],
        );
      }

      await client.query('COMMIT');
      return { chef: result.rows[0] };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // ============================================================================
  // DRIVERS MANAGEMENT
  // ============================================================================

  async listDrivers(status?: string, search?: string) {
    const values: (string | boolean)[] = [];
    let paramIndex = 1;
    let sql = `
      SELECT d.id, d.is_available, d.total_deliveries, d.verification_status,
             d.vehicle_type, d.average_rating as rating, d.created_at,
             u.email, up.first_name, up.last_name, up.phone
      FROM drivers d
      JOIN users u ON d.user_id = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE 1=1
    `;

    if (status) {
      if (status === 'active') {
        sql += ` AND d.is_available = TRUE AND d.verification_status = 'approved'`;
      } else if (status === 'pending') {
        sql += ` AND d.verification_status = 'pending'`;
      } else if (status === 'approved') {
        sql += ` AND d.verification_status = 'approved'`;
      } else if (status === 'rejected') {
        sql += ` AND d.verification_status = 'rejected'`;
      } else if (status === 'suspended') {
        sql += ` AND d.verification_status = 'suspended'`;
      }
    }

    if (search) {
      sql += ` AND (u.email ILIKE $${paramIndex} OR up.first_name ILIKE $${paramIndex} OR up.last_name ILIKE $${paramIndex})`;
      values.push(`%${search}%`);
      paramIndex++;
    }

    sql += ' ORDER BY d.created_at DESC LIMIT 200';
    const result = await this.db.query(sql, values);
    return { drivers: result.rows };
  }

  async approveDriver(driverId: string, adminId?: string) {
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');

      const result = await client.query(
        `UPDATE drivers SET verification_status = 'approved', updated_at = NOW()
         WHERE id = $1 RETURNING id, verification_status, user_id`,
        [driverId],
      );

      if (result.rows.length === 0) {
        throw new NotFoundException('Driver not found');
      }

      // Log admin action
      if (adminId) {
        await client.query(
          `INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, details)
           VALUES ($1, 'driver_approved', 'driver', $2, '{}')`,
          [adminId, driverId],
        );
      }

      await client.query('COMMIT');
      return { driver: result.rows[0] };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async rejectDriver(driverId: string, reason: string, adminId?: string) {
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');

      const result = await client.query(
        `UPDATE drivers SET verification_status = 'rejected', updated_at = NOW()
         WHERE id = $1 RETURNING id, verification_status, user_id`,
        [driverId],
      );

      if (result.rows.length === 0) {
        throw new NotFoundException('Driver not found');
      }

      // Log admin action
      if (adminId) {
        await client.query(
          `INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, details)
           VALUES ($1, 'driver_rejected', 'driver', $2, $3)`,
          [adminId, driverId, JSON.stringify({ reason })],
        );
      }

      await client.query('COMMIT');
      return { driver: result.rows[0] };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // ============================================================================
  // USERS MANAGEMENT
  // ============================================================================

  async listUsers(params: { role?: string; search?: string; page?: number; perPage?: number }) {
    const { role, search, page = 1, perPage = 20 } = params;
    const offset = (page - 1) * perPage;
    const values: (string | number)[] = [];
    let paramIndex = 1;

    let countSql = 'SELECT COUNT(*) as total FROM users u LEFT JOIN user_profiles up ON u.id = up.user_id WHERE 1=1';
    let sql = `
      SELECT u.id, u.email, u.role, u.is_verified, u.created_at,
             up.first_name, up.last_name, up.phone, up.avatar_url
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE 1=1
    `;

    if (role) {
      const roleCondition = ` AND u.role = $${paramIndex++}`;
      sql += roleCondition;
      countSql += roleCondition;
      values.push(role);
    }

    if (search) {
      const searchCondition = ` AND (u.email ILIKE $${paramIndex} OR up.first_name ILIKE $${paramIndex} OR up.last_name ILIKE $${paramIndex})`;
      sql += searchCondition;
      countSql += searchCondition;
      values.push(`%${search}%`);
      paramIndex++;
    }

    // Get total count
    const countResult = await this.db.query(countSql, values);
    const total = parseInt(countResult.rows[0].total, 10);

    // Get paginated results
    sql += ` ORDER BY u.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    values.push(perPage, offset);

    const result = await this.db.query(sql, values);

    return {
      users: result.rows,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  async updateUser(userId: string, data: UpdateUserDto, adminId?: string) {
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');

      // Update users table if email, role, or is_verified changed
      const userUpdates: string[] = [];
      const userValues: (string | boolean)[] = [];
      let userParamIndex = 1;

      if (data.email !== undefined) {
        userUpdates.push(`email = $${userParamIndex++}`);
        userValues.push(data.email);
      }
      if (data.role !== undefined) {
        userUpdates.push(`role = $${userParamIndex++}`);
        userValues.push(data.role);
      }
      if (data.is_verified !== undefined) {
        userUpdates.push(`is_verified = $${userParamIndex++}`);
        userValues.push(data.is_verified);
      }

      if (userUpdates.length > 0) {
        userUpdates.push(`updated_at = NOW()`);
        userValues.push(userId);
        await client.query(
          `UPDATE users SET ${userUpdates.join(', ')} WHERE id = $${userParamIndex}`,
          userValues,
        );
      }

      // Update user_profiles table if first_name, last_name, or phone changed
      const profileUpdates: string[] = [];

      if (data.first_name !== undefined) {
        // On update, use the value from the INSERT (EXCLUDED)
        profileUpdates.push('first_name = EXCLUDED.first_name');
      }
      if (data.last_name !== undefined) {
        profileUpdates.push('last_name = EXCLUDED.last_name');
      }
      if (data.phone !== undefined) {
        profileUpdates.push('phone = EXCLUDED.phone');
      }

      if (profileUpdates.length > 0) {
        profileUpdates.push('updated_at = NOW()');

        // Upsert: update if exists, insert if not
        await client.query(
          `
          INSERT INTO user_profiles (user_id, first_name, last_name, phone, updated_at)
          VALUES ($1, $2, $3, $4, NOW())
          ON CONFLICT (user_id) DO UPDATE SET ${profileUpdates.join(', ')}
        `,
          [
            userId,
            data.first_name ?? null,
            data.last_name ?? null,
            data.phone ?? null,
          ],
        );
      }

      // Log admin action
      if (adminId) {
        await client.query(
          `INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, details)
           VALUES ($1, 'user_updated', 'user', $2, $3)`,
          [adminId, userId, JSON.stringify(data)],
        );
      }

      await client.query('COMMIT');

      // Fetch updated user
      const result = await this.db.query(
        `
        SELECT u.id, u.email, u.role, u.is_verified, u.created_at,
               up.first_name, up.last_name, up.phone, up.avatar_url
        FROM users u
        LEFT JOIN user_profiles up ON u.id = up.user_id
        WHERE u.id = $1
      `,
        [userId],
      );

      return { user: result.rows[0] };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async suspendUser(userId: string, adminId?: string) {
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');

      // Check if user exists
      const userResult = await client.query('SELECT id, role FROM users WHERE id = $1', [userId]);
      if (userResult.rows.length === 0) {
        throw new NotFoundException('User not found');
      }

      const userRole = userResult.rows[0].role;

      // Suspend based on role
      if (userRole === 'chef') {
        await client.query(
          `UPDATE chefs SET is_active = FALSE, verification_status = 'rejected', updated_at = NOW()
           WHERE user_id = $1`,
          [userId],
        );
      } else if (userRole === 'driver') {
        await client.query(
          `UPDATE drivers SET is_available = FALSE, verification_status = 'suspended', updated_at = NOW()
           WHERE user_id = $1`,
          [userId],
        );
      }

      // Mark user as unverified (soft suspension)
      await client.query('UPDATE users SET is_verified = FALSE, updated_at = NOW() WHERE id = $1', [
        userId,
      ]);

      // Log admin action
      if (adminId) {
        await client.query(
          `INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, details)
           VALUES ($1, 'user_suspended', 'user', $2, '{}')`,
          [adminId, userId],
        );
      }

      await client.query('COMMIT');
      return { success: true, message: 'User suspended successfully' };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async activateUser(userId: string, adminId?: string) {
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');

      // Check if user exists
      const userResult = await client.query('SELECT id, role FROM users WHERE id = $1', [userId]);
      if (userResult.rows.length === 0) {
        throw new NotFoundException('User not found');
      }

      const userRole = userResult.rows[0].role;

      // Activate based on role
      if (userRole === 'chef') {
        await client.query(
          `UPDATE chefs SET is_active = TRUE, verification_status = 'approved', updated_at = NOW()
           WHERE user_id = $1`,
          [userId],
        );
      } else if (userRole === 'driver') {
        await client.query(
          `UPDATE drivers SET verification_status = 'approved', updated_at = NOW()
           WHERE user_id = $1`,
          [userId],
        );
      }

      // Mark user as verified
      await client.query('UPDATE users SET is_verified = TRUE, updated_at = NOW() WHERE id = $1', [
        userId,
      ]);

      // Log admin action
      if (adminId) {
        await client.query(
          `INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, details)
           VALUES ($1, 'user_activated', 'user', $2, '{}')`,
          [adminId, userId],
        );
      }

      await client.query('COMMIT');
      return { success: true, message: 'User activated successfully' };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getUserDetails(userId: string) {
    const result = await this.db.query(
      `
      SELECT u.id, u.email, u.role, u.is_verified, u.created_at, u.updated_at,
             up.first_name, up.last_name, up.phone, up.avatar_url
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE u.id = $1
    `,
      [userId],
    );

    if (result.rows.length === 0) {
      throw new NotFoundException('User not found');
    }

    const user = result.rows[0];

    // Get additional role-specific info
    let roleData = null;
    if (user.role === 'chef') {
      const chefResult = await this.db.query(
        'SELECT * FROM chefs WHERE user_id = $1',
        [userId],
      );
      roleData = chefResult.rows[0] || null;
    } else if (user.role === 'driver') {
      const driverResult = await this.db.query(
        'SELECT * FROM drivers WHERE user_id = $1',
        [userId],
      );
      roleData = driverResult.rows[0] || null;
    } else if (user.role === 'customer') {
      const customerResult = await this.db.query(
        'SELECT * FROM customers WHERE user_id = $1',
        [userId],
      );
      roleData = customerResult.rows[0] || null;
    }

    return {
      user: {
        ...user,
        roleData,
      },
    };
  }

  // ============================================================================
  // ORDERS MANAGEMENT
  // ============================================================================

  async listOrders(params: { status?: string; search?: string; page?: number; perPage?: number }) {
    const { status, search, page = 1, perPage = 20 } = params;
    const offset = (page - 1) * perPage;
    const values: (string | number)[] = [];
    let paramIndex = 1;

    let countSql = 'SELECT COUNT(*) as total FROM orders WHERE 1=1';
    let sql = `
      SELECT o.id, o.order_number, o.status, o.total_cents, o.created_at,
             o.delivery_address, o.customer_id, o.chef_id, o.driver_id,
             c.business_name as chef_name,
             u.email as customer_email
      FROM orders o
      LEFT JOIN chefs c ON o.chef_id = c.id
      LEFT JOIN customers cust ON o.customer_id = cust.id
      LEFT JOIN users u ON cust.user_id = u.id
      WHERE 1=1
    `;

    if (status) {
      const statusCondition = ` AND o.status = $${paramIndex++}`;
      sql += statusCondition;
      countSql += statusCondition;
      values.push(status);
    }

    if (search) {
      const searchCondition = ` AND (o.order_number ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`;
      sql += searchCondition;
      countSql += ` AND (order_number ILIKE $${paramIndex})`;
      values.push(`%${search}%`);
      paramIndex++;
    }

    // Get total count
    const countResult = await this.db.query(countSql, values.slice(0, search ? paramIndex - 1 : values.length));
    const total = parseInt(countResult.rows[0].total, 10);

    // Get paginated results
    sql += ` ORDER BY o.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    values.push(perPage, offset);

    const result = await this.db.query(sql, values);

    return {
      orders: result.rows,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  async getOrderDetails(orderId: string) {
    const orderResult = await this.db.query(
      `
      SELECT o.*,
             c.business_name as chef_name, c.address as chef_address,
             cu.email as customer_email,
             cup.first_name as customer_first_name, cup.last_name as customer_last_name,
             du.email as driver_email,
             dup.first_name as driver_first_name, dup.last_name as driver_last_name
      FROM orders o
      LEFT JOIN chefs c ON o.chef_id = c.id
      LEFT JOIN customers cust ON o.customer_id = cust.id
      LEFT JOIN users cu ON cust.user_id = cu.id
      LEFT JOIN user_profiles cup ON cu.id = cup.user_id
      LEFT JOIN drivers d ON o.driver_id = d.id
      LEFT JOIN users du ON d.user_id = du.id
      LEFT JOIN user_profiles dup ON du.id = dup.user_id
      WHERE o.id = $1
    `,
      [orderId],
    );

    if (orderResult.rows.length === 0) {
      throw new NotFoundException('Order not found');
    }

    // Get order items
    const itemsResult = await this.db.query(
      `
      SELECT oi.*, mi.name as menu_item_name, mi.description as menu_item_description
      FROM order_items oi
      LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
      WHERE oi.order_id = $1
    `,
      [orderId],
    );

    // Get payment info
    const paymentResult = await this.db.query('SELECT * FROM payments WHERE order_id = $1', [orderId]);

    // Get status history
    const historyResult = await this.db.query(
      'SELECT * FROM order_status_history WHERE order_id = $1 ORDER BY created_at DESC',
      [orderId],
    );

    return {
      order: {
        ...orderResult.rows[0],
        items: itemsResult.rows,
        payment: paymentResult.rows[0] || null,
        status_history: historyResult.rows,
      },
    };
  }

  async refundOrder(orderId: string, reason: string, adminId?: string) {
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');

      // Check order exists and is refundable
      const orderResult = await client.query(
        'SELECT id, status, total_cents FROM orders WHERE id = $1',
        [orderId],
      );

      if (orderResult.rows.length === 0) {
        throw new NotFoundException('Order not found');
      }

      const order = orderResult.rows[0];
      if (order.status === 'refunded') {
        throw new BadRequestException('Order is already refunded');
      }

      // Update order status
      await client.query(
        `UPDATE orders SET status = 'refunded', cancellation_reason = $1, cancelled_at = NOW(), updated_at = NOW()
         WHERE id = $2`,
        [reason, orderId],
      );

      // Update payment status
      await client.query(
        `UPDATE payments SET status = 'refunded', refund_amount_cents = $1, updated_at = NOW()
         WHERE order_id = $2`,
        [order.total_cents, orderId],
      );

      // Add to status history
      await client.query(
        `INSERT INTO order_status_history (order_id, status, notes, created_by)
         VALUES ($1, 'refunded', $2, $3)`,
        [orderId, reason, adminId],
      );

      // Log admin action
      if (adminId) {
        await client.query(
          `INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, details)
           VALUES ($1, 'order_refunded', 'order', $2, $3)`,
          [adminId, orderId, JSON.stringify({ reason, amount_cents: order.total_cents })],
        );
      }

      await client.query('COMMIT');
      return { success: true, message: 'Order refunded successfully', refundedAmount: order.total_cents };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // ============================================================================
  // COMMISSION & ANALYTICS
  // ============================================================================

  async getCommissionStats(period: 'day' | 'week' | 'month' | 'year'): Promise<CommissionStats> {
    // Determine date range based on period
    let intervalSql: string;
    let groupFormat: string;

    switch (period) {
      case 'day':
        intervalSql = "created_at >= NOW() - INTERVAL '24 hours'";
        groupFormat = 'YYYY-MM-DD HH24:00';
        break;
      case 'week':
        intervalSql = "created_at >= NOW() - INTERVAL '7 days'";
        groupFormat = 'YYYY-MM-DD';
        break;
      case 'month':
        intervalSql = "created_at >= NOW() - INTERVAL '30 days'";
        groupFormat = 'YYYY-MM-DD';
        break;
      case 'year':
        intervalSql = "created_at >= NOW() - INTERVAL '1 year'";
        groupFormat = 'YYYY-MM';
        break;
    }

    // Get aggregated stats
    const statsResult = await this.db.query(
      `
      SELECT
        COALESCE(SUM(total_cents), 0) as total_revenue,
        COALESCE(SUM(platform_fee_cents), 0) as total_commission,
        COUNT(*) as order_count,
        CASE WHEN COUNT(*) > 0 THEN ROUND(AVG(total_cents)) ELSE 0 END as avg_order_value
      FROM orders
      WHERE status = 'delivered' AND ${intervalSql}
    `,
    );

    // Get breakdown by date
    const byDateResult = await this.db.query(
      `
      SELECT
        TO_CHAR(created_at, '${groupFormat}') as date,
        COALESCE(SUM(total_cents), 0) as revenue,
        COALESCE(SUM(platform_fee_cents), 0) as commission
      FROM orders
      WHERE status = 'delivered' AND ${intervalSql}
      GROUP BY TO_CHAR(created_at, '${groupFormat}')
      ORDER BY date ASC
    `,
    );

    const stats = statsResult.rows[0];

    return {
      totalRevenue: parseInt(stats.total_revenue, 10),
      totalCommission: parseInt(stats.total_commission, 10),
      orderCount: parseInt(stats.order_count, 10),
      avgOrderValue: parseInt(stats.avg_order_value, 10),
      byDate: byDateResult.rows.map((row) => ({
        date: row.date,
        revenue: parseInt(row.revenue, 10),
        commission: parseInt(row.commission, 10),
      })),
    };
  }

  async getPayouts(status?: string) {
    const values: string[] = [];
    let sql = `
      SELECT p.*, u.email,
             CASE WHEN p.user_type = 'chef' THEN c.business_name
                  ELSE CONCAT(up.first_name, ' ', up.last_name) END as recipient_name
      FROM payouts p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      LEFT JOIN chefs c ON p.user_type = 'chef' AND u.id = c.user_id
      WHERE 1=1
    `;

    if (status) {
      sql += ' AND p.status = $1';
      values.push(status);
    }

    sql += ' ORDER BY p.created_at DESC LIMIT 200';

    const result = await this.db.query(sql, values);
    return { payouts: result.rows };
  }

  // ============================================================================
  // REVIEWS MANAGEMENT
  // ============================================================================

  async listReviews(revieweeType?: 'chef' | 'driver', flagged?: boolean) {
    const values: (string | boolean)[] = [];
    let paramIndex = 1;
    let sql = `
      SELECT r.id, r.order_id, r.reviewee_id, r.reviewee_type, r.rating, r.comment, r.created_at,
             o.order_number,
             reviewer.email as reviewer_email,
             CASE WHEN r.reviewee_type = 'chef' THEN c.business_name
                  ELSE CONCAT(dup.first_name, ' ', dup.last_name) END as reviewee_name
      FROM reviews r
      LEFT JOIN orders o ON r.order_id = o.id
      LEFT JOIN users reviewer ON r.reviewer_id = reviewer.id
      LEFT JOIN users reviewee_user ON r.reviewee_id = reviewee_user.id
      LEFT JOIN chefs c ON r.reviewee_type = 'chef' AND reviewee_user.id = c.user_id
      LEFT JOIN user_profiles dup ON r.reviewee_type = 'driver' AND reviewee_user.id = dup.user_id
      WHERE 1=1
    `;

    if (revieweeType) {
      sql += ` AND r.reviewee_type = $${paramIndex++}`;
      values.push(revieweeType);
    }

    // Flagged reviews typically have low ratings (1-2 stars) or certain keywords
    if (flagged) {
      sql += ` AND (r.rating <= 2)`;
    }

    sql += ' ORDER BY r.created_at DESC LIMIT 200';
    const result = await this.db.query(sql, values);
    return { reviews: result.rows };
  }

  async removeReview(reviewId: string, reason: string, adminId?: string) {
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');

      // Get review details before deletion
      const reviewResult = await client.query('SELECT * FROM reviews WHERE id = $1', [reviewId]);
      if (reviewResult.rows.length === 0) {
        throw new NotFoundException('Review not found');
      }

      const review = reviewResult.rows[0];

      // Delete the review
      await client.query('DELETE FROM reviews WHERE id = $1', [reviewId]);

      // Recalculate reviewee rating
      if (review.reviewee_type === 'chef') {
        await client.query(
          `
          UPDATE chefs SET rating = (
            SELECT COALESCE(AVG(r.rating), 0)
            FROM reviews r
            JOIN users u ON r.reviewee_id = u.id
            WHERE u.id = (SELECT user_id FROM chefs WHERE id = chefs.id) AND r.reviewee_type = 'chef'
          ), updated_at = NOW()
          WHERE user_id = $1
        `,
          [review.reviewee_id],
        );
      } else if (review.reviewee_type === 'driver') {
        await client.query(
          `
          UPDATE drivers SET average_rating = (
            SELECT COALESCE(AVG(r.rating), 0)
            FROM reviews r
            JOIN users u ON r.reviewee_id = u.id
            WHERE u.id = (SELECT user_id FROM drivers WHERE id = drivers.id) AND r.reviewee_type = 'driver'
          ), updated_at = NOW()
          WHERE user_id = $1
        `,
          [review.reviewee_id],
        );
      }

      // Log admin action
      if (adminId) {
        await client.query(
          `INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, details)
           VALUES ($1, 'review_removed', 'review', $2, $3)`,
          [adminId, reviewId, JSON.stringify({ reason, original_review: review })],
        );
      }

      await client.query('COMMIT');
      return { success: true, message: 'Review removed successfully' };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async flagReview(reviewId: string, adminId?: string) {
    // Note: This requires adding a 'is_flagged' column to reviews table
    // For now, we'll log the action and return success
    const result = await this.db.query('SELECT id FROM reviews WHERE id = $1', [reviewId]);
    if (result.rows.length === 0) {
      throw new NotFoundException('Review not found');
    }

    // Log admin action
    if (adminId) {
      await this.db.query(
        `INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, details)
         VALUES ($1, 'review_flagged', 'review', $2, '{}')`,
        [adminId, reviewId],
      );
    }

    return { success: true, message: 'Review flagged for moderation' };
  }

  async unflagReview(reviewId: string, adminId?: string) {
    const result = await this.db.query('SELECT id FROM reviews WHERE id = $1', [reviewId]);
    if (result.rows.length === 0) {
      throw new NotFoundException('Review not found');
    }

    // Log admin action
    if (adminId) {
      await this.db.query(
        `INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, details)
         VALUES ($1, 'review_unflagged', 'review', $2, '{}')`,
        [adminId, reviewId],
      );
    }

    return { success: true, message: 'Review unflagged' };
  }

  // ============================================================================
  // PLATFORM SETTINGS
  // ============================================================================

  async getSettings(): Promise<{ settings: PlatformSettings }> {
    // Try to get settings from database, fall back to defaults
    try {
      const result = await this.db.query('SELECT * FROM platform_settings LIMIT 1');
      if (result.rows.length > 0) {
        return { settings: result.rows[0] as PlatformSettings };
      }
    } catch {
      // Table might not exist, use defaults
    }

    return { settings: DEFAULT_SETTINGS };
  }

  async updateSettings(data: UpdateSettingsDto, adminId?: string): Promise<{ settings: PlatformSettings }> {
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');

      // Check if platform_settings table exists, create if not
      await client.query(`
        CREATE TABLE IF NOT EXISTS platform_settings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          platform_fee_percent DECIMAL(5,2) DEFAULT 15,
          minimum_order_cents INT DEFAULT 1000,
          delivery_fee_cents INT DEFAULT 499,
          driver_commission_percent DECIMAL(5,2) DEFAULT 80,
          chef_commission_percent DECIMAL(5,2) DEFAULT 85,
          maintenance_mode BOOLEAN DEFAULT FALSE,
          new_registrations_enabled BOOLEAN DEFAULT TRUE,
          orders_enabled BOOLEAN DEFAULT TRUE,
          support_email VARCHAR(255) DEFAULT 'support@ridendine.com',
          support_phone VARCHAR(50) DEFAULT '+1-800-RIDENDINE',
          tax_rate_percent DECIMAL(5,2) DEFAULT 8.25,
          max_delivery_radius_km DECIMAL(5,2) DEFAULT 25,
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Check if settings row exists
      const existsResult = await client.query('SELECT id FROM platform_settings LIMIT 1');

      if (existsResult.rows.length === 0) {
        // Insert initial settings
        await client.query(
          `INSERT INTO platform_settings (
            platform_fee_percent, minimum_order_cents, delivery_fee_cents,
            driver_commission_percent, chef_commission_percent, maintenance_mode,
            new_registrations_enabled, orders_enabled, support_email, support_phone,
            tax_rate_percent, max_delivery_radius_km
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            data.platform_fee_percent ?? DEFAULT_SETTINGS.platform_fee_percent,
            data.minimum_order_cents ?? DEFAULT_SETTINGS.minimum_order_cents,
            data.delivery_fee_cents ?? DEFAULT_SETTINGS.delivery_fee_cents,
            data.driver_commission_percent ?? DEFAULT_SETTINGS.driver_commission_percent,
            data.chef_commission_percent ?? DEFAULT_SETTINGS.chef_commission_percent,
            data.maintenance_mode ?? DEFAULT_SETTINGS.maintenance_mode,
            data.new_registrations_enabled ?? DEFAULT_SETTINGS.new_registrations_enabled,
            data.orders_enabled ?? DEFAULT_SETTINGS.orders_enabled,
            data.support_email ?? DEFAULT_SETTINGS.support_email,
            data.support_phone ?? DEFAULT_SETTINGS.support_phone,
            data.tax_rate_percent ?? DEFAULT_SETTINGS.tax_rate_percent,
            data.max_delivery_radius_km ?? DEFAULT_SETTINGS.max_delivery_radius_km,
          ],
        );
      } else {
        // Build dynamic update
        const updates: string[] = [];
        const values: (string | number | boolean)[] = [];
        let paramIndex = 1;

        const fields: (keyof UpdateSettingsDto)[] = [
          'platform_fee_percent',
          'minimum_order_cents',
          'delivery_fee_cents',
          'driver_commission_percent',
          'chef_commission_percent',
          'maintenance_mode',
          'new_registrations_enabled',
          'orders_enabled',
          'support_email',
          'support_phone',
          'tax_rate_percent',
          'max_delivery_radius_km',
        ];

        for (const field of fields) {
          if (data[field] !== undefined) {
            updates.push(`${field} = $${paramIndex++}`);
            values.push(data[field] as string | number | boolean);
          }
        }

        if (updates.length > 0) {
          updates.push(`updated_at = NOW()`);
          await client.query(`UPDATE platform_settings SET ${updates.join(', ')}`, values);
        }
      }

      // Log admin action
      if (adminId) {
        await client.query(
          `INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, details)
           VALUES ($1, 'settings_updated', 'platform', gen_random_uuid(), $2)`,
          [adminId, JSON.stringify(data)],
        );
      }

      await client.query('COMMIT');

      // Return updated settings
      const result = await this.db.query('SELECT * FROM platform_settings LIMIT 1');
      return { settings: result.rows[0] as PlatformSettings };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
