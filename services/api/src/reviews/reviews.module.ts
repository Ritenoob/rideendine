import { Module } from '@nestjs/common';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';

/**
 * ReviewsModule
 *
 * Provides review functionality for the RideNDine platform:
 * - Customer reviews for chefs and drivers
 * - Review moderation (flag/hide) for admins
 * - Rating aggregation and statistics
 *
 * Features:
 * - Create reviews (authenticated customers only)
 * - List reviews with filters (revieweeId, revieweeType, flagged, minRating)
 * - Get reviews by chef or driver
 * - Update own reviews
 * - Admin moderation (flag, unflag, hide, unhide, delete)
 *
 * Validation:
 * - Users can only review orders they placed
 * - Orders must be delivered before review
 * - One review per order per reviewee type
 * - Rating must be 1-5
 */
@Module({
  controllers: [ReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
