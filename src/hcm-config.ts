import { registerAs } from '@nestjs/config';

export const hcmConfig = registerAs('hcm', () => ({
  baseUrl: process.env.HCM_BASE_URL ?? 'http://localhost:4000',
  apiKey: process.env.HCM_API_KEY ?? '',
  timeoutMs: parseInt(process.env.HCM_TIMEOUT_MS ?? '5000', 10),
  retryAttempts: parseInt(process.env.HCM_RETRY_ATTEMPTS ?? '3', 10),
  retryDelayMs: parseInt(process.env.HCM_RETRY_DELAY_MS ?? '500', 10),
  syncCron: process.env.HCM_SYNC_CRON ?? '0 */6 * * *',
}));