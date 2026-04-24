export interface HcmBalanceRecord {
  employeeId: string;
  daysTotal: number;
  daysUsed: number;
  year: number;
}

export interface HcmSendErrorPayload {
  requestId: string;
  employeeId: string;
  errorCode: string;
  errorMessage: string;
  occurredAt: string;
}

export interface HcmApiResponse<T> {
  data: T;
  status: number;
}