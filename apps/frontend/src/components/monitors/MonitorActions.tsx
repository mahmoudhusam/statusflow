'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Pause, Play, MoreVertical } from 'lucide-react';
import { usePauseMonitor, useResumeMonitor, useDeleteMonitor } from '@/hooks/useMonitors';
import type { Monitor } from '@/types/monitor';

interface MonitorActionsProps {
  monitor: Monitor;
  onDeleted?: () => void;
}

export function MonitorActions({ monitor, onDeleted }: MonitorActionsProps) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);

  const pauseMutation = usePauseMonitor();
  const resumeMutation = useResumeMonitor();
  const deleteMutation = useDeleteMonitor();

  const handleDelete = async () => {
    if (
      !confirm(
        `Are you sure you want to delete "${monitor.name}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    deleteMutation.mutate(monitor.id, {
      onSuccess: () => {
        setShowMenu(false);
        if (onDeleted) {
          onDeleted();
        } else {
          router.push('/dashboard/monitors');
        }
      },
      onError: (error) => {
        console.error('Failed to delete monitor:', error);
        alert('Failed to delete monitor. Please try again.');
      },
    });
  };

  const handlePause = async () => {
    pauseMutation.mutate(monitor.id, {
      onSuccess: () => {
        setShowMenu(false);
      },
      onError: (error) => {
        console.error('Failed to pause monitor:', error);
        alert('Failed to pause monitor. Please try again.');
      },
    });
  };

  const handleResume = async () => {
    resumeMutation.mutate(monitor.id, {
      onSuccess: () => {
        setShowMenu(false);
      },
      onError: (error) => {
        console.error('Failed to resume monitor:', error);
        alert('Failed to resume monitor. Please try again.');
      },
    });
  };

  const isActive = !monitor.paused;
  const isPaused = monitor.paused;

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Monitor actions"
      >
        <MoreVertical className="w-5 h-5 text-gray-600" />
      </button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            <div className="py-1">
              {isActive && (
                <button
                  onClick={handlePause}
                  disabled={pauseMutation.isPending}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                >
                  <Pause className="w-4 h-4" />
                  {pauseMutation.isPending ? 'Pausing...' : 'Pause Monitor'}
                </button>
              )}

              {isPaused && (
                <button
                  onClick={handleResume}
                  disabled={resumeMutation.isPending}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  {resumeMutation.isPending ? 'Resuming...' : 'Resume Monitor'}
                </button>
              )}

              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                {deleteMutation.isPending ? 'Deleting...' : 'Delete Monitor'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
