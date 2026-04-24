import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsIn,
  IsOptional,
  IsDateString,
  IsNumber,
  Min,
  Max,
  IsNotEmpty,
} from 'class-validator';
import { TimeOffType, TimeOffStatus } from './timeoff.entity';

export class CreateTimeOffRequestDto {
  @ApiProperty({ description: 'Employee requesting time off' })
  @IsString()
  @IsNotEmpty()
  employee_id!: string;

  @ApiProperty({ enum: ['vacation', 'sick', 'personal', 'other'] })
  @IsIn(['vacation', 'sick', 'personal', 'other'])
  type!: TimeOffType;

  @ApiProperty({ example: '2024-07-01', description: 'ISO date string YYYY-MM-DD' })
  @IsDateString()
  start_date!: string;

  @ApiProperty({ example: '2024-07-05' })
  @IsDateString()
  end_date!: string;

  @ApiProperty({ example: 5 })
  @IsNumber()
  @Min(0.5)
  @Max(365)
  days_requested!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ description: 'Manager ID who will review' })
  @IsOptional()
  @IsString()
  manager_id?: string;
}

export class ReviewTimeOffRequestDto {
  @ApiProperty({ enum: ['approved', 'rejected'] })
  @IsIn(['approved', 'rejected'])
  status!: 'approved' | 'rejected';

  @ApiProperty({ description: 'Manager ID performing review' })
  @IsString()
  @IsNotEmpty()
  manager_id!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  review_note?: string;
}

export class ListTimeOffRequestsQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  employee_id?: string;

  @ApiPropertyOptional({ enum: ['pending', 'approved', 'rejected', 'cancelled'] })
  @IsOptional()
  @IsIn(['pending', 'approved', 'rejected', 'cancelled'])
  status?: TimeOffStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  to?: string;
}

export class TimeOffRequestResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() employee_id!: string;
  @ApiProperty() type!: TimeOffType;
  @ApiProperty() status!: TimeOffStatus;
  @ApiProperty() start_date!: string;
  @ApiProperty() end_date!: string;
  @ApiProperty() days_requested!: number;
  @ApiPropertyOptional() reason?: string | null;
  @ApiPropertyOptional() manager_id?: string | null;
  @ApiPropertyOptional() reviewed_at?: string | null;
  @ApiPropertyOptional() review_note?: string | null;
  @ApiProperty() created_at!: string;
  @ApiProperty() updated_at!: string;
}