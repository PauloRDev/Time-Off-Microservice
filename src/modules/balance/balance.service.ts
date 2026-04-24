import { Injectable, NotFoundException } from '@nestjs/common';
import { BalanceRepository } from './balance.repository';
import { BalanceAvailability } from './balance.entity';
import { UpsertBalanceDto, BalanceResponseDto } from './balance.dto';

@Injectable()
export class BalanceService {
  constructor(private readonly repo: BalanceRepository) {}

  getBalance(employeeId: string): BalanceResponseDto {
    const balance = this.repo.getAvailability(employeeId);
    if (!balance) {
      throw new NotFoundException(
        `Balance not found for employee ${employeeId}. Run a sync or create manually.`,
      );
    }
    return this.toDto(balance);
  }

  upsertBalance(dto: UpsertBalanceDto, source: 'hcm' | 'manual' = 'manual'): BalanceResponseDto {
    const balance = this.repo.upsert(dto, source);
    const availability = this.repo.getAvailability(balance.employee_id)!;
    return this.toDto(availability);
  }

  hasEnoughBalance(employeeId: string, daysRequested: number): boolean {
    const balance = this.repo.getAvailability(employeeId);
    if (!balance) return false;
    return balance.days_available >= daysRequested;
  }

  private toDto(b: BalanceAvailability): BalanceResponseDto {
    return {
      employee_id: b.employee_id,
      days_total: b.days_total,
      days_used: b.days_used,
      days_pending: b.days_pending,
      days_available: b.days_available,
      year: b.year,
      last_synced_at: b.last_synced_at,
    };
  }
}