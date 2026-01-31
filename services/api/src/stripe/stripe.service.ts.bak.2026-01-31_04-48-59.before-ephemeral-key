import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { StripeAccountStatusDto } from './dto/stripe.dto';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private readonly stripe: Stripe;

  constructor(private readonly configService: ConfigService) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }

    this.stripe = new Stripe(secretKey, {
      apiVersion: '2026-01-28.clover',
    });

    this.logger.log('Stripe SDK initialized');
  }

  /**
   * Create a Stripe Connect Express account for a chef
   */
  async createConnectAccount(email: string, country = 'US'): Promise<string> {
    try {
      const account = await this.stripe.accounts.create({
        type: 'express',
        country,
        email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
      });

      this.logger.log(`Created Stripe account: ${account.id} for ${email}`);
      return account.id;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to create Stripe account: ${errorMessage}`);
      throw new InternalServerErrorException('Failed to create Stripe account');
    }
  }

  /**
   * Generate an account link for onboarding
   */
  async createAccountLink(
    accountId: string,
    refreshUrl: string,
    returnUrl: string,
  ): Promise<Stripe.AccountLink> {
    try {
      const accountLink = await this.stripe.accountLinks.create({
        account: accountId,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: 'account_onboarding',
      });

      this.logger.log(`Created account link for: ${accountId}`);
      return accountLink;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to create account link: ${errorMessage}`);
      throw new InternalServerErrorException('Failed to create account link');
    }
  }

  /**
   * Get the status of a Stripe Connect account
   */
  async getAccountStatus(accountId: string): Promise<StripeAccountStatusDto> {
    try {
      const account = await this.stripe.accounts.retrieve(accountId);

      const status: StripeAccountStatusDto = {
        accountId: account.id,
        onboardingComplete: account.details_submitted || false,
        chargesEnabled: account.charges_enabled || false,
        payoutsEnabled: account.payouts_enabled || false,
        detailsSubmitted: account.details_submitted || false,
        requiresInformation: (account.requirements?.currently_due?.length || 0) > 0,
        requirements: account.requirements
          ? {
              currently_due: account.requirements.currently_due || [],
              eventually_due: account.requirements.eventually_due || [],
              past_due: account.requirements.past_due || [],
            }
          : undefined,
      };

      this.logger.log(`Retrieved account status for: ${accountId}`);
      return status;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to get account status: ${errorMessage}`);
      throw new InternalServerErrorException('Failed to retrieve account status');
    }
  }

  /**
   * Construct and verify a webhook event
   */
  constructWebhookEvent(payload: string | Buffer, signature: string): Stripe.Event {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
    }

    try {
      const event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
      return event;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Invalid signature';
      this.logger.error(`Webhook signature verification failed: ${errorMessage}`);
      throw new Error('Invalid webhook signature');
    }
  }

  /**
   * Get Stripe instance for advanced operations
   */
  getStripeInstance(): Stripe {
    return this.stripe;
  }

  /**
   * Create a PaymentIntent for an order
   */
  async createPaymentIntent(params: {
    amountCents: number;
    currency?: string;
    customerId?: string;
    chefStripeAccountId: string;
    orderId: string;
    orderNumber: string;
    applicationFeeCents: number;
  }): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: params.amountCents,
        currency: params.currency || 'usd',
        customer: params.customerId,
        application_fee_amount: params.applicationFeeCents,
        transfer_data: {
          destination: params.chefStripeAccountId,
        },
        metadata: {
          order_id: params.orderId,
          order_number: params.orderNumber,
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      this.logger.log(
        `Created PaymentIntent ${paymentIntent.id} for order ${params.orderNumber}`,
      );
      return paymentIntent;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to create PaymentIntent: ${errorMessage}`);
      throw new InternalServerErrorException('Failed to create payment');
    }
  }

  /**
   * Retrieve a PaymentIntent
   */
  async retrievePaymentIntent(
    paymentIntentId: string,
  ): Promise<Stripe.PaymentIntent> {
    try {
      return await this.stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to retrieve PaymentIntent: ${errorMessage}`);
      throw new InternalServerErrorException('Failed to retrieve payment');
    }
  }

  /**
   * Cancel a PaymentIntent
   */
  async cancelPaymentIntent(
    paymentIntentId: string,
  ): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent =
        await this.stripe.paymentIntents.cancel(paymentIntentId);
      this.logger.log(`Cancelled PaymentIntent: ${paymentIntentId}`);
      return paymentIntent;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to cancel PaymentIntent: ${errorMessage}`);
      throw new InternalServerErrorException('Failed to cancel payment');
    }
  }

  /**
   * Create a refund for a PaymentIntent
   */
  async createRefund(params: {
    paymentIntentId: string;
    amountCents?: number;
    reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
  }): Promise<Stripe.Refund> {
    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: params.paymentIntentId,
        amount: params.amountCents,
        reason: params.reason || 'requested_by_customer',
      });

      this.logger.log(
        `Created refund ${refund.id} for PaymentIntent ${params.paymentIntentId}`,
      );
      return refund;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to create refund: ${errorMessage}`);
      throw new InternalServerErrorException('Failed to create refund');
    }
  }

  /**
   * Create or retrieve a Stripe Customer
   */
  async createOrRetrieveCustomer(params: {
    email: string;
    name?: string;
    existingCustomerId?: string;
  }): Promise<Stripe.Customer> {
    try {
      if (params.existingCustomerId) {
        return (await this.stripe.customers.retrieve(
          params.existingCustomerId,
        )) as Stripe.Customer;
      }

      const customer = await this.stripe.customers.create({
        email: params.email,
        name: params.name,
      });

      this.logger.log(`Created Stripe customer: ${customer.id}`);
      return customer;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to create/retrieve customer: ${errorMessage}`);
      throw new InternalServerErrorException('Failed to process customer');
    }
  }
}
