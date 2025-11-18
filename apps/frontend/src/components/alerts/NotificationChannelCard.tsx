import { useState } from 'react';
import type { NotificationChannel } from '@/types/alert';

interface NotificationChannelCardProps {
  channel: NotificationChannel;
  onUpdate: (
    id: string,
    updates: Partial<NotificationChannel>
  ) => Promise<void>;
  onDelete: (id: string) => void;
  onTest: (id: string) => void;
  isTesting: boolean;
}

export function NotificationChannelCard({
  channel,
  onUpdate,
  onDelete,
  onTest,
  isTesting,
}: NotificationChannelCardProps) {
  const [isToggling, setIsToggling] = useState(false);

  const handleToggleEnabled = async () => {
    setIsToggling(true);
    try {
      await onUpdate(channel.id, { enabled: !channel.enabled });
    } catch (error) {
      console.error('Failed to toggle channel:', error);
    } finally {
      setIsToggling(false);
    }
  };

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'email':
        return '📧';
      case 'webhook':
        return '🔗';
      case 'sms':
        return '📱';
      case 'slack':
        return '💬';
      default:
        return '📢';
    }
  };

  const getChannelDetails = () => {
    switch (channel.type) {
      case 'email':
        return (
          channel.configuration.emailAddresses?.join(', ') ||
          'No emails configured'
        );
      case 'webhook':
        return channel.configuration.webhookUrl || 'No webhook URL';
      case 'sms':
        return (
          channel.configuration.phoneNumbers?.join(', ') || 'No phone numbers'
        );
      case 'slack':
        return channel.configuration.slackChannel || 'No slack channel';
      default:
        return 'Not configured';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3 flex-1">
          <div className={`text-3xl ${channel.enabled ? '' : 'opacity-40'}`}>
            {getChannelIcon(channel.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold text-gray-900">
                {channel.name}
              </h3>
              {channel.isDefault && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Default
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 capitalize">{channel.type}</p>
          </div>
        </div>
      </div>

      {/* Configuration Details */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-xs font-medium text-gray-500 mb-1">
          Configuration
        </div>
        <div className="text-sm text-gray-900 truncate">
          {getChannelDetails()}
        </div>
      </div>

      {/* Last Test Status */}
      {channel.lastTestAt && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-xs font-medium text-gray-500 mb-1">
            Last Test
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                channel.lastTestSuccess
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {channel.lastTestSuccess ? '✓ Success' : '✗ Failed'}
            </span>
            <span className="text-xs text-gray-500">
              {new Date(channel.lastTestAt).toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {/* Quiet Hours */}
      {channel.quietHours?.enabled && (
        <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-100">
          <div className="text-xs font-medium text-purple-700 mb-1">
            🌙 Quiet Hours Active
          </div>
          <div className="text-xs text-purple-600">
            {channel.quietHours.startTime} - {channel.quietHours.endTime} (
            {channel.quietHours.timezone})
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleEnabled}
            disabled={isToggling}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              channel.enabled ? 'bg-blue-600' : 'bg-gray-200'
            } ${isToggling ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                channel.enabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
          <span className="text-sm text-gray-600">
            {channel.enabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onTest(channel.id)}
            disabled={isTesting || !channel.enabled}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isTesting ? 'Testing...' : 'Test'}
          </button>
          <button
            onClick={() => onDelete(channel.id)}
            className="text-sm text-red-600 hover:text-red-700 font-medium"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
