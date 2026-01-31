import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ChefsModule } from './chefs/chefs.module';
import { MenusModule } from './menus/menus.module';
import { OrdersModule } from './orders/orders.module';
import { AdminModule } from './admin/admin.module';
import { DatabaseModule } from './database/database.module';
import { StripeModule } from './stripe/stripe.module';
import { HealthController } from './common/health.controller';
import { ReviewsModule } from './reviews/reviews.module';
import { DriversModule } from './drivers/drivers.module';
import { DispatchModule } from './dispatch/dispatch.module';
import { RealtimeModule } from './realtime/realtime.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
        limit: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
      },
    ]),
    DatabaseModule,
    StripeModule,
    AuthModule,
    UsersModule,
    ChefsModule,
    MenusModule,
    OrdersModule,
    AdminModule,
    ReviewsModule,
    DriversModule,
    DispatchModule,
    RealtimeModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
