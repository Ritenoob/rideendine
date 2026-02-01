import {
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  IsBoolean,
  Min,
  Max,
  MaxLength,
  IsObject,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

// Define dependent classes first
export class DayScheduleDto {
  @IsBoolean()
  isOpen!: boolean;

  @IsOptional()
  @IsString()
  openTime?: string; // "09:00"

  @IsOptional()
  @IsString()
  closeTime?: string; // "21:00"
}

export class OperatingHoursDto {
  monday?: DayScheduleDto;
  tuesday?: DayScheduleDto;
  wednesday?: DayScheduleDto;
  thursday?: DayScheduleDto;
  friday?: DayScheduleDto;
  saturday?: DayScheduleDto;
  sunday?: DayScheduleDto;
}

export class ApplyAsChefDto {
  @IsString()
  @MaxLength(255)
  businessName!: string;

  @IsString()
  @MaxLength(2000)
  description!: string;

  @IsString()
  address!: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;

  @IsArray()
  @IsString({ each: true})
  cuisineTypes!: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  minimumOrderCents?: number;

  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(100)
  deliveryRadiusKm?: number;

  @IsOptional()
  @IsObject()
  operatingHours?: OperatingHoursDto;
}

export class UpdateChefDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  cuisineTypes?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  minimumOrderCents?: number;

  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(100)
  deliveryRadiusKm?: number;

  @IsOptional()
  @IsObject()
  operatingHours?: OperatingHoursDto;

  @IsOptional()
  @IsBoolean()
  isAcceptingOrders?: boolean;
}

export class SearchChefsDto {
  @IsOptional()
  @IsString()
  cuisineType?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  longitude?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0.1)
  @Max(50)
  radiusKm?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(5)
  minRating?: number;

  @IsOptional()
  @IsEnum(['distance', 'rating', 'total_orders'])
  sortBy?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  perPage?: number;
}

export class UploadDocumentDto {
  @IsEnum(['business_license', 'food_handlers_cert', 'insurance', 'id_proof'])
  documentType!: string;
}

export class VerifyChefDto {
  @IsEnum(['approved', 'rejected'])
  status!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
