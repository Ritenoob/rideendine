export interface OrderTrackingDto {
  orderId: string;
  orderNumber: string;
  status: string;

  // Customer info
  customerName: string;
  deliveryAddress: string;
  deliveryLatitude: number;
  deliveryLongitude: number;

  // Chef info
  chefName: string;
  chefBusinessName: string;
  chefAddress: string;
  chefLatitude: number;
  chefLongitude: number;

  // Driver info (if assigned)
  driverAssigned: boolean;
  driverName?: string;
  driverPhone?: string;
  driverLatitude?: number;
  driverLongitude?: number;
  lastLocationUpdate?: Date;

  // Timeline
  estimatedDeliveryTime?: Date;
  etaMinutes?: number;

  // Status history
  statusHistory: {
    status: string;
    timestamp: Date;
    changedBy?: string;
  }[];

  // Timestamps
  createdAt: Date;
  paymentConfirmedAt?: Date;
  acceptedAt?: Date;
  readyAt?: Date;
  assignedAt?: Date;
  pickedUpAt?: Date;
  deliveredAt?: Date;
}
