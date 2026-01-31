export interface CommissionBreakdown {
  subtotalCents: number;
  platformFeeCents: number;
  chefEarningsCents: number;
  taxCents: number;
  deliveryFeeCents: number;
  totalCents: number;
}

export interface LedgerEntry {
  type: 'order_earning' | 'delivery_earning' | 'platform_fee';
  amountCents: number;
}

export class CommissionCalculator {
  private static readonly PLATFORM_FEE_PERCENTAGE = 0.15; // 15%
  private static readonly TAX_PERCENTAGE = 0.08; // 8%
  private static readonly DEFAULT_DELIVERY_FEE_CENTS = 500; // $5.00 (Week 5 will calculate dynamically)

  /**
   * Calculate commission breakdown for an order
   */
  static calculate(subtotalCents: number, deliveryFeeCents?: number): CommissionBreakdown {
    // Calculate platform fee (15% of subtotal)
    const platformFeeCents = Math.round(subtotalCents * this.PLATFORM_FEE_PERCENTAGE);

    // Calculate chef earnings (subtotal minus platform fee)
    const chefEarningsCents = subtotalCents - platformFeeCents;

    // Calculate tax (8% of subtotal)
    const taxCents = Math.round(subtotalCents * this.TAX_PERCENTAGE);

    // Use provided delivery fee or default
    const finalDeliveryFeeCents = deliveryFeeCents ?? this.DEFAULT_DELIVERY_FEE_CENTS;

    // Calculate total (subtotal + tax + delivery)
    const totalCents = subtotalCents + taxCents + finalDeliveryFeeCents;

    return {
      subtotalCents,
      platformFeeCents,
      chefEarningsCents,
      taxCents,
      deliveryFeeCents: finalDeliveryFeeCents,
      totalCents,
    };
  }

  /**
   * Calculate chef ledger entry
   */
  static calculateChefLedgerEntry(subtotalCents: number): LedgerEntry {
    const breakdown = this.calculate(subtotalCents);

    return {
      type: 'order_earning',
      amountCents: breakdown.chefEarningsCents,
    };
  }

  /**
   * Calculate driver ledger entry
   */
  static calculateDriverLedgerEntry(deliveryFeeCents: number): LedgerEntry {
    return {
      type: 'delivery_earning',
      amountCents: deliveryFeeCents,
    };
  }

  /**
   * Calculate platform ledger entry
   */
  static calculatePlatformLedgerEntry(subtotalCents: number, taxCents: number): LedgerEntry {
    const breakdown = this.calculate(subtotalCents);

    return {
      type: 'platform_fee',
      amountCents: breakdown.platformFeeCents + taxCents,
    };
  }

  /**
   * Calculate refund amounts proportionally
   */
  static calculateRefund(
    originalTotalCents: number,
    refundAmountCents?: number,
  ): {
    refundAmountCents: number;
    chefRefundCents: number;
    platformRefundCents: number;
  } {
    // If no amount specified, refund full amount
    const actualRefundCents = refundAmountCents ?? originalTotalCents;

    // Calculate percentage being refunded
    const refundPercentage = actualRefundCents / originalTotalCents;

    // Estimate breakdown (this is simplified, real impl would look up original breakdown)
    const estimatedSubtotal = Math.round(originalTotalCents * 0.85); // rough estimate
    const breakdown = this.calculate(estimatedSubtotal);

    // Apply refund percentage to each component
    const chefRefundCents = Math.round(breakdown.chefEarningsCents * refundPercentage);
    const platformRefundCents = Math.round(breakdown.platformFeeCents * refundPercentage);

    return {
      refundAmountCents: actualRefundCents,
      chefRefundCents,
      platformRefundCents,
    };
  }

  /**
   * Format cents to dollar string for display
   */
  static formatCents(cents: number): string {
    return `$${(cents / 100).toFixed(2)}`;
  }

  /**
   * Get default delivery fee
   */
  static getDefaultDeliveryFee(): number {
    return this.DEFAULT_DELIVERY_FEE_CENTS;
  }
}
