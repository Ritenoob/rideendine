import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class VerifyChefDto {
  @IsEnum(['approved', 'rejected'])
  verification_status!: 'approved' | 'rejected';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  rejection_reason?: string;
}

export class PaginationQueryDto {
  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  perPage?: string;
}
