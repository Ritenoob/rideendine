import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  IsUUID,
  Min,
  Max,
  MaxLength,
  ArrayMinSize,
  IsInt,
  IsUrl,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AddressDto {
  @IsString()
  @MaxLength(500)
  street!: string;

  @IsString()
  @MaxLength(100)
  city!: string;

  @IsString()
  @MaxLength(2)
  state!: string;

  @IsString()
  @MaxLength(10)
  zipCode!: string;

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
}

export class CartItemDto {
  @IsUUID()
  menuItemId!: string;

  @IsString()
  @MaxLength(200)
  name!: string;

  @IsInt()
  @Min(1)
  @Max(99)
  quantity!: number;

  @IsInt()
  @Min(0)
  price!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  specialInstructions?: string;
}

export class CreateCheckoutSessionDto {
  @IsUUID()
  chefId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  items!: CartItemDto[];

  @ValidateNested()
  @Type(() => AddressDto)
  deliveryAddress!: AddressDto;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  deliveryInstructions?: string;

  @IsUrl()
  successUrl!: string;

  @IsUrl()
  cancelUrl!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  tipCents?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  promoCode?: string;
}

export class CheckoutSessionResponseDto {
  sessionId!: string;
  sessionUrl!: string;
  orderId!: string;
  orderNumber!: string;
}

