import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  IsUUID,
  IsDateString,
  Min,
  Max,
  MaxLength,
  ArrayMinSize,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';

export class OrderItemDto {
  @IsUUID()
  menuItemId!: string;

  @IsInt()
  @Min(1)
  @Max(99)
  quantity!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class CreateOrderDto {
  @IsUUID()
  chefId!: string;

  @IsString()
  @MaxLength(500)
  deliveryAddress!: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  deliveryLatitude!: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  deliveryLongitude!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  deliveryInstructions?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];

  @IsOptional()
  @IsDateString()
  scheduledDeliveryTime?: string;
}

export class OrderQueryDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsUUID()
  chefId?: string;

  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsOptional()
  @IsUUID()
  driverId?: string;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  perPage?: string;
}

export class RejectOrderDto {
  @IsString()
  @MaxLength(500)
  rejectionReason!: string;
}

export class RefundOrderDto {
  @IsString()
  @MaxLength(500)
  reason!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  amountCents?: number;
}

export class CancelOrderDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  cancellationReason?: string;
}
