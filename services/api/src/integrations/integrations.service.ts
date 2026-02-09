import { Injectable, Inject, BadRequestException, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import * as crypto from 'crypto';
import axios from 'axios';
import { CoocoWebhookDto, MealbridgeDispatchDto } from './dto/integrations.dto';

@Injectable()
export class IntegrationsService {
  private readonly logger = new Logger(IntegrationsService.name);

  constructor(@Inject('DATABASE_POOL') private db: Pool) {}

  /**
   * Process incoming Cooco webhook order
   */
  async processCoocoOrder(webhookData: CoocoWebhookDto) {
    // Verify webhook signature
    const isValid = this.verifyCoocoSignature(webhookData);
    if (!isValid) {
      throw new BadRequestException('Invalid webhook signature');
    }

    const client = await this.db.connect();
    try {
      await client.query('BEGIN');

      // Create order record
      const orderResult = await client.query(
        `INSERT INTO orders (
          chef_id, source, external_order_id, customer_email, customer_phone,
          delivery_address, subtotal, tax, delivery_fee, total, status, payment_status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING id`,
        [
          webhookData.chefId,
          'cooco',
          webhookData.coocoOrderId,
          webhookData.customerEmail,
          webhookData.customerPhone || null,
          JSON.stringify(webhookData.deliveryAddress),
          webhookData.subtotalInCents,
          webhookData.taxInCents,
          webhookData.deliveryFeeInCents,
          webhookData.totalInCents,
          'PENDING',
          'PAID', // Cooco orders are pre-paid
        ],
      );

      const orderId = orderResult.rows[0].id;

      // Create order items
      for (const item of webhookData.items) {
        await client.query(
          `INSERT INTO order_items (order_id, name, quantity, price, special_instructions)
           VALUES ($1, $2, $3, $4, $5)`,
          [orderId, item.name, item.quantity, item.priceInCents, item.specialInstructions || null],
        );
      }

      // Log integration event
      await this.logIntegrationEvent({
        source: 'cooco',
        eventType: 'order_received',
        orderId,
        payload: webhookData,
        status: 'success',
      });

      await client.query('COMMIT');

      // Trigger Mealbridge dispatch (async - don't block webhook response)
      this.dispatchToMealbridge(orderId).catch((error) => {
        this.logger.error(`Failed to dispatch order ${orderId} to Mealbridge: ${(error as Error).message}`);
      });

      return {
        success: true,
        orderId,
        message: 'Order received and queued for delivery',
      };
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error(`Cooco order processing failed: ${(error as Error).message}`, (error as Error).stack);
      
      // Log failed event
      await this.logIntegrationEvent({
        source: 'cooco',
        eventType: 'order_received',
        orderId: null,
        payload: webhookData,
        status: 'failed',
        errorMessage: (error as Error).message,
      });

      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Dispatch order to Mealbridge for delivery
   */
  async dispatchToMealbridge(orderId: string) {
    // Get order details
    const orderResult = await this.db.query(
      `SELECT o.*, c.business_name, c.address as chef_address, c.phone as chef_phone
       FROM orders o
       JOIN chefs c ON o.chef_id = c.id
       WHERE o.id = $1`,
      [orderId],
    );

    if (orderResult.rows.length === 0) {
      throw new Error('Order not found');
    }

    const order = orderResult.rows[0];
    const deliveryAddress = JSON.parse(order.delivery_address);
    const chefAddress = JSON.parse(order.chef_address);

    // Prepare Mealbridge dispatch request
    const dispatchPayload: MealbridgeDispatchDto = {
      orderId: order.id,
      pickupLocation: {
        name: order.business_name,
        street: chefAddress.street,
        city: chefAddress.city,
        state: chefAddress.state,
        zipCode: chefAddress.zipCode,
        latitude: chefAddress.latitude,
        longitude: chefAddress.longitude,
        phone: order.chef_phone,
      },
      deliveryLocation: {
        name: 'Customer',
        street: deliveryAddress.street,
        city: deliveryAddress.city,
        state: deliveryAddress.state,
        zipCode: deliveryAddress.zipCode,
        latitude: deliveryAddress.latitude,
        longitude: deliveryAddress.longitude,
        phone: order.customer_phone,
      },
      deliveryWindowStart: new Date(Date.now() + 30 * 60000).toISOString(), // 30 mins from now
      deliveryWindowEnd: new Date(Date.now() + 90 * 60000).toISOString(), // 90 mins from now
      instructions: order.delivery_instructions || '',
    };

    try {
      const response = await axios.post(
        `${process.env.MEALBRIDGE_BASE_URL}/api/v1/dispatch`,
        dispatchPayload,
        {
          headers: {
            'Authorization': `Bearer ${process.env.MEALBRIDGE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        },
      );

      const dispatchId = response.data.dispatchId;

      // Update order with dispatch ID
      await this.db.query(
        `UPDATE orders SET mealbridge_dispatch_id = $1, status = $2 WHERE id = $3`,
        [dispatchId, 'CONFIRMED', orderId],
      );

      // Log successful dispatch
      await this.logIntegrationEvent({
        source: 'mealbridge',
        eventType: 'dispatch_created',
        orderId,
        payload: { dispatchId, ...dispatchPayload },
        status: 'success',
      });

      return {
        success: true,
        dispatchId,
      };
    } catch (error) {
      this.logger.error(`Mealbridge dispatch failed: ${(error as Error).message}`, (error as Error).stack);

      // Log failed dispatch
      await this.logIntegrationEvent({
        source: 'mealbridge',
        eventType: 'dispatch_created',
        orderId,
        payload: dispatchPayload,
        status: 'failed',
        errorMessage: (error as Error).message,
      });

      throw error;
    }
  }

  /**
   * Get integration events (for admin dashboard)
   */
  async getIntegrationEvents(filters?: {
    source?: 'cooco' | 'mealbridge';
    status?: 'success' | 'failed';
    limit?: number;
    offset?: number;
  }) {
    const { source, status, limit = 50, offset = 0 } = filters || {};

    let query = 'SELECT * FROM integration_events WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (source) {
      query += ` AND source = $${paramIndex}`;
      params.push(source);
      paramIndex++;
    }

    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await this.db.query(query, params);

    return {
      events: result.rows,
      total: result.rowCount,
      limit,
      offset,
    };
  }

  /**
   * Verify Cooco webhook signature
   */
  private verifyCoocoSignature(webhookData: CoocoWebhookDto): boolean {
    const secret = process.env.COOCO_WEBHOOK_SECRET;
    if (!secret) {
      this.logger.warn('COOCO_WEBHOOK_SECRET not set - skipping signature verification');
      return true; // Allow in dev/test
    }

    // Create signature from payload (excluding the signature field itself)
    const { signature, ...payload } = webhookData;
    const payloadString = JSON.stringify(payload);
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payloadString)
      .digest('hex');

    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  }

  /**
   * Log integration event for tracking and debugging
   */
  private async logIntegrationEvent(event: {
    source: string;
    eventType: string;
    orderId: string | null;
    payload: any;
    status: string;
    errorMessage?: string;
  }) {
    try {
      await this.db.query(
        `INSERT INTO integration_events (source, event_type, order_id, payload, status, error_message)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          event.source,
          event.eventType,
          event.orderId,
          JSON.stringify(event.payload),
          event.status,
          event.errorMessage || null,
        ],
      );
    } catch (error) {
      this.logger.error(`Failed to log integration event: ${(error as Error).message}`, (error as Error).stack);
    }
  }
}
