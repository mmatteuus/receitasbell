/**
 * Service Level Objectives (SLO) definition for Receitas Bell.
 * Used to monitor performance and reliability of the API.
 */

export const SLO_CONFIG = {
  // Target response time for 95% of requests
  LATENCY_P95_MS: 1000,
  
  // Target response time for 50% of requests (median)
  LATENCY_P50_MS: 300,

  // Critical latency threshold that triggers an error-level log
  LATENCY_CRITICAL_MS: 3000,

  // Success rate target (availability)
  AVAILABILITY_TARGET: 99.9,
};

export interface SLOMetrics {
  durationMs: number;
  status: number;
  route: string;
  isLatencyBreach: boolean;
  isErrorBreach: boolean;
}

/**
 * Checks if a request breached the defined SLO targets.
 */
export function checkSLO(durationMs: number, status: number): {
  breached: boolean;
  critical: boolean;
  type?: 'latency' | 'error';
} {
  if (status >= 500) {
    return { breached: true, critical: true, type: 'error' };
  }

  if (durationMs > SLO_CONFIG.LATENCY_CRITICAL_MS) {
    return { breached: true, critical: true, type: 'latency' };
  }

  if (durationMs > SLO_CONFIG.LATENCY_P95_MS) {
    return { breached: true, critical: false, type: 'latency' };
  }

  return { breached: false, critical: false };
}
