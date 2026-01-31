import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { CreateReviewDto } from './dto/review.dto';

@Injectable()
export class ReviewsService {
  constructor(@Inject('DATABASE_POOL') private db: Pool) {}

  async createReview(reviewerId: string, dto: CreateReviewDto) {
    const result = await this.db.query(
      `INSERT INTO reviews (order_id, reviewer_id, reviewee_id, reviewee_type, rating, comment)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, order_id, reviewee_id, reviewee_type, rating, comment, created_at`,
      [dto.orderId, reviewerId, dto.revieweeId, dto.revieweeType, dto.rating, dto.comment || null],
    );

    await this.updateAggregateRating(dto.revieweeId, dto.revieweeType);

    return { review: result.rows[0] };
  }

  async listReviews(revieweeId?: string, revieweeType?: 'chef' | 'driver') {
    const values: string[] = [];
    let sql = 'SELECT * FROM reviews';
    if (revieweeId && revieweeType) {
      sql += ' WHERE reviewee_id = $1 AND reviewee_type = $2';
      values.push(revieweeId, revieweeType);
    }
    sql += ' ORDER BY created_at DESC LIMIT 200';
    const result = await this.db.query(sql, values);
    return { reviews: result.rows };
  }

  async listByOrder(orderId: string) {
    const result = await this.db.query(
      'SELECT * FROM reviews WHERE order_id = $1 ORDER BY created_at DESC',
      [orderId],
    );
    return { reviews: result.rows };
  }

  private async updateAggregateRating(revieweeId: string, revieweeType: 'chef' | 'driver') {
    const avgResult = await this.db.query(
      'SELECT AVG(rating)::numeric(3,2) AS rating FROM reviews WHERE reviewee_id = $1 AND reviewee_type = $2',
      [revieweeId, revieweeType],
    );
    const rating = avgResult.rows[0]?.rating || 0;

    if (revieweeType === 'chef') {
      await this.db.query('UPDATE chefs SET rating = $1 WHERE user_id = $2', [rating, revieweeId]);
    } else {
      await this.db.query('UPDATE drivers SET rating = $1 WHERE user_id = $2', [rating, revieweeId]);
    }
  }
}
