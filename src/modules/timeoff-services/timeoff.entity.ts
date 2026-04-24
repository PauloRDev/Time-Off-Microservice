export type TimeOffType = 'vacation' | 'sick' | 'personal' | 'other';
export type TimeOffStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface TimeOffRequest {
  id: string;
  employee_id: string;
  type: TimeOffType;
  status: TimeOffStatus;
  start_date: string;
  end_date: string;
  days_requested: number;
  reason: string | null;
  manager_id: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  created_at: string;
  updated_at: string;
}