import { Injectable, Inject, Logger, BadRequestException } from '@nestjs/common';
import { Pool } from 'pg';
import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import { RegisterDeviceTokenDto, NotificationPayload } from './dto/notification.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly expo: Expo;

  constructor(@Inject('DATABASE_POOL') private db: Pool) {
    this.expo = new Expo();
  }

  /**
   * Register a device token for push notifications
   */
  async registerDeviceToken(userId: string, dto: RegisterDeviceTokenDto): Promise<{ success: boolean }> {
    // Validate token format
    if (!Expo.isExpoPushToken(dto.token)) {
      throw new BadRequestException('Invalid Expo push token format');
    }

    // Check if token already exists for this user
    const existing = await this.db.query(
      'SELECT id FROM device_tokens WHERE user_id = $1 AND token = $2',
      [userId, dto.token],
    );

    if (existing.rows.length > 0) {
      // Update last seen
      await this.db.query(
        'UPDATE device_tokens SET last_seen_at = NOW(), is_active = true WHERE id = $1',
        [existing.rows[0].id],
      );
    } else {
      // Insert new token
      await this.db.query(
        `INSERT INTO device_tokens 
         (user_id, token, platform, device_id, is_active, last_seen_at)
         VALUES ($1, $2, $3, $4, true, NOW())`,
        [userId, dto.token, dto.platform, dto.deviceId],
      );
    }

    this.logger.log(`Registered device token for user ${userId}`);
    return { success: true };
  }

  /**
   * Unregister a device token
   */
  async unregisterDeviceToken(userId: string, token: string): Promise<{ success: boolean }> {
    await this.db.query(
      'UPDATE device_tokens SET is_active = false WHERE user_id = $1 AND token = $2',
      [userId, token],
    );

    return { success: true };
  }

  /**
   * Send push notification to a user
   */
  async sendToUser(userId: string, payload: NotificationPayload): Promise<void> {
    // Get all active tokens for this user
    const result = await this.db.query(
      'SELECT token FROM device_tokens WHERE user_id = $1 AND is_active = true',
      [userId],
    );

    if (result.rows.length === 0) {
      this.logger.warn(`No active device tokens found for user ${userId}`);
      return;
    }

    const tokens = result.rows.map((row) => row.token);
    await this.sendToTokens(tokens, payload);
  }

  /**
   * Send push notification to multiple tokens
   */
  async sendToTokens(tokens: string[], payload: NotificationPayload): Promise<void> {
    // Filter valid Expo push tokens
    const validTokens = tokens.filter((token) => Expo.isExpoPushToken(token));

    if (validTokens.length === 0) {
      this.logger.warn('No valid Expo push tokens to send to');
      return;
    }

    // Construct messages
    const messages: ExpoPushMessage[] = validTokens.map((token) => ({
      to: token,
      sound: payload.sound || 'default',
      title: payload.title,
      body: payload.body,
      data: payload.data || {},
      badge: payload.badge,
    }));

    // Send in chunks
    const chunks = this.expo.chunkPushNotifications(messages);
    const tickets: ExpoPushTicket[] = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
        this.logger.log(`Sent ${chunk.length} push notifications`);
      } catch (error) {
        this.logger.error(`Error sending push notifications: ${error}`);
      }
    }

    // Handle errors in tickets
    for (let i = 0; i < tickets.length; i++) {
      const ticket = tickets[i];
      if (ticket.status === 'error') {
        this.logger.error(
          `Push notification error for token ${validTokens[i]}: ${ticket.message}`,
        );

        // If token is invalid, mark as inactive
        if (ticket.details?.error === 'DeviceNotRegistered') {
          await this.db.query(
            'UPDATE device_tokens SET is_active = false WHERE token = $1',
            [validTokens[i]],
          );
        }
      }
    }
  }

  /**
   * Send notification to all drivers
   */
  async sendToAllDrivers(payload: NotificationPayload): Promise<void> {
    const result = await this.db.query(
      `SELECT DISTINCT dt.token 
       FROM device_tokens dt
       JOIN users u ON dt.user_id = u.id
       WHERE u.role = 'driver' AND dt.is_active = true`,
    );

    const tokens = result.rows.map((row) => row.token);
    await this.sendToTokens(tokens, payload);
  }

  /**
   * Send notification to all chefs
   */
  async sendToAllChefs(payload: NotificationPayload): Promise<void> {
    const result = await this.db.query(
      `SELECT DISTINCT dt.token 
       FROM device_tokens dt
       JOIN users u ON dt.user_id = u.id
       WHERE u.role = 'chef' AND dt.is_active = true`,
    );

    const tokens = result.rows.map((row) => row.token);
    await this.sendToTokens(tokens, payload);
  }

  /**
   * Send order update notification
   */
  async sendOrderUpdate(
    userId: string,
    orderId: string,
    orderNumber: string,
    status: string,
    message: string,
  ): Promise<void> {
    await this.sendToUser(userId, {
      title: `Order ${orderNumber}`,
      body: message,
      data: {
        type: 'order_update',
        orderId,
        orderNumber,
        status,
      },
      badge: 1,
    });
  }
}
