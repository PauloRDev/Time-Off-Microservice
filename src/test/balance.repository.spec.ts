import { Test, TestingModule } from '@nestjs/testing';
import { BalanceRepository } from '@modules/balance/balance.repository';
import { DatabaseService } from '@database/database.service';
import { makeBalance, makeAvailability } from './factories';
import { resetDbMocks, mockDatabaseService } from './database.mock';

describe('BalanceRepository', () => {
  let repo: BalanceRepository;

  beforeEach(async () => {
    resetDbMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BalanceRepository,
        { provide: DatabaseService, useValue: mockDatabaseService },
      ],
    }).compile();

    repo = module.get<BalanceRepository>(BalanceRepository);
  });

  describe('findByEmployee', () => {
    it('returns balance when found', () => {
      const balance = makeBalance();
      mockDatabaseService.get.mockReturnValue(balance);

      const result = repo.findByEmployee('EMP001');

      expect(result).toEqual(balance);
      expect(mockDatabaseService.get).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        ['EMP001'],
      );
    });

    it('returns undefined when not found', () => {
      mockDatabaseService.get.mockReturnValue(undefined);
      expect(repo.findByEmployee('NONE')).toBeUndefined();
    });
  });

  describe('getAvailability', () => {
    it('returns availability DTO with computed days_available', () => {
      const avail = makeAvailability();
      mockDatabaseService.get.mockReturnValue(avail);

      const result = repo.getAvailability('EMP001');

      expect(result?.days_available).toBe(15);
    });
  });

  describe('upsert', () => {
    it('creates a new balance when none exists', () => {
      mockDatabaseService.get
        .mockReturnValueOnce(undefined) // findByEmployee (check existing)
        .mockReturnValueOnce(makeBalance()); // findByEmployee (after insert)

      const result = repo.upsert({ employee_id: 'EMP001', days_total: 20, days_used: 5 });

      expect(mockDatabaseService.run).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO balances'),
        expect.arrayContaining(['EMP001', 20, 5]),
      );
      expect(result.employee_id).toBe('EMP001');
    });

    it('updates existing balance', () => {
      const existing = makeBalance();
      mockDatabaseService.get
        .mockReturnValueOnce(existing) // findByEmployee (check existing)
        .mockReturnValueOnce({ ...existing, days_total: 25 }); // after update

      const result = repo.upsert({ employee_id: 'EMP001', days_total: 25, days_used: 5 });

      expect(mockDatabaseService.run).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE balances'),
        expect.arrayContaining(['EMP001']),
      );
      expect(result.days_total).toBe(25);
    });
  });

  describe('updatePending', () => {
    it('calls run with the correct delta', () => {
      repo.updatePending('EMP001', 3);
      expect(mockDatabaseService.run).toHaveBeenCalledWith(
        expect.stringContaining('days_pending'),
        [3, 'EMP001'],
      );
    });
  });

  describe('updateUsed', () => {
    it('moves days from pending to used', () => {
      repo.updateUsed('EMP001', 5);
      expect(mockDatabaseService.run).toHaveBeenCalledWith(
        expect.stringContaining('days_used'),
        [5, 5, 'EMP001'],
      );
    });
  });
});