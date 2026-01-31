import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { Pool } from 'pg';
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

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);

  constructor(@Inject('DATABASE_POOL') private db: Pool) {}

  /**
   * Create a new review for a chef or driver
   * Validates:
   * - User placed the order
   * - Order is delivered
   * - No duplicate review for same order/reviewee type
   * - Rating is 1-5
   */
  async createReview(
    reviewerId: string,
    dto: CreateReviewDto,
  ): Promise<{ review: ReviewResponse }> {
    // 1. Validate the order exists and belongs to the reviewer
    const orderResult = await this.db.query(
      `SELECT o.id, o.customer_id, o.chef_id, o.assigned_driver_id, o.status,
              c.user_id as chef_user_id,
              d.user_id as driver_user_id
       FROM orders o
       JOIN chefs c ON o.chef_id = c.id
       LEFT JOIN drivers d ON o.assigned_driver_id = d.id
       WHERE o.id = $1`,
      [dto.orderId],
    );

    if (orderResult.rows.length === 0) {
      throw new NotFoundException('Order not found');
    }

    const order = orderResult.rows[0];

    // 2. Validate the reviewer placed this order
    if (order.customer_id !== reviewerId) {
      throw new ForbiddenException('You can only review orders you placed');
    }

    // 3. Validate order is delivered
    if (order.status !== 'delivered') {
      throw new BadRequestException('You can only review orders that have been delivered');
    }

    // 4. Validate the reviewee matches the order
    if (dto.revieweeType === 'chef') {
      if (order.chef_user_id !== dto.revieweeId) {
        throw new BadRequestException('The chef ID does not match this order');
      }
    } else if (dto.revieweeType === 'driver') {
      if (!order.driver_user_id) {
        throw new BadRequestException('This order does not have an assigned driver');
      }
      if (order.driver_user_id !== dto.revieweeId) {
        throw new BadRequestException('The driver ID does not match this order');
      }
    }

    // 5. Check for duplicate review (one review per order per reviewee type)
    const existingReview = await this.db.query(
      `SELECT id FROM reviews
       WHERE order_id = $1 AND reviewer_id = $2 AND reviewee_type = $3`,
      [dto.orderId, reviewerId, dto.revieweeType],
    );

    if (existingReview.rows.length > 0) {
      throw new ConflictException(
        `You have already submitted a ${dto.revieweeType} review for this order`,
      );
    }

    // 6. Validate rating is 1-5 (also handled by DTO validation)
    if (dto.rating < 1 || dto.rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    // 7. Insert the review
    const result = await this.db.query(
      `INSERT INTO reviews (
        order_id, reviewer_id, reviewee_id, reviewee_type,
        rating, comment, is_flagged, is_hidden
      )
       VALUES ($1, $2, $3, $4, $5, $6, false, false)
       RETURNING id, order_id, reviewer_id, reviewee_id, reviewee_type,
                 rating, comment, is_flagged, is_hidden,
                 flag_reason, moderated_at, moderated_by,
                 created_at, updated_at`,
      [dto.orderId, reviewerId, dto.revieweeId, dto.revieweeType, dto.rating, dto.comment || null],
    );

    // 8. Update aggregate rating for the reviewee
    await this.updateAggregateRating(dto.revieweeId, dto.revieweeType);

    this.logger.log(
      `Review created for ${dto.revieweeType} ${dto.revieweeId} by user ${reviewerId} with rating ${dto.rating}`,
    );

    return { review: this.mapReviewRow(result.rows[0]) };
  }

  /**
   * Get a single review by ID with reviewer info
   */
  async getReviewById(
    reviewId: string,
    includeHidden = false,
  ): Promise<{ review: ReviewResponse }> {
    let sql = `
      SELECT r.*,
             up.first_name as reviewer_first_name,
             up.last_name as reviewer_last_name,
             up.avatar_url as reviewer_avatar_url,
             CASE
               WHEN r.reviewee_type = 'chef' THEN c.business_name
               WHEN r.reviewee_type = 'driver' THEN CONCAT(dup.first_name, ' ', dup.last_name)
             END as reviewee_name
      FROM reviews r
      LEFT JOIN user_profiles up ON r.reviewer_id = up.user_id
      LEFT JOIN chefs c ON r.reviewee_type = 'chef' AND r.reviewee_id = c.user_id
      LEFT JOIN user_profiles dup ON r.reviewee_type = 'driver' AND r.reviewee_id = dup.user_id
      WHERE r.id = $1`;

    if (!includeHidden) {
      sql += ' AND r.is_hidden = false';
    }

    const result = await this.db.query(sql, [reviewId]);

    if (result.rows.length === 0) {
      throw new NotFoundException('Review not found');
    }

    const row = result.rows[0];
    const review = this.mapReviewRow(row);

    // Add reviewer info
    review.reviewer = {
      id: row.reviewer_id,
      firstName: row.reviewer_first_name,
      lastName: row.reviewer_last_name,
      avatarUrl: row.reviewer_avatar_url,
    };

    // Add reviewee info
    review.reviewee = {
      id: row.reviewee_id,
      name: row.reviewee_name || 'Unknown',
      type: row.reviewee_type,
    };

    return { review };
  }

  /**
   * List reviews with filters and pagination
   * Supports filtering by revieweeId, revieweeType, flagged status, and minRating
   */
  async listReviews(query: ReviewQueryDto, includeHidden = false): Promise<ReviewListResponse> {
    const page = parseInt(query.page || '1');
    const perPage = Math.min(parseInt(query.perPage || '20'), 100);
    const offset = (page - 1) * perPage;

    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    // Filter by reviewee
    if (query.revieweeId) {
      conditions.push(`r.reviewee_id = $${paramIndex++}`);
      params.push(query.revieweeId);
    }

    if (query.revieweeType) {
      conditions.push(`r.reviewee_type = $${paramIndex++}`);
      params.push(query.revieweeType);
    }

    // Filter by flagged status
    if (query.flagged !== undefined) {
      conditions.push(`r.is_flagged = $${paramIndex++}`);
      params.push(query.flagged);
    }

    // Filter by hidden status (only for admins)
    if (query.hidden !== undefined && includeHidden) {
      conditions.push(`r.is_hidden = $${paramIndex++}`);
      params.push(query.hidden);
    } else if (!includeHidden) {
      conditions.push('r.is_hidden = false');
    }

    // Filter by rating range
    if (query.minRating) {
      conditions.push(`r.rating >= $${paramIndex++}`);
      params.push(query.minRating);
    }

    if (query.maxRating) {
      conditions.push(`r.rating <= $${paramIndex++}`);
      params.push(query.maxRating);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countResult = await this.db.query(
      `SELECT COUNT(*) as total FROM reviews r ${whereClause}`,
      params,
    );
    const total = parseInt(countResult.rows[0].total);

    // Get reviews with reviewer info
    const reviewsResult = await this.db.query(
      `SELECT r.*,
              up.first_name as reviewer_first_name,
              up.last_name as reviewer_last_name,
              up.avatar_url as reviewer_avatar_url,
              CASE
                WHEN r.reviewee_type = 'chef' THEN c.business_name
                WHEN r.reviewee_type = 'driver' THEN CONCAT(dup.first_name, ' ', dup.last_name)
              END as reviewee_name
       FROM reviews r
       LEFT JOIN user_profiles up ON r.reviewer_id = up.user_id
       LEFT JOIN chefs c ON r.reviewee_type = 'chef' AND r.reviewee_id = c.user_id
       LEFT JOIN user_profiles dup ON r.reviewee_type = 'driver' AND r.reviewee_id = dup.user_id
       ${whereClause}
       ORDER BY r.created_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
      [...params, perPage, offset],
    );

    const reviews = reviewsResult.rows.map((row) => {
      const review = this.mapReviewRow(row);
      review.reviewer = {
        id: row.reviewer_id,
        firstName: row.reviewer_first_name,
        lastName: row.reviewer_last_name,
        avatarUrl: row.reviewer_avatar_url,
      };
      review.reviewee = {
        id: row.reviewee_id,
        name: row.reviewee_name || 'Unknown',
        type: row.reviewee_type,
      };
      return review;
    });

    return {
      reviews,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  /**
   * List reviews for a specific chef
   */
  async listChefReviews(
    chefId: string,
    query: ReviewQueryDto,
    includeHidden = false,
  ): Promise<ReviewListResponse> {
    // First verify the chef exists
    const chefResult = await this.db.query(
      'SELECT user_id FROM chefs WHERE id = $1 OR user_id = $1',
      [chefId],
    );

    if (chefResult.rows.length === 0) {
      throw new NotFoundException('Chef not found');
    }

    const chefUserId = chefResult.rows[0].user_id;

    return this.listReviews(
      {
        ...query,
        revieweeId: chefUserId,
        revieweeType: 'chef',
      },
      includeHidden,
    );
  }

  /**
   * List reviews for a specific driver
   */
  async listDriverReviews(
    driverId: string,
    query: ReviewQueryDto,
    includeHidden = false,
  ): Promise<ReviewListResponse> {
    // First verify the driver exists
    const driverResult = await this.db.query(
      'SELECT user_id FROM drivers WHERE id = $1 OR user_id = $1',
      [driverId],
    );

    if (driverResult.rows.length === 0) {
      throw new NotFoundException('Driver not found');
    }

    const driverUserId = driverResult.rows[0].user_id;

    return this.listReviews(
      {
        ...query,
        revieweeId: driverUserId,
        revieweeType: 'driver',
      },
      includeHidden,
    );
  }

  /**
   * List reviews by order
   */
  async listByOrder(orderId: string): Promise<{ reviews: ReviewResponse[] }> {
    const result = await this.db.query(
      `SELECT r.*,
              up.first_name as reviewer_first_name,
              up.last_name as reviewer_last_name,
              up.avatar_url as reviewer_avatar_url
       FROM reviews r
       LEFT JOIN user_profiles up ON r.reviewer_id = up.user_id
       WHERE r.order_id = $1 AND r.is_hidden = false
       ORDER BY r.created_at DESC`,
      [orderId],
    );

    const reviews = result.rows.map((row) => {
      const review = this.mapReviewRow(row);
      review.reviewer = {
        id: row.reviewer_id,
        firstName: row.reviewer_first_name,
        lastName: row.reviewer_last_name,
        avatarUrl: row.reviewer_avatar_url,
      };
      return review;
    });

    return { reviews };
  }

  /**
   * Update an existing review (only by the original reviewer)
   */
  async updateReview(
    reviewId: string,
    reviewerId: string,
    dto: UpdateReviewDto,
  ): Promise<{ review: ReviewResponse }> {
    // Get the review and verify ownership
    const existingResult = await this.db.query('SELECT * FROM reviews WHERE id = $1', [reviewId]);

    if (existingResult.rows.length === 0) {
      throw new NotFoundException('Review not found');
    }

    const existing = existingResult.rows[0];

    if (existing.reviewer_id !== reviewerId) {
      throw new ForbiddenException('You can only update your own reviews');
    }

    // Validate rating if provided
    if (dto.rating !== undefined && (dto.rating < 1 || dto.rating > 5)) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    // Build update query
    const updates: string[] = ['updated_at = NOW()'];
    const params: any[] = [];
    let paramIndex = 1;

    if (dto.rating !== undefined) {
      updates.push(`rating = $${paramIndex++}`);
      params.push(dto.rating);
    }

    if (dto.comment !== undefined) {
      updates.push(`comment = $${paramIndex++}`);
      params.push(dto.comment);
    }

    params.push(reviewId);

    const result = await this.db.query(
      `UPDATE reviews
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING id, order_id, reviewer_id, reviewee_id, reviewee_type,
                 rating, comment, is_flagged, is_hidden,
                 flag_reason, moderated_at, moderated_by,
                 created_at, updated_at`,
      params,
    );

    // Update aggregate rating if rating changed
    if (dto.rating !== undefined) {
      await this.updateAggregateRating(existing.reviewee_id, existing.reviewee_type);
    }

    this.logger.log(`Review ${reviewId} updated by user ${reviewerId}`);

    return { review: this.mapReviewRow(result.rows[0]) };
  }

  /**
   * Moderate a review (admin only)
   * Actions: flag, unflag, hide, unhide
   */
  async moderateReview(
    reviewId: string,
    adminId: string,
    dto: ModerateReviewDto,
  ): Promise<{ review: ReviewResponse; message: string }> {
    // Verify review exists
    const existingResult = await this.db.query('SELECT * FROM reviews WHERE id = $1', [reviewId]);

    if (existingResult.rows.length === 0) {
      throw new NotFoundException('Review not found');
    }

    const existing = existingResult.rows[0];

    // Apply moderation action
    let updateFields: string[];
    let message: string;

    switch (dto.action) {
      case 'flag':
        if (existing.is_flagged) {
          throw new BadRequestException('Review is already flagged');
        }
        updateFields = [
          'is_flagged = true',
          `flag_reason = $2`,
          'moderated_at = NOW()',
          'moderated_by = $3',
        ];
        message = 'Review has been flagged for review';
        break;

      case 'unflag':
        if (!existing.is_flagged) {
          throw new BadRequestException('Review is not flagged');
        }
        updateFields = [
          'is_flagged = false',
          'flag_reason = NULL',
          'moderated_at = NOW()',
          'moderated_by = $3',
        ];
        message = 'Review flag has been removed';
        break;

      case 'hide':
        if (existing.is_hidden) {
          throw new BadRequestException('Review is already hidden');
        }
        updateFields = [
          'is_hidden = true',
          `flag_reason = $2`,
          'moderated_at = NOW()',
          'moderated_by = $3',
        ];
        message = 'Review has been hidden from public view';
        break;

      case 'unhide':
        if (!existing.is_hidden) {
          throw new BadRequestException('Review is not hidden');
        }
        updateFields = ['is_hidden = false', 'moderated_at = NOW()', 'moderated_by = $3'];
        message = 'Review has been restored to public view';
        break;

      default:
        throw new BadRequestException('Invalid moderation action');
    }

    const result = await this.db.query(
      `UPDATE reviews
       SET ${updateFields.join(', ')}, updated_at = NOW()
       WHERE id = $1
       RETURNING id, order_id, reviewer_id, reviewee_id, reviewee_type,
                 rating, comment, is_flagged, is_hidden,
                 flag_reason, moderated_at, moderated_by,
                 created_at, updated_at`,
      [reviewId, dto.reason, adminId],
    );

    // Update aggregate rating if visibility changed (hide/unhide)
    if (dto.action === 'hide' || dto.action === 'unhide') {
      await this.updateAggregateRating(existing.reviewee_id, existing.reviewee_type);
    }

    this.logger.log(
      `Review ${reviewId} moderated by admin ${adminId}: action=${dto.action}, reason=${dto.reason}`,
    );

    return {
      review: this.mapReviewRow(result.rows[0]),
      message,
    };
  }

  /**
   * Delete a review (admin only)
   */
  async deleteReview(reviewId: string, adminId: string): Promise<{ message: string }> {
    const existingResult = await this.db.query('SELECT * FROM reviews WHERE id = $1', [reviewId]);

    if (existingResult.rows.length === 0) {
      throw new NotFoundException('Review not found');
    }

    const existing = existingResult.rows[0];

    await this.db.query('DELETE FROM reviews WHERE id = $1', [reviewId]);

    // Update aggregate rating after deletion
    await this.updateAggregateRating(existing.reviewee_id, existing.reviewee_type);

    this.logger.log(`Review ${reviewId} deleted by admin ${adminId}`);

    return { message: 'Review has been permanently deleted' };
  }

  /**
   * Get rating statistics for a reviewee
   */
  async getRatingStats(
    revieweeId: string,
    revieweeType: RevieweeType,
  ): Promise<RatingStatsResponse> {
    const statsResult = await this.db.query(
      `SELECT
         AVG(rating)::numeric(3,2) as average_rating,
         COUNT(*) as total_reviews,
         COUNT(*) FILTER (WHERE rating = 1) as rating_1,
         COUNT(*) FILTER (WHERE rating = 2) as rating_2,
         COUNT(*) FILTER (WHERE rating = 3) as rating_3,
         COUNT(*) FILTER (WHERE rating = 4) as rating_4,
         COUNT(*) FILTER (WHERE rating = 5) as rating_5
       FROM reviews
       WHERE reviewee_id = $1 AND reviewee_type = $2 AND is_hidden = false`,
      [revieweeId, revieweeType],
    );

    const stats = statsResult.rows[0];

    return {
      revieweeId,
      revieweeType,
      averageRating: parseFloat(stats.average_rating) || 0,
      totalReviews: parseInt(stats.total_reviews) || 0,
      ratingDistribution: {
        1: parseInt(stats.rating_1) || 0,
        2: parseInt(stats.rating_2) || 0,
        3: parseInt(stats.rating_3) || 0,
        4: parseInt(stats.rating_4) || 0,
        5: parseInt(stats.rating_5) || 0,
      },
    };
  }

  /**
   * Update aggregate rating on chef or driver profile
   * Only counts visible (non-hidden) reviews
   */
  private async updateAggregateRating(
    revieweeId: string,
    revieweeType: RevieweeType,
  ): Promise<void> {
    const avgResult = await this.db.query(
      `SELECT AVG(rating)::numeric(3,2) AS rating, COUNT(*) as count
       FROM reviews
       WHERE reviewee_id = $1 AND reviewee_type = $2 AND is_hidden = false`,
      [revieweeId, revieweeType],
    );

    let rating = 0;
    let reviewCount = 0;

    if (avgResult.rows.length > 0) {
      const row = avgResult.rows[0];

      if (row?.rating !== null && row.rating !== undefined) {
        const parsedRating = parseFloat(row.rating);
        rating = Number.isNaN(parsedRating) ? 0 : parsedRating;
      }

      if (row?.count !== null && row.count !== undefined) {
        const parsedCount = parseInt(row.count, 10);
        reviewCount = Number.isNaN(parsedCount) ? 0 : parsedCount;
      }
    }
    if (revieweeType === 'chef') {
      await this.db.query('UPDATE chefs SET rating = $1, review_count = $2 WHERE user_id = $3', [
        rating,
        reviewCount,
        revieweeId,
      ]);
    } else {
      await this.db.query('UPDATE drivers SET rating = $1, review_count = $2 WHERE user_id = $3', [
        rating,
        reviewCount,
        revieweeId,
      ]);
    }

    this.logger.debug(
      `Updated ${revieweeType} ${revieweeId} rating: ${rating} (${reviewCount} reviews)`,
    );
  }

  /**
   * Map database row to ReviewResponse interface
   */
  private mapReviewRow(row: any): ReviewResponse {
    return {
      id: row.id,
      orderId: row.order_id,
      reviewerId: row.reviewer_id,
      revieweeId: row.reviewee_id,
      revieweeType: row.reviewee_type,
      rating: row.rating,
      comment: row.comment,
      isFlagged: row.is_flagged,
      isHidden: row.is_hidden,
      flagReason: row.flag_reason,
      moderatedAt: row.moderated_at,
      moderatedBy: row.moderated_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
