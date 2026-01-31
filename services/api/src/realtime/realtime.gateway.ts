import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

interface AuthenticatedSocket extends Socket {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/realtime',
})
export class RealtimeGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(RealtimeGateway.name);
  private connectedUsers = new Map<string, string>(); // userId -> socketId

  constructor(private readonly jwtService: JwtService) {}

  afterInit(_server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token =
        client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        this.logger.warn(`Client ${client.id} connection rejected: No token provided`);
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token);
      client.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
      };

      this.connectedUsers.set(client.user.id, client.id);

      client.join(`user:${client.user.id}`);
      client.join(`role:${client.user.role}`);

      this.logger.log(
        `Client connected: ${client.id} | User: ${client.user.email} (${client.user.role})`,
      );

      client.emit('connected', {
        message: 'Successfully connected to RideNDine real-time service',
        userId: client.user.id,
        role: client.user.role,
      });
    } catch (error: any) {
      this.logger.error(`Authentication failed for client ${client.id}:`, error.message);
      client.emit('error', { message: 'Authentication failed' });
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.user) {
      this.connectedUsers.delete(client.user.id);
      this.logger.log(`Client disconnected: ${client.id} | User: ${client.user.email}`);
    } else {
      this.logger.log(`Client disconnected: ${client.id} (unauthenticated)`);
    }
  }

  @SubscribeMessage('subscribe:order')
  handleSubscribeOrder(
    @MessageBody() data: { orderId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.user) return;

    client.join(`order:${data.orderId}`);
    this.logger.log(`User ${client.user.id} subscribed to order ${data.orderId}`);

    return {
      event: 'subscribed:order',
      data: { orderId: data.orderId },
    };
  }

  @SubscribeMessage('unsubscribe:order')
  handleUnsubscribeOrder(
    @MessageBody() data: { orderId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.user) return;

    client.leave(`order:${data.orderId}`);
    this.logger.log(`User ${client.user.id} unsubscribed from order ${data.orderId}`);

    return {
      event: 'unsubscribed:order',
      data: { orderId: data.orderId },
    };
  }

  @SubscribeMessage('driver:location')
  async handleDriverLocation(
    @MessageBody() data: { latitude: number; longitude: number; orderId?: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.user || client.user.role !== 'driver') {
      return { event: 'error', data: { message: 'Unauthorized' } };
    }

    if (data.orderId) {
      this.server.to(`order:${data.orderId}`).emit('driver:location_update', {
        driverId: client.user.id,
        latitude: data.latitude,
        longitude: data.longitude,
        timestamp: new Date().toISOString(),
      });
    }

    return { event: 'driver:location_acknowledged', data: { timestamp: new Date() } };
  }

  // Emit order status update to all subscribers
  emitOrderStatusUpdate(orderId: string, status: string, metadata?: any) {
    this.server.to(`order:${orderId}`).emit('order:status_update', {
      orderId,
      status,
      timestamp: new Date().toISOString(),
      ...metadata,
    });

    this.logger.log(`Order ${orderId} status updated to: ${status}`);
  }

  // Emit new order to chefs
  emitNewOrderToChef(chefUserId: string, orderData: any) {
    this.server.to(`user:${chefUserId}`).emit('order:new', {
      ...orderData,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`New order notification sent to chef ${chefUserId}`);
  }

  // Emit driver assignment to driver
  emitDriverAssignment(driverUserId: string, assignmentData: any) {
    this.server.to(`user:${driverUserId}`).emit('driver:new_assignment', {
      ...assignmentData,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`Assignment notification sent to driver ${driverUserId}`);
  }

  // Emit ETA update
  emitETAUpdate(orderId: string, etaMinutes: number) {
    this.server.to(`order:${orderId}`).emit('order:eta_update', {
      orderId,
      etaMinutes,
      timestamp: new Date().toISOString(),
    });
  }

  // Get connected users count
  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  // Check if user is online
  isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }
}
