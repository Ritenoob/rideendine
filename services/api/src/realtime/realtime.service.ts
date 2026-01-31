import { Injectable, Logger } from '@nestjs/common';
import { RealtimeGateway } from './realtime.gateway';

@Injectable()
export class RealtimeService {
  private readonly logger = new Logger(RealtimeService.name);

  constructor(private readonly gateway: RealtimeGateway) {}

  // Order lifecycle events
  notifyOrderCreated(orderId: string, chefUserId: string, orderData: any) {
    this.gateway.emitNewOrderToChef(chefUserId, {
      orderId,
      ...orderData,
    });
    this.logger.log(`Order ${orderId} created notification sent to chef ${chefUserId}`);
  }

  notifyOrderStatusChange(orderId: string, status: string, metadata?: any) {
    this.gateway.emitOrderStatusUpdate(orderId, status, metadata);
    this.logger.log(`Order ${orderId} status changed to ${status}`);
  }

  notifyOrderPaymentConfirmed(orderId: string, orderData: any) {
    this.notifyOrderStatusChange(orderId, 'payment_confirmed', orderData);
  }

  notifyOrderAccepted(orderId: string, chefName: string) {
    this.notifyOrderStatusChange(orderId, 'accepted', { chefName });
  }

  notifyOrderReady(orderId: string) {
    this.notifyOrderStatusChange(orderId, 'ready_for_pickup');
  }

  notifyOrderAssigned(orderId: string, driverData: any) {
    this.notifyOrderStatusChange(orderId, 'assigned_to_driver', {
      driverId: driverData.driverId,
      driverName: driverData.driverName,
      estimatedPickupTime: driverData.estimatedPickupTime,
    });
  }

  notifyOrderPickedUp(orderId: string) {
    this.notifyOrderStatusChange(orderId, 'picked_up');
  }

  notifyOrderInTransit(orderId: string, eta?: number) {
    this.notifyOrderStatusChange(orderId, 'in_transit', { eta });
  }

  notifyOrderDelivered(orderId: string) {
    this.notifyOrderStatusChange(orderId, 'delivered');
  }

  notifyOrderCancelled(orderId: string, reason?: string) {
    this.notifyOrderStatusChange(orderId, 'cancelled', { reason });
  }

  // Driver events
  notifyDriverAssignment(driverUserId: string, assignmentData: any) {
    this.gateway.emitDriverAssignment(driverUserId, assignmentData);
    this.logger.log(`Driver ${driverUserId} notified of new assignment`);
  }

  // ETA updates
  updateOrderETA(orderId: string, etaMinutes: number) {
    this.gateway.emitETAUpdate(orderId, etaMinutes);
    this.logger.log(`Order ${orderId} ETA updated to ${etaMinutes} minutes`);
  }

  // Utility methods
  isUserOnline(userId: string): boolean {
    return this.gateway.isUserOnline(userId);
  }

  getConnectedUsersCount(): number {
    return this.gateway.getConnectedUsersCount();
  }
}
