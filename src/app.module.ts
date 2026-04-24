import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { appConfig } from '@config/app.config';
import { hcmConfig } from './hcm-config';
import { DatabaseModule } from '@database/database.module';
import { TimeOffModule } from './modules/timeoff-services/time-off.module';
import { BalanceModule } from '@modules/balance/balance.module';
import { HcmModule } from './modules/hcm-sync/hcm.module';
import { SyncModule } from './modules/hcm-sync/sync.module';




@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, hcmConfig],
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.THROTTLE_TTL ?? '60') * 1000,
        limit: parseInt(process.env.THROTTLE_LIMIT ?? '100'),
      },
    ]),
    ScheduleModule.forRoot(),
    DatabaseModule,
    HcmModule,
    BalanceModule,
    TimeOffModule,
    SyncModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}