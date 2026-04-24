import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@database/database.service';
import { TimeOffRequest, TimeOffStatus } from './timeoff.entity';
import {
  CreateTimeOffRequestDto,
  ListTimeOffRequestsQueryDto,
} from './timeoff.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TimeOffRepository {
  constructor(private readonly db: DatabaseService) {}

  findById(id: string): TimeOffRequest | undefined {
    return this.db.get<TimeOffRequest>(
      `SELECT * FROM time_off_requests WHERE id = ?`,
      [id],
    );
  }

  create(dto: CreateTimeOffRequestDto): TimeOffRequest {
    const id = uuidv4();
    this.db.run(
      `INSERT INTO time_off_requests
         (id, employee_id, type, status, start_date, end_date, days_requested, reason, manager_id)
       VALUES (?, ?, ?, 'pending', ?, ?, ?, ?, ?)`,
      [
        id,
        dto.employee_id,
        dto.type,
        dto.start_date,
        dto.end_date,
        dto.days_requested,
        dto.reason ?? null,
        dto.manager_id ?? null,
      ],
    );
    return this.findById(id)!;
  }

  updateStatus(
    id: string,
    status: TimeOffStatus,
    managerId: string,
    reviewNote?: string,
  ): TimeOffRequest | undefined {
    this.db.run(
      `UPDATE time_off_requests
       SET status = ?, manager_id = ?, reviewed_at = datetime('now'),
           review_note = ?, updated_at = datetime('now')
       WHERE id = ?`,
      [status, managerId, reviewNote ?? null, id],
    );
    return this.findById(id);
  }

  cancel(id: string): TimeOffRequest | undefined {
    this.db.run(
      `UPDATE time_off_requests
       SET status = 'cancelled', updated_at = datetime('now')
       WHERE id = ?`,
      [id],
    );
    return this.findById(id);
  }

  list(query: ListTimeOffRequestsQueryDto): TimeOffRequest[] {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (query.employee_id) {
      conditions.push('employee_id = ?');
      params.push(query.employee_id);
    }
    if (query.status) {
      conditions.push('status = ?');
      params.push(query.status);
    }
    if (query.from) {
      conditions.push('start_date >= ?');
      params.push(query.from);
    }
    if (query.to) {
      conditions.push('end_date <= ?');
      params.push(query.to);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    return this.db.all<TimeOffRequest>(
      `SELECT * FROM time_off_requests ${where} ORDER BY created_at DESC`,
      params,
    );
  }

  hasPendingOrApprovedOverlap(
    employeeId: string,
    startDate: string,
    endDate: string,
    excludeId?: string,
  ): boolean {
    const row = this.db.get<{ cnt: number }>(
      `SELECT COUNT(*) as cnt FROM time_off_requests
       WHERE employee_id = ?
         AND status IN ('pending', 'approved')
         AND start_date <= ?
         AND end_date >= ?
         AND id != COALESCE(?, '')`,
      [employeeId, endDate, startDate, excludeId ?? null],
    );
    return (row?.cnt ?? 0) > 0;
  }
}