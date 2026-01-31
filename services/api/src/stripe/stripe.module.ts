import { Global, Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StripeService } from './stripe.service';
import { StripeWebhookController } from './stripe-webhook.controller';
import { ChefsModule } from '../chefs/chefs.module';
import { OrdersModule } from '../orders/orders.module';

@Global()
@Module({
  imports: [
    ConfigModule,
    forwardRef(() => ChefsModule),
    forwardRef(() => OrdersModule),
  ],
  controllers: [StripeWebhookController],
  providers: [StripeService],
  exports: [StripeService],
})
export class StripeModule {}
