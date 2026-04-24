import { Controller, Post, Get, Version, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SyncService, SyncResult } from './sync.service';

@ApiTags('Sync')
@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Version('1')
  @Post('trigger')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Manually trigger an HCM sync' })
  @ApiResponse({ status: 200, description: 'Sync result' })
  async triggerSync(): Promise<SyncResult> {
    return this.syncService.runSync();
  }

  @Version('1')
  @Get('logs')
  @ApiOperation({ summary: 'Get recent sync logs' })
  getSyncLogs(): unknown[] {
    return this.syncService.getSyncLogs();
  }
}