import { useState, useEffect, useCallback } from 'react';

interface UseAsyncDataOptions {
  simulateDelay?: number;
  simulateErrorRate?: number;
  retryCount?: number;
  retryDelay?: number;
}

interface UseAsyncDataResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  retry: () => void;
  refresh: () => void;
}

export function useAsyncData<T>(
  fetchFn: () => Promise<T> | T,
  deps: React.DependencyList = [],
  options: UseAsyncDataOptions = {}
): UseAsyncDataResult<T> {
  const {
    simulateDelay = 800,
    simulateErrorRate = 0.3,
    retryCount = 3,
    retryDelay = 1000,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);
  const [retryTrigger, setRetryTrigger] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Simulate network delay in development
      if (process.env.NODE_ENV === 'development' && simulateDelay > 0) {
        await new Promise((resolve) => setTimeout(resolve, simulateDelay));
      }

      // Simulate random errors in development for testing
      if (
        process.env.NODE_ENV === 'development' &&
        Math.random() < simulateErrorRate &&
        attemptCount === 0 // Only simulate error on first attempt
      ) {
        throw new Error('Simulated network error for testing');
      }

      const result = await fetchFn();
      setData(result);
      setAttemptCount(0);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An unexpected error occurred';
      const error = new Error(errorMessage);

      setError(error);

      // Auto-retry logic
      if (attemptCount < retryCount - 1) {
        setTimeout(() => {
          setAttemptCount((prev) => prev + 1);
          setRetryTrigger((prev) => prev + 1);
        }, retryDelay);
      }
    } finally {
      setLoading(false);
    }
  }, [
    fetchFn,
    attemptCount,
    retryCount,
    retryDelay,
    simulateDelay,
    simulateErrorRate,
  ]);

  useEffect(() => {
    fetchData();
  }, [...deps, retryTrigger]);

  const retry = useCallback(() => {
    setAttemptCount(0);
    setRetryTrigger((prev) => prev + 1);
  }, []);

  const refresh = useCallback(() => {
    setAttemptCount(0);
    fetchData();
  }, [fetchData]);

  return { data, loading, error, retry, refresh };
}

// Helper function to simulate API delays
export async function simulateApiCall<T>(
  data: T,
  options: { delay?: number; shouldFail?: boolean } = {}
): Promise<T> {
  const { delay = 800, shouldFail = false } = options;

  await new Promise((resolve) => setTimeout(resolve, delay));

  if (shouldFail) {
    throw new Error('API call failed');
  }

  return data;
}
