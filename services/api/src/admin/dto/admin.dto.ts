import {
  IsEnum,
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  MaxLength,
  MinLength,
  IsEmail,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

// ============================================================================
// CHEF VERIFICATION DTOs
// ============================================================================

export class VerifyChefDto {
  @IsEnum(['approved', 'rejected'])
  verification_status!: 'approved' | 'rejected';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  rejection_reason?: string;
}

export class RejectChefDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

// ============================================================================
// PAGINATION & FILTERING DTOs
// ============================================================================

export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  perPage?: number = 20;
}

export class UsersQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}

export class ChefsQueryDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}

export class DriversQueryDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}

export class OrdersQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}

export class ReviewsQueryDto {
  @IsOptional()
  @IsEnum(['chef', 'driver'])
  revieweeType?: 'chef' | 'driver';

  @IsOptional()
  @IsString()
  flagged?: string;
}

// ============================================================================
// DRIVER MANAGEMENT DTOs
// ============================================================================

export class RejectDriverDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  reason!: string;
}

// ============================================================================
// USER MANAGEMENT DTOs
// ============================================================================

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  first_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  last_name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsBoolean()
  is_verified?: boolean;

  @IsOptional()
  @IsEnum(['customer', 'chef', 'driver', 'admin'])
  role?: string;
}

// ============================================================================
// ORDER MANAGEMENT DTOs
// ============================================================================

export class RefundOrderDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  reason!: string;
}

// ============================================================================
// COMMISSION & ANALYTICS DTOs
// ============================================================================

export class CommissionQueryDto {
  @IsEnum(['day', 'week', 'month', 'year'])
  period!: 'day' | 'week' | 'month' | 'year';
}

export class PayoutsQueryDto {
  @IsOptional()
  @IsEnum(['pending', 'processing', 'paid', 'failed'])
  status?: string;
}

// ============================================================================
// REVIEW MODERATION DTOs
// ============================================================================

export class RemoveReviewDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  reason!: string;
}

// ============================================================================
// PLATFORM SETTINGS DTOs
// ============================================================================

export class UpdateSettingsDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  platform_fee_percent?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minimum_order_cents?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  delivery_fee_cents?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  driver_commission_percent?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  chef_commission_percent?: number;

  @IsOptional()
  @IsBoolean()
  maintenance_mode?: boolean;

  @IsOptional()
  @IsBoolean()
  new_registrations_enabled?: boolean;

  @IsOptional()
  @IsBoolean()
  orders_enabled?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  support_email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  support_phone?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  tax_rate_percent?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  max_delivery_radius_km?: number;
}

// ============================================================================
// RESPONSE INTERFACES (for typing)
// ============================================================================

export interface DashboardStats {
  totalOrders: number;
  activeOrders: number;
  totalRevenue: number;
  totalCommission: number;
  pendingChefs: number;
  pendingDrivers: number;
  activeDrivers: number;
  totalUsers: number;
}

export interface ActivityItem {
  id: string;
  type: string;
  message: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface CommissionStats {
  totalRevenue: number;
  totalCommission: number;
  orderCount: number;
  avgOrderValue: number;
  byDate: { date: string; revenue: number; commission: number }[];
}

export interface PlatformSettings {
  platform_fee_percent: number;
  minimum_order_cents: number;
  delivery_fee_cents: number;
  driver_commission_percent: number;
  chef_commission_percent: number;
  maintenance_mode: boolean;
  new_registrations_enabled: boolean;
  orders_enabled: boolean;
  support_email: string;
  support_phone: string;
  tax_rate_percent: number;
  max_delivery_radius_km: number;
}
