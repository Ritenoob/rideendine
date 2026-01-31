export enum UserRole {
  CUSTOMER = 'customer',
  CHEF = 'chef',
  DRIVER = 'driver',
  ADMIN = 'admin',
}

export interface User {
  id: string;
  email: string;
  password_hash: string;
  role: UserRole;
  is_verified: boolean;
  verification_token: string | null;
  reset_token: string | null;
  reset_token_expires: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface UserProfile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

export interface RefreshToken {
  id: string;
  user_id: string;
  token: string;
  expires_at: Date;
  created_at: Date;
}

/**
 * Reviewee type enumeration
 */
export type RevieweeType = 'chef' | 'driver';

/**
 * Moderation action types for admin review management
 */
export type ModerationAction = 'flag' | 'unflag' | 'hide' | 'unhide';

/**
 * Review entity interface matching the database schema
 */
export interface Review {
  id: string;
  order_id: string;
  reviewer_id: string;
  reviewee_id: string;
  reviewee_type: RevieweeType;
  rating: number;
  comment: string | null;
  is_flagged: boolean;
  is_hidden: boolean;
  moderated_at: Date | null;
  moderated_by: string | null;
  moderation_reason: string | null;
  created_at: Date;
  updated_at?: Date;
}

/**
 * Review with additional reviewer profile information
 */
export interface ReviewWithReviewer extends Review {
  reviewer_first_name: string | null;
  reviewer_last_name: string | null;
  reviewer_avatar_url: string | null;
}

/**
 * Review statistics for aggregated rating data
 */
export interface ReviewStats {
  reviewee_id: string;
  reviewee_type: RevieweeType;
  average_rating: number;
  total_reviews: number;
  rating_distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}
