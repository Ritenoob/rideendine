import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';

export enum DevicePlatform {
  IOS = 'ios',
  ANDROID = 'android',
}

export class RegisterDeviceTokenDto {
  @IsString()
  @IsNotEmpty()
  token!: string;

  @IsEnum(DevicePlatform)
  platform!: DevicePlatform;

  @IsString()
  @IsOptional()
  deviceId?: string;
}

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: string;
  badge?: number;
}
