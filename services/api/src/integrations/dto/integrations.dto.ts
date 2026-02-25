import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsObject, IsOptional, IsArray } from 'class-validator';

export class CoocoOrderItemDto {
  @ApiProperty({ description: 'Item name' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Quantity' })
  @IsNumber()
  quantity!: number;

  @ApiProperty({ description: 'Price per unit in cents' })
  @IsNumber()
  priceInCents!: number;

  @ApiProperty({ description: 'Special instructions', required: false })
  @IsString()
  @IsOptional()
  specialInstructions?: string;
}

export class CoocoWebhookDto {
  @ApiProperty({ description: 'Cooco order ID' })
  @IsString()
  coocoOrderId!: string;

  @ApiProperty({ description: 'Chef/restaurant ID' })
  @IsString()
  chefId!: string;

  @ApiProperty({ description: 'Customer email' })
  @IsString()
  customerEmail!: string;

  @ApiProperty({ description: 'Customer phone', required: false })
  @IsString()
  @IsOptional()
  customerPhone?: string;

  @ApiProperty({ description: 'Delivery address object' })
  @IsObject()
  deliveryAddress!: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    latitude?: number;
    longitude?: number;
  };

  @ApiProperty({ description: 'Order items', type: [CoocoOrderItemDto] })
  @IsArray()
  items!: CoocoOrderItemDto[];

  @ApiProperty({ description: 'Subtotal in cents' })
  @IsNumber()
  subtotalInCents!: number;

  @ApiProperty({ description: 'Tax in cents' })
  @IsNumber()
  taxInCents!: number;

  @ApiProperty({ description: 'Delivery fee in cents' })
  @IsNumber()
  deliveryFeeInCents!: number;

  @ApiProperty({ description: 'Total in cents' })
  @IsNumber()
  totalInCents!: number;

  @ApiProperty({ description: 'Scheduled delivery time (ISO 8601)', required: false })
  @IsString()
  @IsOptional()
  scheduledFor?: string;

  @ApiProperty({ description: 'Webhook signature for verification' })
  @IsString()
  signature!: string;
}

export class MealbridgeDispatchDto {
  @ApiProperty({ description: 'RideNDine order ID' })
  @IsString()
  orderId!: string;

  @ApiProperty({ description: 'Pickup location (chef address)' })
  @IsObject()
  pickupLocation!: {
    name: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    latitude: number;
    longitude: number;
    phone?: string;
  };

  @ApiProperty({ description: 'Delivery location (customer address)' })
  @IsObject()
  deliveryLocation!: {
    name: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    latitude: number;
    longitude: number;
    phone?: string;
  };

  @ApiProperty({ description: 'Delivery window start time (ISO 8601)' })
  @IsString()
  deliveryWindowStart!: string;

  @ApiProperty({ description: 'Delivery window end time (ISO 8601)' })
  @IsString()
  deliveryWindowEnd!: string;

  @ApiProperty({ description: 'Special delivery instructions', required: false })
  @IsString()
  @IsOptional()
  instructions?: string;
}
