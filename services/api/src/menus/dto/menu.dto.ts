import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  IsNumber,
  Min,
  MaxLength,
} from 'class-validator';

export class CreateMenuDto {
  @IsString()
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  availableDays?: number[]; // [0,1,2,3,4,5,6] where 0=Sunday

  @IsOptional()
  @IsString()
  availableFrom?: string; // "09:00"

  @IsOptional()
  @IsString()
  availableUntil?: string; // "21:00"
}

export class UpdateMenuDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  availableDays?: number[];

  @IsOptional()
  @IsString()
  availableFrom?: string;

  @IsOptional()
  @IsString()
  availableUntil?: string;
}

export class CreateMenuItemDto {
  @IsString()
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsNumber()
  @Min(1)
  priceCents!: number;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dietaryTags?: string[]; // ['vegetarian', 'vegan', 'gluten-free']

  @IsOptional()
  @IsNumber()
  @Min(1)
  prepTimeMinutes?: number;
}

export class UpdateMenuItemDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  priceCents?: number;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dietaryTags?: string[];

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  prepTimeMinutes?: number;
}
