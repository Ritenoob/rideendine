import { IsString, IsNotEmpty, IsOptional, IsNumber, Min } from 'class-validator';

export class AssignDriverDto {
  @IsString()
  @IsNotEmpty()
  orderId!: string;

  @IsString()
  @IsOptional()
  driverId?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  searchRadiusKm?: number;
}

export interface DriverAssignmentResponseDto {
  orderId: string;
  driverId: string;
  driverName: string;
  distanceKm: number;
  estimatedPickupTimeMinutes: number;
  assignedAt: Date;
}

export interface AvailableDriverDto {
  driverId: string;
  userId: string;
  firstName: string;
  lastName: string;
  vehicleType: string;
  distanceKm: number;
  averageRating: number;
  isAvailable: boolean;
}

export class AcceptAssignmentDto {
  @IsString()
  @IsNotEmpty()
  assignmentId!: string;
}

export class DeclineAssignmentDto {
  @IsString()
  @IsNotEmpty()
  assignmentId!: string;

  @IsString()
  @IsOptional()
  reason?: string;
}
