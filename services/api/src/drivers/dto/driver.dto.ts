import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

export enum VehicleType {
  CAR = 'car',
  BIKE = 'bike',
  SCOOTER = 'scooter',
  MOTORCYCLE = 'motorcycle',
}

export enum DriverVerificationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended',
}

export class RegisterDriverDto {
  @IsString()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;

  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @IsString()
  @IsNotEmpty()
  phoneNumber!: string;

  @IsEnum(VehicleType)
  vehicleType!: VehicleType;

  @IsString()
  @IsOptional()
  vehicleMake?: string;

  @IsString()
  @IsOptional()
  vehicleModel?: string;

  @IsNumber()
  @IsOptional()
  @Min(1900)
  @Max(new Date().getFullYear() + 1)
  vehicleYear?: number;

  @IsString()
  @IsOptional()
  licensePlate?: string;

  @IsString()
  @IsOptional()
  driversLicenseNumber?: string;
}

export class UpdateDriverProfileDto {
  @IsString()
  @IsOptional()
  vehicleMake?: string;

  @IsString()
  @IsOptional()
  vehicleModel?: string;

  @IsNumber()
  @IsOptional()
  @Min(1900)
  @Max(new Date().getFullYear() + 1)
  vehicleYear?: number;

  @IsString()
  @IsOptional()
  licensePlate?: string;

  @IsString()
  @IsOptional()
  driversLicenseNumber?: string;
}

export class UpdateAvailabilityDto {
  @IsBoolean()
  isAvailable!: boolean;
}

export class UpdateLocationDto {
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  accuracy?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  speed?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(360)
  heading?: number;
}

export interface DriverStatsResponseDto {
  totalDeliveries: number;
  successfulDeliveries: number;
  cancelledDeliveries: number;
  averageRating: number;
  totalRatings: number;
  totalEarnings: number;
  pendingPayouts: number;
}

export interface DriverProfileResponseDto {
  id: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  vehicleType: VehicleType;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleYear?: number;
  licensePlate?: string;
  driversLicenseNumber?: string;
  driversLicenseVerified: boolean;
  insuranceVerified: boolean;
  backgroundCheckVerified: boolean;
  verificationStatus: DriverVerificationStatus;
  isAvailable: boolean;
  currentLatitude?: number;
  currentLongitude?: number;
  lastLocationUpdate?: Date;
  stats: DriverStatsResponseDto;
}

export interface DriverLocationHistoryDto {
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  recordedAt: Date;
}
