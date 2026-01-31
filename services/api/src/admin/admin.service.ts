import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';

@Injectable()
export class AdminService {
  constructor(@Inject('DATABASE_POOL') private db: Pool) {}

  async listChefs(status?: string) {
    const values: string[] = [];
    let sql = `
      SELECT c.id, c.business_name, c.verification_status, c.rating, c.address, u.email
      FROM chefs c
      JOIN users u ON c.user_id = u.id
    `;
    if (status) {
      sql += ' WHERE c.verification_status = $1';
      values.push(status);
    }
    sql += ' ORDER BY c.created_at DESC LIMIT 200';
    const result = await this.db.query(sql, values);
    return { chefs: result.rows };
  }

  async updateChefStatus(chefId: string, status: 'approved' | 'rejected') {
    const result = await this.db.query(
      'UPDATE chefs SET verification_status = $1, updated_at = NOW() WHERE id = $2 RETURNING id, verification_status',
      [status, chefId],
    );
    return { chef: result.rows[0] || null };
  }

  async listDrivers(status?: string) {
    const values: (string | boolean)[] = [];
    let sql = `
      SELECT d.id, d.is_available, d.total_deliveries, d.rating, u.email
      FROM drivers d
      JOIN users u ON d.user_id = u.id
    `;
    if (status) {
      sql += ' WHERE d.is_available = $1';
      values.push(status === 'active');
    }
    sql += ' ORDER BY d.created_at DESC LIMIT 200';
    const result = await this.db.query(sql, values);
    return { drivers: result.rows };
  }

  async listOrders(status?: string) {
    const values: string[] = [];
    let sql = `
      SELECT id, status, order_number, total_cents, created_at
      FROM orders
    `;
    if (status) {
      sql += ' WHERE status = $1';
      values.push(status);
    }
    sql += ' ORDER BY created_at DESC LIMIT 200';
    const result = await this.db.query(sql, values);
    return { orders: result.rows };
  }

  async listReviews(revieweeType?: 'chef' | 'driver') {
    const values: string[] = [];
    let sql = `
      SELECT id, order_id, reviewee_id, reviewee_type, rating, comment, created_at
      FROM reviews
    `;
    if (revieweeType) {
      sql += ' WHERE reviewee_type = $1';
      values.push(revieweeType);
    }
    sql += ' ORDER BY created_at DESC LIMIT 200';
    const result = await this.db.query(sql, values);
    return { reviews: result.rows };
  }
}
