import { Module } from '@nestjs/common';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';
import { HcmModule } from '@modules/hcm-sync/hcm.module';
import { BalanceModule } from '@modules/balance/balance.module';

@Module({
  imports: [HcmModule, BalanceModule],
  controllers: [SyncController],
  providers: [SyncService],
  exports: [SyncService],
})
export class SyncModule {}