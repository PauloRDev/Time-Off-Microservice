import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { HcmClient } from './hcm.client';
import { BalanceRepository } from '@modules/balance/balance.repository';
import { DatabaseService } from '@database/database.service';
import { v4 as uuidv4 } from 'uuid';

export interface SyncResult {
  syncId: string;
  startedAt: string;
  finishedAt: string;
  status: 'success' | 'failed';
  recordsSynced: number;
  error?: string;
}

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    private readonly hcmClient: HcmClient,
    private readonly balanceRepo: BalanceRepository,
    private readonly db: DatabaseService,
    private readonly config: ConfigService,
  ) {}

  @Cron(process.env.HCM_SYNC_CRON ?? '0 */6 * * *', { name: 'hcm-sync' })
  async scheduledSync(): Promise<void> {
    this.logger.log('Scheduled HCM sync triggered');
    await this.runSync();
  }

  async runSync(): Promise<SyncResult> {
    const syncId = uuidv4();
    const startedAt = new Date().toISOString();
    this.db.run(
      `INSERT INTO sync_logs (id, started_at, status) VALUES (?, ?, 'running')`,
      [syncId, startedAt],
    );

    try {
      const balances = await this.hcmClient.fetchAllBalances();
      let synced = 0;

      this.db.transaction(() => {
        for (const b of balances) {
          this.balanceRepo.upsert(
            {
              employee_id: b.employeeId,
              days_total: b.daysTotal,
              days_used: b.daysUsed,
              year: b.year,
            },
            'hcm',
          );
          synced++;
        }
      });

      const finishedAt = new Date().toISOString();
      this.db.run(
        `UPDATE sync_logs
         SET finished_at = ?, status = 'success', records_synced = ?
         WHERE id = ?`,
        [finishedAt, synced, syncId],
      );

      this.logger.log(`HCM sync completed: ${synced} records synced`);
      return { syncId, startedAt, finishedAt, status: 'success', recordsSynced: synced };
    } catch (err) {
      const finishedAt = new Date().toISOString();
      const errorMsg = (err as Error).message;
      this.db.run(
        `UPDATE sync_logs
         SET finished_at = ?, status = 'failed', error_message = ?
         WHERE id = ?`,
        [finishedAt, errorMsg, syncId],
      );

      this.logger.error(`HCM sync failed: ${errorMsg}`);
      return {
        syncId,
        startedAt,
        finishedAt,
        status: 'failed',
        recordsSynced: 0,
        error: errorMsg,
      };
    }
  }

  getSyncLogs(limit = 20): unknown[] {
    return this.db.all(
      `SELECT * FROM sync_logs ORDER BY started_at DESC LIMIT ?`,
      [limit],
    );
  }
}