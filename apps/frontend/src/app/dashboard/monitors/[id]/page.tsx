'use client';

import { useState, useEffect, use } from 'react';
import { notFound } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { monitorsApi } from '@/lib/api/monitors';
import { MonitorDetailsComponent } from '@/components/monitors/MonitorDetailsComponent';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';
import type { Monitor } from '@/types/monitor';

interface MonitorPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function MonitorPage({ params }: MonitorPageProps) {
  const resolvedParams = use(params);
  const [monitor, setMonitor] = useState<Monitor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    const fetchMonitor = async () => {
      if (!token) {
        setError(new Error('Not authenticated'));
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await monitorsApi.getMonitor(resolvedParams.id, token);
        setMonitor(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch monitor:', err);
        if (
          err &&
          typeof err === 'object' &&
          'statusCode' in err &&
          err.statusCode === 404
        ) {
          notFound();
        }
        setError(
          err instanceof Error ? err : new Error('Failed to fetch monitor')
        );
      } finally {
        setLoading(false);
      }
    };

    fetchMonitor();
  }, [resolvedParams.id, token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" message="Loading monitor..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorDisplay
          title="Failed to load monitor"
          message={error.message}
          error={error}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  if (!monitor) {
    notFound();
  }

  return <MonitorDetailsComponent monitor={monitor} />;
}
