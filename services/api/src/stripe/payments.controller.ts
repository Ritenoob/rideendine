import { Controller, Post, UseGuards } from '@nestjs/common';
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

    // Create or retrieve Stripe customer
    const customer = await this.stripeService.createOrRetrieveCustomer({
      email: userProfile.email,
      name: userProfile.first_name
        ? `${userProfile.first_name} ${userProfile.last_name || ''}`.trim()
        : undefined,
      existingCustomerId: userProfile.stripe_customer_id,
    });

    // Update user with customer ID if not already set
    if (!userProfile.stripe_customer_id) {
      await this.usersService.updateStripeCustomerId(user.sub, customer.id);
    }

    // Create ephemeral key
    const ephemeralKey = await this.stripeService.createEphemeralKey(customer.id);

    return {
      ephemeralKey: ephemeralKey.secret,
      customerId: customer.id,
    };
  }
}
