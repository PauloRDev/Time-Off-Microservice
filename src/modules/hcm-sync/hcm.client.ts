import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  HcmBalanceRecord,
  HcmSendErrorPayload,
} from './hcm.dto';

@Injectable()
export class HcmClient {
  private readonly logger = new Logger(HcmClient.name);
  private readonly http: AxiosInstance;
  private readonly retryAttempts: number;
  private readonly retryDelayMs: number;

  constructor(private readonly config: ConfigService) {
    const baseURL = this.config.get<string>('hcm.baseUrl')!;
    const apiKey = this.config.get<string>('hcm.apiKey')!;
    const timeout = this.config.get<number>('hcm.timeoutMs')!;

    this.retryAttempts = this.config.get<number>('hcm.retryAttempts', 3);
    this.retryDelayMs = this.config.get<number>('hcm.retryDelayMs', 500);

    this.http = axios.create({
      baseURL,
      timeout,
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });
  }

  async fetchAllBalances(): Promise<HcmBalanceRecord[]> {
    return this.withRetry(async () => {
      const { data } = await this.http.get<HcmBalanceRecord[]>('/balances');
      return data;
    }, 'fetchAllBalances');
  }

  async fetchBalanceByEmployee(employeeId: string): Promise<HcmBalanceRecord> {
    return this.withRetry(async () => {
      const { data } = await this.http.get<HcmBalanceRecord>(
        `/balances/${employeeId}`,
      );
      return data;
    }, `fetchBalance:${employeeId}`);
  }

  async sendError(payload: HcmSendErrorPayload): Promise<void> {
    try {
      await this.http.post('/errors', payload);
    } catch (err) {
      // Best-effort — log but don't throw
      this.logger.error('Failed to send error to HCM', err);
    }
  }

  private async withRetry<T>(
    fn: () => Promise<T>,
    context: string,
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err as Error;
        const axiosErr = err as AxiosError;
        const status = axiosErr.response?.status;

        // Do not retry on client errors (4xx)
        if (status && status >= 400 && status < 500) {
          this.logger.warn(
            `HCM ${context}: non-retryable error ${status}`,
          );
          throw err;
        }

        this.logger.warn(
          `HCM ${context}: attempt ${attempt}/${this.retryAttempts} failed. Retrying in ${this.retryDelayMs}ms...`,
        );

        if (attempt < this.retryAttempts) {
          await this.sleep(this.retryDelayMs * attempt); // exponential-ish back-off
        }
      }
    }

    this.logger.error(`HCM ${context}: all ${this.retryAttempts} attempts failed`);
    throw new InternalServerErrorException(
      `HCM request failed after ${this.retryAttempts} attempts: ${lastError?.message}`,
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}