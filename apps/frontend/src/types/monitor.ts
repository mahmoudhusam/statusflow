export type Monitor = {
  id: string;
  name: string;
  url: string;
  interval?: number;
  paused?: boolean;
  maxLatencyMs?: number;
  maxConsecutiveFailures?: number;
  lastCheckedAt?: string | null;
  lastStatus?: 'UP' | 'DOWN';
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
  };
  checkResults?: any[];
};
