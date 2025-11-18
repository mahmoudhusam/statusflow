import { useState } from 'react';
import type { AlertRule } from '@/types/alert';

interface AlertRuleCardProps {
  rule: AlertRule;
  onUpdate: (id: string, updates: Partial<AlertRule>) => Promise<void>;
  onDelete: (id: string) => void;
}

export function AlertRuleCard({
  rule,
  onUpdate,
  onDelete,
}: AlertRuleCardProps) {
  const [isToggling, setIsToggling] = useState(false);

  const handleToggleEnabled = async () => {
    setIsToggling(true);
    try {
      await onUpdate(rule.id, { enabled: !rule.enabled });
    } catch (error) {
      console.error('Failed to toggle alert rule:', error);
    } finally {
      setIsToggling(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 ring-red-600/20';
      case 'high':
        return 'bg-orange-100 text-orange-800 ring-orange-600/20';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 ring-yellow-600/20';
      case 'low':
        return 'bg-blue-100 text-blue-800 ring-blue-600/20';
      default:
        return 'bg-gray-100 text-gray-800 ring-gray-600/20';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'downtime':
        return (
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
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        );
      case 'latency':
        return (
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
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case 'status_code':
        return (
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
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        );
      case 'ssl_expiry':
        return (
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
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3 flex-1">
          <div
            className={`p-2 rounded-lg ${rule.enabled ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-400'}`}
          >
            {getTypeIcon(rule.type)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {rule.name}
            </h3>
            {rule.description && (
              <p className="text-sm text-gray-600">{rule.description}</p>
            )}
          </div>
        </div>
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ${getSeverityColor(rule.severity)}`}
        >
          {rule.severity.toUpperCase()}
        </span>
      </div>

      {/* Monitor Info */}
      {rule.monitor && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-xs font-medium text-gray-500 mb-1">Monitor</div>
          <div className="text-sm text-gray-900">{rule.monitor.name}</div>
          <div className="text-xs text-gray-500 font-mono">
            {rule.monitor.url}
          </div>
        </div>
      )}

      {/* Conditions */}
      <div className="mb-4">
        <div className="text-xs font-medium text-gray-500 mb-2">Conditions</div>
        <div className="flex flex-wrap gap-2">
          {rule.type === 'downtime' && rule.conditions.consecutiveFailures && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-red-50 text-red-700 text-xs font-medium">
              {rule.conditions.consecutiveFailures} consecutive failures
            </span>
          )}
          {rule.type === 'latency' && rule.conditions.latencyThreshold && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-orange-50 text-orange-700 text-xs font-medium">
              Latency &gt; {rule.conditions.latencyThreshold}ms
            </span>
          )}
          {rule.type === 'status_code' && rule.conditions.statusCodes && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-yellow-50 text-yellow-700 text-xs font-medium">
              Status codes: {rule.conditions.statusCodes.join(', ')}
            </span>
          )}
          {rule.type === 'ssl_expiry' &&
            rule.conditions.sslDaysBeforeExpiry && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 text-xs font-medium">
                {rule.conditions.sslDaysBeforeExpiry} days before expiry
              </span>
            )}
        </div>
      </div>

      {/* Notification Channels */}
      <div className="mb-4">
        <div className="text-xs font-medium text-gray-500 mb-2">
          Notifications
        </div>
        <div className="flex flex-wrap gap-2">
          {rule.channels.email && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs">
              📧 Email
            </span>
          )}
          {rule.channels.webhook?.enabled && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-green-50 text-green-700 text-xs">
              🔗 Webhook
            </span>
          )}
          {rule.channels.sms?.enabled && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 text-xs">
              📱 SMS
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleEnabled}
            disabled={isToggling}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              rule.enabled ? 'bg-blue-600' : 'bg-gray-200'
            } ${isToggling ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                rule.enabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
          <span className="text-sm text-gray-600">
            {rule.enabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onDelete(rule.id)}
            className="text-sm text-red-600 hover:text-red-700 font-medium"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
