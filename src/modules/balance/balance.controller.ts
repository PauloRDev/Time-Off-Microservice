import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  Version,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { BalanceService } from './balance.service';
import { UpsertBalanceDto, BalanceResponseDto } from './balance.dto';

@ApiTags('Balances')
@Controller('balances')
export class BalanceController {
  constructor(private readonly balanceService: BalanceService) {}

  @Version('1')
  @Get(':employeeId')
  @ApiOperation({ summary: 'Get time-off balance for an employee' })
  @ApiParam({ name: 'employeeId', description: 'Employee ID' })
  @ApiResponse({ status: 200, type: BalanceResponseDto })
  @ApiResponse({ status: 404, description: 'Balance not found' })
  getBalance(@Param('employeeId') employeeId: string): BalanceResponseDto {
    return this.balanceService.getBalance(employeeId);
  }

  @Version('1')
  @Put(':employeeId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Manually upsert a balance (override HCM)' })
  @ApiResponse({ status: 200, type: BalanceResponseDto })
  upsertBalance(
    @Param('employeeId') employeeId: string,
    @Body() dto: UpsertBalanceDto,
  ): BalanceResponseDto {
    dto.employee_id = employeeId;
    return this.balanceService.upsertBalance(dto, 'manual');
  }
}