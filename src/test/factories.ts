import { Balance } from '../modules/balance/balance.entity';
import { TimeOffRequest } from '../modules/timeoff-services/time-off.module';
import { HcmBalanceRecord } from '../modules/hcm-sync/hcm.dto';

export const makeBalance = (overrides: Partial<Balance> = {}): Balance => ({
  id: 'bal-uuid-001',
  employee_id: 'EMP001',
  days_total: 20,
  days_used: 5,
  days_pending: 0,
  year: new Date().getFullYear(),
  source: 'hcm',
  last_synced_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

export const makeAvailability = (overrides = {}) => ({
  employee_id: 'EMP001',
  days_total: 20,
  days_used: 5,
  days_pending: 0,
  days_available: 15,
  year: new Date().getFullYear(),
  last_synced_at: new Date().toISOString(),
  ...overrides,
});

export const makeRequest = (overrides: Partial<TimeOffRequest> = {}): TimeOffRequest => ({
  id: 'req-uuid-001',
  employee_id: 'EMP001',
  type: 'vacation',
  status: 'pending',
  start_date: '2024-08-01',
  end_date: '2024-08-05',
  days_requested: 5,
  reason: 'Summer holiday',
  manager_id: null,
  reviewed_at: null,
  review_note: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

export const makeHcmBalance = (overrides: Partial<HcmBalanceRecord> = {}): HcmBalanceRecord => ({
  employeeId: 'EMP001',
  daysTotal: 20,
  daysUsed: 5,
  year: new Date().getFullYear(),
  ...overrides,
});