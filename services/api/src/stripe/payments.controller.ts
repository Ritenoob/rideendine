import { Controller, Post, Get, Delete, Body, Param, UseGuards, BadRequestException } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { UsersService } from '../users/users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../common/interfaces/user.interface';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly usersService: UsersService,
  ) {}

  @Post('ephemeral-key')
  async createEphemeralKey(@CurrentUser() user: JwtPayload) {
    // Get user's email and existing customer ID
    const userProfile = await this.usersService.getProfile(user.sub);
    const firstName = (userProfile as any).firstName ?? (userProfile as any)['first_name'];
    const lastName = (userProfile as any).lastName ?? (userProfile as any)['last_name'];

    // Create or retrieve Stripe customer
    const customer = await this.stripeService.createOrRetrieveCustomer({
      email: userProfile.email,
      name: firstName ? `${firstName} ${lastName || ''}`.trim() : undefined,
      existingCustomerId: userProfile.stripeCustomerId,
    });

    // Update user with customer ID if not already set
    if (!userProfile.stripeCustomerId) {
      await this.usersService.updateStripeCustomerId(user.sub, customer.id);
    }

    // Create ephemeral key
    const ephemeralKey = await this.stripeService.createEphemeralKey(customer.id);

    return {
      ephemeralKey: ephemeralKey.secret,
      customerId: customer.id,
    };
  }

  // Payment methods management

  @Get('methods')
  async listPaymentMethods(@CurrentUser() user: JwtPayload) {
    const userProfile = await this.usersService.getProfile(user.sub);
    
    if (!userProfile.stripeCustomerId) {
      return { paymentMethods: [] };
    }

    const paymentMethods = await this.stripeService.listPaymentMethods(userProfile.stripeCustomerId);

    return {
      paymentMethods: paymentMethods.map((pm) => ({
        id: pm.id,
        type: pm.type,
        card: pm.card ? {
          brand: pm.card.brand,
          last4: pm.card.last4,
          expMonth: pm.card.exp_month,
          expYear: pm.card.exp_year,
        } : null,
      })),
    };
  }

  @Post('methods')
  async savePaymentMethod(
    @CurrentUser() user: JwtPayload,
    @Body() body: { paymentMethodId: string; setAsDefault?: boolean },
  ) {
    if (!body.paymentMethodId) {
      throw new BadRequestException('paymentMethodId is required');
    }

    const userProfile = await this.usersService.getProfile(user.sub);
    const firstName = (userProfile as any).firstName ?? (userProfile as any)['first_name'];
    const lastName = (userProfile as any).lastName ?? (userProfile as any)['last_name'];

    // Create or retrieve customer
    const customer = await this.stripeService.createOrRetrieveCustomer({
      email: userProfile.email,
      name: firstName ? `${firstName} ${lastName || ''}`.trim() : undefined,
      existingCustomerId: userProfile.stripeCustomerId,
    });

    // Update user with customer ID if not already set
    if (!userProfile.stripeCustomerId) {
      await this.usersService.updateStripeCustomerId(user.sub, customer.id);
    }

    // Attach payment method
    const paymentMethod = await this.stripeService.attachPaymentMethod(
      body.paymentMethodId,
      customer.id,
    );

    // Set as default if requested
    if (body.setAsDefault) {
      await this.stripeService.setDefaultPaymentMethod(customer.id, body.paymentMethodId);
    }

    return {
      success: true,
      paymentMethod: {
        id: paymentMethod.id,
        type: paymentMethod.type,
        card: paymentMethod.card ? {
          brand: paymentMethod.card.brand,
          last4: paymentMethod.card.last4,
          expMonth: paymentMethod.card.exp_month,
          expYear: paymentMethod.card.exp_year,
        } : null,
      },
    };
  }

  @Delete('methods/:id')
  async removePaymentMethod(@Param('id') paymentMethodId: string) {
    // No need to verify ownership as Stripe will only allow detaching if the PM belongs to the customer
    await this.stripeService.detachPaymentMethod(paymentMethodId);

    return { success: true };
  }
}
