import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { TimeOffRepository } from './time-off.repository';
import { BalanceRepository } from '@modules/balance/balance.repository';
import { BalanceService } from '@modules/balance/balance.service';
import {
  CreateTimeOffRequestDto,
  ReviewTimeOffRequestDto,
  ListTimeOffRequestsQueryDto,
  TimeOffRequestResponseDto,
} from './timeoff.dto';
import { TimeOffRequest } from './timeoff.entity';

@Injectable()
export class TimeOffService {
  constructor(
    private readonly repo: TimeOffRepository,
    private readonly balanceRepo: BalanceRepository,
    private readonly balanceService: BalanceService,
  ) {}

  create(dto: CreateTimeOffRequestDto): TimeOffRequestResponseDto {
    this.validateDates(dto.start_date, dto.end_date);

    const balance = this.balanceRepo.getAvailability(dto.employee_id);
    if (!balance) {
      throw new BadRequestException(
        `No balance record found for employee ${dto.employee_id}. ` +
          `Ensure a sync has run or create a balance manually.`,
      );
    }

    if (balance.days_available < dto.days_requested) {
      throw new BadRequestException(
        `Insufficient balance. Available: ${balance.days_available}, Requested: ${dto.days_requested}`,
      );
    }

    const overlap = this.repo.hasPendingOrApprovedOverlap(
      dto.employee_id,
      dto.start_date,
      dto.end_date,
    );
    if (overlap) {
      throw new ConflictException(
        `Employee ${dto.employee_id} already has a pending or approved request overlapping these dates.`,
      );
    }

    const request = this.repo.create(dto);
    this.balanceRepo.updatePending(dto.employee_id, dto.days_requested);
    return this.toDto(request);
  }

  review(id: string, dto: ReviewTimeOffRequestDto): TimeOffRequestResponseDto {
    const request = this.repo.findById(id);
    if (!request) throw new NotFoundException(`Request ${id} not found`);

    if (request.status !== 'pending') {
      throw new BadRequestException(
        `Cannot review a request with status '${request.status}'.`,
      );
    }

    const updated = this.repo.updateStatus(
      id,
      dto.status,
      dto.manager_id,
      dto.review_note,
    );

    if (dto.status === 'approved') {
      // Move from pending to used
      this.balanceRepo.updateUsed(request.employee_id, request.days_requested);
    } else if (dto.status === 'rejected') {
      // Release from pending
      this.balanceRepo.updatePending(request.employee_id, -request.days_requested);
    }

    return this.toDto(updated!);
  }

  cancel(id: string, employeeId: string): TimeOffRequestResponseDto {
    const request = this.repo.findById(id);
    if (!request) throw new NotFoundException(`Request ${id} not found`);

    if (request.employee_id !== employeeId) {
      throw new BadRequestException(`Request ${id} does not belong to employee ${employeeId}`);
    }

    if (!['pending', 'approved'].includes(request.status)) {
      throw new BadRequestException(
        `Cannot cancel a request with status '${request.status}'.`,
      );
    }

    const updated = this.repo.cancel(id);

    if (request.status === 'pending') {
      this.balanceRepo.updatePending(request.employee_id, -request.days_requested);
    } else if (request.status === 'approved') {
      // Refund used days
      this.balanceRepo.updateUsed(request.employee_id, -request.days_requested);
    }

    return this.toDto(updated!);
  }

  getById(id: string): TimeOffRequestResponseDto {
    const request = this.repo.findById(id);
    if (!request) throw new NotFoundException(`Request ${id} not found`);
    return this.toDto(request);
  }

  list(query: ListTimeOffRequestsQueryDto): TimeOffRequestResponseDto[] {
    return this.repo.list(query).map((r) => this.toDto(r));
  }

  private validateDates(start: string, end: string): void {
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new BadRequestException('Invalid date format. Use YYYY-MM-DD.');
    }
    if (startDate > endDate) {
      throw new BadRequestException('start_date must be before or equal to end_date.');
    }
  }

  private toDto(r: TimeOffRequest): TimeOffRequestResponseDto {
    return {
      id: r.id,
      employee_id: r.employee_id,
      type: r.type,
      status: r.status,
      start_date: r.start_date,
      end_date: r.end_date,
      days_requested: r.days_requested,
      reason: r.reason,
      manager_id: r.manager_id,
      reviewed_at: r.reviewed_at,
      review_note: r.review_note,
      created_at: r.created_at,
      updated_at: r.updated_at,
    };
  }
}