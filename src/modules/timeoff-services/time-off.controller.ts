import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Version,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { TimeOffService } from './time-off.service';
import {
  CreateTimeOffRequestDto,
  ReviewTimeOffRequestDto,
  ListTimeOffRequestsQueryDto,
  TimeOffRequestResponseDto,
} from './timeoff.dto';

@ApiTags('Time-Off Requests')
@Controller('time-off')
export class TimeOffController {
  constructor(private readonly timeOffService: TimeOffService) {}

  @Version('1')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit a new time-off request' })
  @ApiResponse({ status: 201, type: TimeOffRequestResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error or insufficient balance' })
  @ApiResponse({ status: 409, description: 'Overlapping request exists' })
  create(@Body() dto: CreateTimeOffRequestDto): TimeOffRequestResponseDto {
    return this.timeOffService.create(dto);
  }

  @Version('1')
  @Get()
  @ApiOperation({ summary: 'List time-off requests with optional filters' })
  @ApiResponse({ status: 200, type: [TimeOffRequestResponseDto] })
  list(@Query() query: ListTimeOffRequestsQueryDto): TimeOffRequestResponseDto[] {
    return this.timeOffService.list(query);
  }

  @Version('1')
  @Get(':id')
  @ApiOperation({ summary: 'Get a single time-off request' })
  @ApiParam({ name: 'id', description: 'Request UUID' })
  @ApiResponse({ status: 200, type: TimeOffRequestResponseDto })
  @ApiResponse({ status: 404, description: 'Not found' })
  getById(@Param('id') id: string): TimeOffRequestResponseDto {
    return this.timeOffService.getById(id);
  }

  @Version('1')
  @Patch(':id/review')
  @ApiOperation({ summary: 'Approve or reject a pending request (manager action)' })
  @ApiParam({ name: 'id', description: 'Request UUID' })
  @ApiResponse({ status: 200, type: TimeOffRequestResponseDto })
  review(
    @Param('id') id: string,
    @Body() dto: ReviewTimeOffRequestDto,
  ): TimeOffRequestResponseDto {
    return this.timeOffService.review(id, dto);
  }

  @Version('1')
  @Delete(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a pending or approved request (employee action)' })
  @ApiParam({ name: 'id', description: 'Request UUID' })
  @ApiQuery({ name: 'employee_id', required: true })
  @ApiResponse({ status: 200, type: TimeOffRequestResponseDto })
  cancel(
    @Param('id') id: string,
    @Query('employee_id') employeeId: string,
  ): TimeOffRequestResponseDto {
    return this.timeOffService.cancel(id, employeeId);
  }
}