import {
  Controller,
  Post,
  Headers,
  Req,
  HttpCode,
  HttpStatus,
  Logger,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { StripeService } from './stripe.service';
import { ChefsService } from '../chefs/chefs.service';
import { OrdersService } from '../orders/orders.service';
import { Request } from 'express';
import Stripe from 'stripe';

interface RawBodyRequest extends Request {
  rawBody?: Buffer;
}

@Controller('webhooks')
export class StripeWebhookController {
  private readonly logger = new Logger(StripeWebhookController.name);

  constructor(
    private readonly stripeService: StripeService,
    private readonly chefsService: ChefsService,
    @Inject(forwardRef(() => OrdersService))
    private readonly ordersService: OrdersService,
  ) {}

  @Post('stripe')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Req() req: RawBodyRequest,
    @Headers('stripe-signature') signature: string,
  ): Promise<{ received: boolean }> {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    let event: Stripe.Event;

    try {
      // Get raw body (must be raw, not JSON parsed)
      const rawBody = req.rawBody || Buffer.from(JSON.stringify(req.body));

      // Construct and verify webhook event
      event = this.stripeService.constructWebhookEvent(rawBody, signature);

      this.logger.log(`Received Stripe webhook: ${event.type} (${event.id})`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Webhook signature verification failed: ${errorMessage}`);
      throw new BadRequestException('Invalid webhook signature');
    }

    // Handle different event types
    try {
      await this.handleEvent(event);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      const errorStack = err instanceof Error ? err.stack : undefined;
      this.logger.error(`Error handling webhook ${event.type}: ${errorMessage}`, errorStack);
      // Still return 200 to acknowledge receipt (prevent retries for app errors)
    }

    return { received: true };
  }

  private async handleEvent(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'account.updated':
        await this.handleAccountUpdated(event.data.object as unknown as Stripe.Account);
        break;

      case 'account.application.deauthorized':
        await this.handleAccountDeauthorized(event.data.object as unknown as Stripe.Account);
        break;

      case 'payment_intent.succeeded':
        await this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await this.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      default:
        this.logger.debug(`Unhandled webhook event type: ${event.type}`);
    }
  }

  private async handleAccountUpdated(account: Stripe.Account): Promise<void> {
    this.logger.log(`Handling account.updated for: ${account.id}`);

    try {
      await this.chefsService.handleStripeAccountUpdate(account.id);
      this.logger.log(`Successfully updated chef for Stripe account: ${account.id}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to update chef for account ${account.id}: ${errorMessage}`);
      throw error;
    }
  }

  private async handleAccountDeauthorized(account: Stripe.Account): Promise<void> {
    this.logger.log(`Handling account.application.deauthorized for: ${account.id}`);

    try {
      await this.chefsService.handleStripeAccountDeauthorized(account.id);
      this.logger.log(`Successfully deauthorized chef for Stripe account: ${account.id}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to deauthorize chef for account ${account.id}: ${errorMessage}`);
      throw error;
    }
  }

  private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    this.logger.log(`Handling payment_intent.succeeded for: ${paymentIntent.id}`);

    const orderId = paymentIntent.metadata?.order_id;
    if (!orderId) {
      this.logger.warn(`PaymentIntent ${paymentIntent.id} has no order_id in metadata`);
      return;
    }

    try {
      await this.ordersService.handlePaymentConfirmed(orderId, paymentIntent.id);
      this.logger.log(`Successfully confirmed payment for order: ${orderId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to confirm payment for order ${orderId}: ${errorMessage}`);
      throw error;
    }
  }

  private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    this.logger.log(`Handling payment_intent.payment_failed for: ${paymentIntent.id}`);

    const orderId = paymentIntent.metadata?.order_id;
    if (!orderId) {
      this.logger.warn(`PaymentIntent ${paymentIntent.id} has no order_id in metadata`);
      return;
    }

    const errorMessage = paymentIntent.last_payment_error?.message || 'Payment failed';
    this.logger.error(`Payment failed for order ${orderId}: ${errorMessage}`);
  }
}
