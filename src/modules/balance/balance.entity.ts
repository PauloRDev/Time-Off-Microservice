export interface Balance {
  id: string;
  employee_id: string;
  days_total: number;
  days_used: number;
  days_pending: number;
  year: number;
  source: 'hcm' | 'manual';
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BalanceAvailability {
  employee_id: string;
  days_total: number;
  days_used: number;
  days_pending: number;
  days_available: number;
  year: number;
  last_synced_at: string | null;
}