export const SYNC_BACKOFF_MS = [2000, 5000, 15000, 60000, 300000];
export const MAX_AUTOMATIC_SYNC_RETRIES = 5;

export function computeNextRetryAt(retryCount: number) {
  const baseDelay = SYNC_BACKOFF_MS[Math.min(retryCount, SYNC_BACKOFF_MS.length - 1)] ?? 300000;
  const jitter = Math.floor(Math.random() * 500);
  return new Date(Date.now() + baseDelay + jitter).toISOString();
}
