import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@database/database.service';
import { Balance, BalanceAvailability } from './balance.entity';
import { UpsertBalanceDto } from './balance.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class BalanceRepository {
  constructor(private readonly db: DatabaseService) {}

  findByEmployee(employeeId: string): Balance | undefined {
    return this.db.get<Balance>(
      `SELECT * FROM balances WHERE employee_id = ?`,
      [employeeId],
    );
  }

  getAvailability(employeeId: string): BalanceAvailability | undefined {
    return this.db.get<BalanceAvailability>(
      `SELECT
         employee_id,
         days_total,
         days_used,
         days_pending,
         ROUND(days_total - days_used - days_pending, 2) AS days_available,
         year,
         last_synced_at
       FROM balances WHERE employee_id = ?`,
      [employeeId],
    );
  }

  upsert(dto: UpsertBalanceDto, source: 'hcm' | 'manual' = 'hcm'): Balance {
    const year = dto.year ?? new Date().getFullYear();
    const existing = this.findByEmployee(dto.employee_id);

    if (existing) {
      this.db.run(
        `UPDATE balances
         SET days_total = ?, days_used = ?, source = ?, year = ?,
             last_synced_at = datetime('now'), updated_at = datetime('now')
         WHERE employee_id = ?`,
        [dto.days_total, dto.days_used, source, year, dto.employee_id],
      );
      return this.findByEmployee(dto.employee_id)!;
    }

    const id = uuidv4();
    this.db.run(
      `INSERT INTO balances (id, employee_id, days_total, days_used, days_pending, year, source, last_synced_at)
       VALUES (?, ?, ?, ?, 0, ?, ?, datetime('now'))`,
      [id, dto.employee_id, dto.days_total, dto.days_used, year, source],
    );
    return this.findByEmployee(dto.employee_id)!;
  }

  updatePending(employeeId: string, delta: number): void {
    this.db.run(
      `UPDATE balances
       SET days_pending = MAX(0, days_pending + ?), updated_at = datetime('now')
       WHERE employee_id = ?`,
      [delta, employeeId],
    );
  }

  updateUsed(employeeId: string, delta: number): void {
    this.db.run(
      `UPDATE balances
       SET days_used = days_used + ?,
           days_pending = MAX(0, days_pending - ?),
           updated_at = datetime('now')
       WHERE employee_id = ?`,
      [delta, delta, employeeId],
    );
  }

  listAll(): Balance[] {
    return this.db.all<Balance>(`SELECT * FROM balances ORDER BY employee_id`);
  }
}