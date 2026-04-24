import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsIn, Min, Max } from 'class-validator';

export class UpsertBalanceDto {
  @ApiProperty({ description: 'Employee ID from HCM' })
  @IsString()
  employee_id!: string;

  @ApiProperty({ description: 'Total days allowed this year' })
  @IsNumber()
  @Min(0)
  @Max(365)
  days_total!: number;

  @ApiProperty({ description: 'Days already used' })
  @IsNumber()
  @Min(0)
  days_used!: number;

  @ApiPropertyOptional({ description: 'Year (defaults to current)' })
  @IsOptional()
  @IsNumber()
  year?: number;

  @ApiPropertyOptional({ enum: ['hcm', 'manual'] })
  @IsOptional()
  @IsIn(['hcm', 'manual'])
  source?: 'hcm' | 'manual';
}

export class BalanceResponseDto {
  @ApiProperty()
  employee_id!: string;

  @ApiProperty()
  days_total!: number;

  @ApiProperty()
  days_used!: number;

  @ApiProperty()
  days_pending!: number;

  @ApiProperty()
  days_available!: number;

  @ApiProperty()
  year!: number;

  @ApiPropertyOptional()
  last_synced_at?: string | null;
}