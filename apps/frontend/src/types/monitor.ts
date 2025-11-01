export type Monitor = {
  id: string;
  name: string;
  url: string;
  interval?: number;
  paused?: boolean;
  maxLatencyMs?: number;
  maxConsecutiveFailures?: number;
  lastCheckedAt?: string | null;
  lastStatusCode?: number;
  lastResponseTimeMs?: number;
  httpMethod?: string;
  timeout?: number;
  headers?: Record<string, string> | null;
  body?: string | null;
  createdAt?: string;
  updatedAt?: string;
  user?: {
    id: string;
    email?: string;
  };
  checkResults?: CheckResult[];
};

export type CheckResult = {
  id: string;
  timestamp: string;
  status: 'UP' | 'DOWN';
  statusCode?: number;
  responseTimeMs?: number;
  errorMessage?: string;
};

export type TimeRange = '1h' | '24h' | '7d' | '30d';

export type MonitorStats = {
  uptimePercentage: number;
  averageLatency: number;
  p95Latency: number;
  errorCount: number;
  totalChecks: number;
};
