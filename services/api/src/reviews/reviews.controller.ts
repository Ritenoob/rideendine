import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import {
  CreateReviewDto,
  UpdateReviewDto,
  ModerateReviewDto,
  ReviewQueryDto,
  ReviewResponse,
  ReviewListResponse,
  RatingStatsResponse,
  RevieweeType,
} from './dto/review.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtPayload, UserRole } from '../common/interfaces/user.interface';

/**
 * ReviewsController handles all review-related HTTP endpoints including:
 * - Creating reviews (authenticated customers)
 * - Listing reviews with various filters
 * - Getting reviews by chef or driver
 * - Admin moderation actions (flag, unflag, hide, unhide)
 */
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  // ============================================================================
  // REVIEW CREATION
  // ============================================================================

  /**
   * POST /reviews
   * Create a new review for a chef or driver
   * Only authenticated customers can create reviews
   * Validates order ownership, delivery status, and duplicate reviews
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createReview(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateReviewDto,
  ): Promise<{ review: ReviewResponse }> {
    return this.reviewsService.createReview(user.sub, dto);
  }

  // ============================================================================
  // REVIEW LISTING
  // ============================================================================

  /**
   * GET /reviews
   * List reviews with optional filters
   * Supports: revieweeId, revieweeType, flagged, minRating, maxRating
   * Public endpoint - hidden reviews are excluded
   */
  @Get()
  async listReviews(@Query() query: ReviewQueryDto): Promise<ReviewListResponse> {
    return this.reviewsService.listReviews(query, false);
  }

  /**
   * GET /reviews/admin
   * Admin endpoint to list all reviews including hidden ones
   * Supports all filters plus hidden status filter
   */
  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async listReviewsAdmin(@Query() query: ReviewQueryDto): Promise<ReviewListResponse> {
    return this.reviewsService.listReviews(query, true);
  }

  /**
   * GET /reviews/chef/:chefId
   * List all reviews for a specific chef
   * Public endpoint - hidden reviews are excluded
   */
  @Get('chef/:chefId')
  async listChefReviews(
    @Param('chefId', ParseUUIDPipe) chefId: string,
    @Query() query: ReviewQueryDto,
  ): Promise<ReviewListResponse> {
    return this.reviewsService.listChefReviews(chefId, query, false);
  }

  /**
   * GET /reviews/driver/:driverId
   * List all reviews for a specific driver
   * Public endpoint - hidden reviews are excluded
   */
  @Get('driver/:driverId')
  async listDriverReviews(
    @Param('driverId', ParseUUIDPipe) driverId: string,
    @Query() query: ReviewQueryDto,
  ): Promise<ReviewListResponse> {
    return this.reviewsService.listDriverReviews(driverId, query, false);
  }

  /**
   * GET /reviews/order/:orderId
   * List all reviews for a specific order
   * Returns both chef and driver reviews for the order
   */
  @Get('order/:orderId')
  async listByOrder(
    @Param('orderId', ParseUUIDPipe) orderId: string,
  ): Promise<{ reviews: ReviewResponse[] }> {
    return this.reviewsService.listByOrder(orderId);
  }

  /**
   * GET /reviews/stats/:revieweeId
   * Get rating statistics for a chef or driver
   * Returns average rating and rating distribution
   */
  @Get('stats/:revieweeId')
  async getRatingStats(
    @Param('revieweeId', ParseUUIDPipe) revieweeId: string,
    @Query('revieweeType') revieweeType: RevieweeType,
  ): Promise<RatingStatsResponse> {
    return this.reviewsService.getRatingStats(revieweeId, revieweeType);
  }

  // ============================================================================
  // SINGLE REVIEW OPERATIONS
  // ============================================================================

  /**
   * GET /reviews/:id
   * Get a single review by ID with reviewer information
   * Public endpoint - hidden reviews are not accessible
   */
  @Get(':id')
  async getReviewById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ review: ReviewResponse }> {
    return this.reviewsService.getReviewById(id, false);
  }

  /**
   * PATCH /reviews/:id
   * Update an existing review
   * Only the original reviewer can update their review
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async updateReview(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateReviewDto,
  ): Promise<{ review: ReviewResponse }> {
    return this.reviewsService.updateReview(id, user.sub, dto);
  }

  // ============================================================================
  // ADMIN MODERATION ENDPOINTS
  // ============================================================================

  /**
   * PATCH /reviews/:id/moderate
   * Admin moderation action on a review
   * Actions: flag, unflag, hide, unhide
   * Requires admin role
   */
  @Patch(':id/moderate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async moderateReview(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: ModerateReviewDto,
  ): Promise<{ review: ReviewResponse; message: string }> {
    return this.reviewsService.moderateReview(id, user.sub, dto);
  }

  /**
   * DELETE /reviews/:id
   * Permanently delete a review
   * Admin only - use with caution
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async deleteReview(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<{ message: string }> {
    return this.reviewsService.deleteReview(id, user.sub);
  }
}
