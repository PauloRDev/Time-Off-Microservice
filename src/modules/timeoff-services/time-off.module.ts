import { Module } from '@nestjs/common';
import { TimeOffController } from './time-off.controller';
import { TimeOffService } from './time-off.service';
import { TimeOffRepository } from './time-off.repository';
import { TimeOffRequest } from './timeoff.entity';
import { BalanceModule } from '@modules/balance/balance.module';

@Module({
  imports: [BalanceModule],
  controllers: [TimeOffController],
  providers: [TimeOffService, TimeOffRepository],
  exports: [TimeOffService],
})
export class TimeOffModule {}
export { TimeOffRequest };

