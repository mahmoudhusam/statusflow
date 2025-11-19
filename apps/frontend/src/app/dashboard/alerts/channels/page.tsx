'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { alertsApi } from '@/lib/api/alerts';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';
import { NotificationChannelCard } from '@/components/alerts/NotificationChannelCard';
import { CreateChannelModal } from '@/components/alerts/CreateChannelModal';
import type {
  NotificationChannel,
  NotificationChannelConfig,
  QuietHours,
} from '@/types/alert';

interface CreateChannelData {
  name: string;
  type: string;
  enabled?: boolean;
  isDefault?: boolean;
  configuration: NotificationChannelConfig;
  quietHours?: QuietHours;
}

interface UpdateChannelData {
  name?: string;
  type?: string;
  enabled?: boolean;
  isDefault?: boolean;
  configuration?: NotificationChannelConfig;
  quietHours?: QuietHours;
}

export default function NotificationChannelsPage() {
  const { token } = useAuth();
  const [channels, setChannels] = useState<NotificationChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [testingChannel, setTestingChannel] = useState<string | null>(null);

  const fetchChannels = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      const data = await alertsApi.getNotificationChannels(token);
      setChannels(data);
    } catch (err) {
      console.error('Failed to fetch notification channels:', err);
      setError('Failed to load notification channels');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  const handleCreateChannel = async (channelData: CreateChannelData) => {
    try {
      const newChannel = await alertsApi.createNotificationChannel(
        channelData,
        token!
      );
      setChannels([newChannel, ...channels]);
      setShowCreateModal(false);
    } catch (err) {
      console.error('Failed to create channel:', err);
      throw err;
    }
  };

  const handleUpdateChannel = async (
    id: string,
    updates: UpdateChannelData
  ) => {
    try {
      const updatedChannel = await alertsApi.updateNotificationChannel(
        id,
        updates,
        token!
      );
      setChannels(channels.map((ch) => (ch.id === id ? updatedChannel : ch)));
    } catch (err) {
      console.error('Failed to update channel:', err);
      throw err;
    }
  };

  const handleDeleteChannel = async (id: string) => {
    if (!confirm('Are you sure you want to delete this notification channel?'))
      return;

    try {
      await alertsApi.deleteNotificationChannel(id, token!);
      setChannels(channels.filter((ch) => ch.id !== id));
    } catch (err) {
      console.error('Failed to delete channel:', err);
    }
  };

  const handleTestChannel = async (id: string) => {
    setTestingChannel(id);
    try {
      await alertsApi.testNotificationChannel(id, token!);
      alert('Test notification sent successfully!');
    } catch (err) {
      console.error('Failed to test channel:', err);
      alert('Failed to send test notification');
    } finally {
      setTestingChannel(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner
          size="large"
          message="Loading notification channels..."
        />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorDisplay
        title="Failed to load notification channels"
        message={error}
        onRetry={fetchChannels}
      />
    );
  }

  return (
    <div>
      {/* Actions Bar */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Notification Channels
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Configure how you receive alerts when issues are detected
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add Channel
        </button>
      </div>

      {/* Channels List */}
      {channels.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No notification channels
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Set up notification channels to receive alerts via email, webhooks,
            or other methods.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Add your first channel
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {channels.map((channel) => (
            <NotificationChannelCard
              key={channel.id}
              channel={channel}
              onUpdate={handleUpdateChannel}
              onDelete={handleDeleteChannel}
              onTest={handleTestChannel}
              isTesting={testingChannel === channel.id}
            />
          ))}
        </div>
      )}

      {/* Create Channel Modal */}
      {showCreateModal && (
        <CreateChannelModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateChannel}
        />
      )}
    </div>
  );
}
