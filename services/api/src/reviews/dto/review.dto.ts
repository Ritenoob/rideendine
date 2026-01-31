import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  IsBoolean,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

/**
 * Reviewee types supported by the platform
 */
export type RevieweeType = 'chef' | 'driver';

/**
 * Moderation actions available for admin users
 */
export type ModerationAction = 'flag' | 'unflag' | 'hide' | 'unhide';

/**
 * DTO for creating a new review
 * - orderId: The order being reviewed
 * - revieweeId: The chef or driver being reviewed
 * - revieweeType: Either 'chef' or 'driver'
 * - rating: 1-5 stars
 * - comment: Optional text review
 */
export class CreateReviewDto {
  @IsUUID()
  @IsNotEmpty()
  orderId!: string;

  @IsUUID()
  @IsNotEmpty()
  revieweeId!: string;

  @IsEnum(['chef', 'driver'])
  revieweeType!: RevieweeType;

  @IsInt()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  rating!: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: 'Comment cannot exceed 2000 characters' })
  comment?: string;
}

/**
 * DTO for updating an existing review
 * - rating: Updated rating (1-5)
 * - comment: Updated comment text
 */
export class UpdateReviewDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  rating?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: 'Comment cannot exceed 2000 characters' })
  comment?: string;
}

/**
 * DTO for admin moderation actions
 * - action: 'flag' | 'unflag' | 'hide' | 'unhide'
 * - reason: Required explanation for the moderation action
 */
export class ModerateReviewDto {
  @IsEnum(['flag', 'unflag', 'hide', 'unhide'])
  action!: ModerationAction;

  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: 'Reason must be at least 10 characters' })
  @MaxLength(500, { message: 'Reason cannot exceed 500 characters' })
  reason!: string;
}

/**
 * DTO for filtering review listings
 */
export class ReviewQueryDto {
  @IsOptional()
  @IsUUID()
  revieweeId?: string;

  @IsOptional()
  @IsEnum(['chef', 'driver'])
  revieweeType?: RevieweeType;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  flagged?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  hidden?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  minRating?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  maxRating?: number;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  perPage?: string;
}

/**
 * Response interface for a single review
 */
export interface ReviewResponse {
  id: string;
  orderId: string;
  reviewerId: string;
  revieweeId: string;
  revieweeType: RevieweeType;
  rating: number;
  comment: string | null;
  isFlagged: boolean;
  isHidden: boolean;
  flagReason: string | null;
  moderatedAt: Date | null;
  moderatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  reviewer?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
  };
  reviewee?: {
    id: string;
    name: string;
    type: RevieweeType;
  };
}

/**
 * Response interface for paginated review listings
 */
export interface ReviewListResponse {
  reviews: ReviewResponse[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

/**
 * Response interface for aggregated rating statistics
 */
export interface RatingStatsResponse {
  revieweeId: string;
  revieweeType: RevieweeType;
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}
