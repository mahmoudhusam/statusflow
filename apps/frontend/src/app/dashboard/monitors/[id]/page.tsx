import { notFound } from 'next/navigation';
import monitors from '@/mocks/monitors.json';
import type { Monitor } from '@/types/monitor';
import { MonitorDetailsComponent } from '@/components/monitors/MonitorDetailsComponent';

interface MonitorPageProps {
  params: Promise<{
    id: string;
  }>;
}

async function getMonitorById(id: string): Promise<Monitor | null> {
  try {
    // In the future, this will be replaced with an API call:
    const monitor = monitors.find((m) => m.id === id);
    return monitor ? (monitor as Monitor) : null;
  } catch (error) {
    console.error('Failed to fetch monitor:', error);
    throw error;
  }
}

export default async function MonitorPage({ params }: MonitorPageProps) {
  const { id } = await params;

  const monitor = await getMonitorById(id);

  if (!monitor) {
    notFound();
  }

  return <MonitorDetailsComponent monitor={monitor} />;
}
