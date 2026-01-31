export enum OrderStatus {
  PENDING = 'pending',
  PAYMENT_CONFIRMED = 'payment_confirmed',
  ACCEPTED = 'accepted',
  PREPARING = 'preparing',
  READY_FOR_PICKUP = 'ready_for_pickup',
  ASSIGNED_TO_DRIVER = 'assigned_to_driver',
  PICKED_UP = 'picked_up',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REJECTED = 'rejected',
  REFUNDED = 'refunded',
}

export class OrderStateMachine {
  private static readonly transitions: Record<OrderStatus, OrderStatus[]> = {
    [OrderStatus.PENDING]: [
      OrderStatus.PAYMENT_CONFIRMED,
      OrderStatus.CANCELLED,
    ],
    [OrderStatus.PAYMENT_CONFIRMED]: [
      OrderStatus.ACCEPTED,
      OrderStatus.REJECTED,
      OrderStatus.CANCELLED,
    ],
    [OrderStatus.ACCEPTED]: [
      OrderStatus.PREPARING,
      OrderStatus.READY_FOR_PICKUP,
      OrderStatus.CANCELLED,
    ],
    [OrderStatus.PREPARING]: [
      OrderStatus.READY_FOR_PICKUP,
      OrderStatus.CANCELLED,
    ],
    [OrderStatus.READY_FOR_PICKUP]: [
      OrderStatus.ASSIGNED_TO_DRIVER,
      OrderStatus.CANCELLED,
    ],
    [OrderStatus.ASSIGNED_TO_DRIVER]: [
      OrderStatus.PICKED_UP,
      OrderStatus.READY_FOR_PICKUP, // driver unassigned
      OrderStatus.CANCELLED,
    ],
    [OrderStatus.PICKED_UP]: [
      OrderStatus.IN_TRANSIT,
      OrderStatus.DELIVERED,
    ],
    [OrderStatus.IN_TRANSIT]: [
      OrderStatus.DELIVERED,
    ],
    [OrderStatus.DELIVERED]: [], // terminal state
    [OrderStatus.CANCELLED]: [
      OrderStatus.REFUNDED,
    ],
    [OrderStatus.REJECTED]: [
      OrderStatus.REFUNDED,
    ],
    [OrderStatus.REFUNDED]: [], // terminal state
  };

  /**
   * Check if a state transition is valid
   */
  static canTransition(from: OrderStatus, to: OrderStatus): boolean {
    const validTransitions = this.transitions[from] || [];
    return validTransitions.includes(to);
  }

  /**
   * Get list of valid transitions from current state
   */
  static getValidTransitions(from: OrderStatus): OrderStatus[] {
    return this.transitions[from] || [];
  }

  /**
   * Check if a state requires refund when cancelled
   */
  static requiresRefund(status: OrderStatus): boolean {
    return [
      OrderStatus.PAYMENT_CONFIRMED,
      OrderStatus.ACCEPTED,
      OrderStatus.PREPARING,
      OrderStatus.READY_FOR_PICKUP,
      OrderStatus.ASSIGNED_TO_DRIVER,
      OrderStatus.PICKED_UP,
      OrderStatus.REJECTED,
    ].includes(status);
  }

  /**
   * Check if order is in terminal state (no more transitions)
   */
  static isTerminal(status: OrderStatus): boolean {
    return this.transitions[status].length === 0;
  }

  /**
   * Check if order is active (not cancelled, rejected, refunded, or delivered)
   */
  static isActive(status: OrderStatus): boolean {
    return ![
      OrderStatus.DELIVERED,
      OrderStatus.CANCELLED,
      OrderStatus.REJECTED,
      OrderStatus.REFUNDED,
    ].includes(status);
  }

  /**
   * Validate transition or throw error
   */
  static validateTransition(from: OrderStatus, to: OrderStatus): void {
    if (!this.canTransition(from, to)) {
      throw new Error(
        `Invalid state transition from ${from} to ${to}. ` +
        `Valid transitions are: ${this.getValidTransitions(from).join(', ')}`
      );
    }
  }
}
