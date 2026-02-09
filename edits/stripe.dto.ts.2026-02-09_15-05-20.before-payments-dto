import { IsString, IsBoolean, IsOptional, IsUrl } from 'class-validator';

export class StripeOnboardRequestDto {
  @IsOptional()
  @IsUrl()
  refreshUrl?: string;

  @IsOptional()
  @IsUrl()
  returnUrl?: string;
}

export class StripeOnboardResponseDto {
  @IsString()
  url!: string;

  @IsString()
  accountId!: string;

  @IsString()
  expiresAt!: string;
}

export class StripeAccountStatusDto {
  @IsString()
  accountId!: string;

  @IsBoolean()
  onboardingComplete!: boolean;

  @IsBoolean()
  chargesEnabled!: boolean;

  @IsBoolean()
  payoutsEnabled!: boolean;

  @IsBoolean()
  detailsSubmitted!: boolean;

  @IsBoolean()
  requiresInformation!: boolean;

  @IsOptional()
  requirements?: {
    currently_due: string[];
    eventually_due: string[];
    past_due: string[];
  };
}
