import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { TimeOffService } from '@modules/timeoff-services/time-off.service';
import { TimeOffRepository } from '@modules/timeoff-services/time-off.repository';
import { BalanceRepository } from '@modules/balance/balance.repository';
import { BalanceService } from '@modules/balance/balance.service';
import { makeRequest, makeAvailability } from './factories';


const mockTimeOffRepo = {
  findById: jest.fn(),
  create: jest.fn(),
  updateStatus: jest.fn(),
  cancel: jest.fn(),
  list: jest.fn(),
  hasPendingOrApprovedOverlap: jest.fn(),
};

const mockBalanceRepo = {
  getAvailability: jest.fn(),
  upsert: jest.fn(),
  updatePending: jest.fn(),
  updateUsed: jest.fn(),
};

const mockBalanceService = {
  getBalance: jest.fn(),
  upsertBalance: jest.fn(),
  hasEnoughBalance: jest.fn(),
};

describe('TimeOffService', () => {
  let service: TimeOffService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TimeOffService,
        { provide: TimeOffRepository, useValue: mockTimeOffRepo },
        { provide: BalanceRepository, useValue: mockBalanceRepo },
        { provide: BalanceService, useValue: mockBalanceService },
      ],
    }).compile();

    service = module.get<TimeOffService>(TimeOffService);
    jest.clearAllMocks();
  });

  // ── create ─────────────────────────────────────────────────────────────────
  describe('create', () => {
    const validDto = {
      employee_id: 'EMP001',
      type: 'vacation' as const,
      start_date: '2024-08-01',
      end_date: '2024-08-05',
      days_requested: 5,
    };

    it('creates a request and reserves pending balance', () => {
      mockBalanceRepo.getAvailability.mockReturnValue(makeAvailability());
      mockTimeOffRepo.hasPendingOrApprovedOverlap.mockReturnValue(false);
      mockTimeOffRepo.create.mockReturnValue(makeRequest());

      const result = service.create(validDto);

      expect(mockTimeOffRepo.create).toHaveBeenCalledWith(validDto);
      expect(mockBalanceRepo.updatePending).toHaveBeenCalledWith('EMP001', 5);
      expect(result.status).toBe('pending');
    });

    it('throws BadRequestException when employee has no balance record', () => {
      mockBalanceRepo.getAvailability.mockReturnValue(undefined);
      expect(() => service.create(validDto)).toThrow(BadRequestException);
    });

    it('throws BadRequestException when insufficient balance', () => {
      mockBalanceRepo.getAvailability.mockReturnValue(
        makeAvailability({ days_available: 2 }),
      );
      expect(() => service.create({ ...validDto, days_requested: 5 })).toThrow(
        BadRequestException,
      );
    });

    it('throws ConflictException when overlapping request exists', () => {
      mockBalanceRepo.getAvailability.mockReturnValue(makeAvailability());
      mockTimeOffRepo.hasPendingOrApprovedOverlap.mockReturnValue(true);
      expect(() => service.create(validDto)).toThrow(ConflictException);
    });

    it('throws BadRequestException when start_date is after end_date', () => {
      mockBalanceRepo.getAvailability.mockReturnValue(makeAvailability());
      mockTimeOffRepo.hasPendingOrApprovedOverlap.mockReturnValue(false);
      expect(() =>
        service.create({ ...validDto, start_date: '2024-08-10', end_date: '2024-08-01' }),
      ).toThrow(BadRequestException);
    });

    it('allows request when days_requested exactly equals days_available', () => {
      mockBalanceRepo.getAvailability.mockReturnValue(
        makeAvailability({ days_available: 5 }),
      );
      mockTimeOffRepo.hasPendingOrApprovedOverlap.mockReturnValue(false);
      mockTimeOffRepo.create.mockReturnValue(makeRequest({ days_requested: 5 }));

      expect(() => service.create({ ...validDto, days_requested: 5 })).not.toThrow();
    });
  });

  // ── review ─────────────────────────────────────────────────────────────────
  describe('review', () => {
    it('approves a pending request and moves days from pending to used', () => {
      const pending = makeRequest({ status: 'pending' });
      const approved = makeRequest({ status: 'approved' });
      mockTimeOffRepo.findById.mockReturnValue(pending);
      mockTimeOffRepo.updateStatus.mockReturnValue(approved);

      const result = service.review('req-uuid-001', {
        status: 'approved',
        manager_id: 'MGR001',
      });

      expect(result.status).toBe('approved');
      expect(mockBalanceRepo.updateUsed).toHaveBeenCalledWith('EMP001', 5);
    });

    it('rejects a pending request and releases pending days', () => {
      const pending = makeRequest({ status: 'pending' });
      const rejected = makeRequest({ status: 'rejected' });
      mockTimeOffRepo.findById.mockReturnValue(pending);
      mockTimeOffRepo.updateStatus.mockReturnValue(rejected);

      service.review('req-uuid-001', { status: 'rejected', manager_id: 'MGR001' });

      expect(mockBalanceRepo.updatePending).toHaveBeenCalledWith('EMP001', -5);
    });

    it('throws NotFoundException for unknown request ID', () => {
      mockTimeOffRepo.findById.mockReturnValue(undefined);
      expect(() =>
        service.review('bad-id', { status: 'approved', manager_id: 'MGR001' }),
      ).toThrow(NotFoundException);
    });

    it('throws BadRequestException when request is not pending', () => {
      mockTimeOffRepo.findById.mockReturnValue(makeRequest({ status: 'approved' }));
      expect(() =>
        service.review('req-uuid-001', { status: 'approved', manager_id: 'MGR001' }),
      ).toThrow(BadRequestException);
    });
  });

  // ── cancel ─────────────────────────────────────────────────────────────────
  describe('cancel', () => {
    it('cancels a pending request and releases pending balance', () => {
      const pending = makeRequest({ status: 'pending' });
      const cancelled = makeRequest({ status: 'cancelled' });
      mockTimeOffRepo.findById.mockReturnValue(pending);
      mockTimeOffRepo.cancel.mockReturnValue(cancelled);

      const result = service.cancel('req-uuid-001', 'EMP001');

      expect(result.status).toBe('cancelled');
      expect(mockBalanceRepo.updatePending).toHaveBeenCalledWith('EMP001', -5);
    });

    it('cancels an approved request and refunds used days', () => {
      const approved = makeRequest({ status: 'approved' });
      const cancelled = makeRequest({ status: 'cancelled' });
      mockTimeOffRepo.findById.mockReturnValue(approved);
      mockTimeOffRepo.cancel.mockReturnValue(cancelled);

      service.cancel('req-uuid-001', 'EMP001');

      expect(mockBalanceRepo.updateUsed).toHaveBeenCalledWith('EMP001', -5);
    });

    it('throws BadRequestException when employee_id does not match', () => {
      mockTimeOffRepo.findById.mockReturnValue(makeRequest({ employee_id: 'EMP002' }));
      expect(() => service.cancel('req-uuid-001', 'EMP001')).toThrow(BadRequestException);
    });

    it('throws BadRequestException when request is already rejected', () => {
      mockTimeOffRepo.findById.mockReturnValue(makeRequest({ status: 'rejected' }));
      expect(() => service.cancel('req-uuid-001', 'EMP001')).toThrow(BadRequestException);
    });

    it('throws NotFoundException for unknown ID', () => {
      mockTimeOffRepo.findById.mockReturnValue(undefined);
      expect(() => service.cancel('bad-id', 'EMP001')).toThrow(NotFoundException);
    });
  });

  // ── list ───────────────────────────────────────────────────────────────────
  describe('list', () => {
    it('returns mapped DTOs for all matching requests', () => {
      const requests = [makeRequest(), makeRequest({ id: 'req-uuid-002', status: 'approved' })];
      mockTimeOffRepo.list.mockReturnValue(requests);

      const result = service.list({});

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('req-uuid-001');
    });

    it('returns empty array when no requests found', () => {
      mockTimeOffRepo.list.mockReturnValue([]);
      expect(service.list({ status: 'pending' })).toEqual([]);
    });
  });

  // ── getById ────────────────────────────────────────────────────────────────
  describe('getById', () => {
    it('returns DTO when found', () => {
      mockTimeOffRepo.findById.mockReturnValue(makeRequest());
      expect(service.getById('req-uuid-001').id).toBe('req-uuid-001');
    });

    it('throws NotFoundException when not found', () => {
      mockTimeOffRepo.findById.mockReturnValue(undefined);
      expect(() => service.getById('bad-id')).toThrow(NotFoundException);
    });
  });
});