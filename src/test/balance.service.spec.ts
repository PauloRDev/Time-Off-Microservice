import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { BalanceService } from '@modules/balance/balance.service';
import { BalanceRepository } from '@modules/balance/balance.repository';
import { makeAvailability } from './factories';

const mockBalanceRepo = {
  getAvailability: jest.fn(),
  upsert: jest.fn(),
  findByEmployee: jest.fn(),
  updatePending: jest.fn(),
  updateUsed: jest.fn(),
  listAll: jest.fn(),
};

describe('BalanceService', () => {
  let service: BalanceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BalanceService,
        { provide: BalanceRepository, useValue: mockBalanceRepo },
      ],
    }).compile();

    service = module.get<BalanceService>(BalanceService);
    jest.clearAllMocks();
  });

  // ── getBalance ─────────────────────────────────────────────────────────────
  describe('getBalance', () => {
    it('returns balance DTO when record exists', () => {
      const avail = makeAvailability();
      mockBalanceRepo.getAvailability.mockReturnValue(avail);

      const result = service.getBalance('EMP001');

      expect(result.employee_id).toBe('EMP001');
      expect(result.days_available).toBe(15);
      expect(result.days_pending).toBe(0);
      expect(mockBalanceRepo.getAvailability).toHaveBeenCalledWith('EMP001');
    });

    it('throws NotFoundException when employee has no balance', () => {
      mockBalanceRepo.getAvailability.mockReturnValue(undefined);
      expect(() => service.getBalance('UNKNOWN')).toThrow(NotFoundException);
    });
  });

  // ── upsertBalance ──────────────────────────────────────────────────────────
  describe('upsertBalance', () => {
    it('creates or updates a balance and returns availability', () => {
      const avail = makeAvailability({ days_total: 25, days_used: 3, days_available: 22 });
      mockBalanceRepo.upsert.mockReturnValue({ employee_id: 'EMP001' });
      mockBalanceRepo.getAvailability.mockReturnValue(avail);

      const result = service.upsertBalance(
        { employee_id: 'EMP001', days_total: 25, days_used: 3 },
        'manual',
      );

      expect(result.days_total).toBe(25);
      expect(mockBalanceRepo.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ employee_id: 'EMP001' }),
        'manual',
      );
    });
  });

  // ── hasEnoughBalance ───────────────────────────────────────────────────────
  describe('hasEnoughBalance', () => {
    it('returns true when days_available >= requested', () => {
      mockBalanceRepo.getAvailability.mockReturnValue(makeAvailability({ days_available: 15 }));
      expect(service.hasEnoughBalance('EMP001', 10)).toBe(true);
    });

    it('returns false when days_available < requested', () => {
      mockBalanceRepo.getAvailability.mockReturnValue(makeAvailability({ days_available: 3 }));
      expect(service.hasEnoughBalance('EMP001', 5)).toBe(false);
    });

    it('returns false when no balance record exists', () => {
      mockBalanceRepo.getAvailability.mockReturnValue(undefined);
      expect(service.hasEnoughBalance('EMP_NONE', 1)).toBe(false);
    });

    it('returns true when requested equals exactly available', () => {
      mockBalanceRepo.getAvailability.mockReturnValue(makeAvailability({ days_available: 5 }));
      expect(service.hasEnoughBalance('EMP001', 5)).toBe(true);
    });
  });
});