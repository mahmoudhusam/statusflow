import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { monitorsApi } from '@/lib/api/monitors';
import type { Monitor } from '@/types/monitor';
import { AlertType, AlertSeverity } from '@/types/alert';

interface CreateAlertRuleData {
  name: string;
  description?: string;
  type: string;
  severity: string;
  enabled?: boolean;
  monitorId?: string;
  conditions: Record<string, unknown>;
  channels: Record<string, unknown>;
}

interface CreateAlertRuleModalProps {
  onClose: () => void;
  onCreate: (data: CreateAlertRuleData) => Promise<void>;
}

export function CreateAlertRuleModal({
  onClose,
  onCreate,
}: CreateAlertRuleModalProps) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: AlertType.DOWNTIME,
    severity: AlertSeverity.HIGH,
    enabled: true,
    monitorId: '',
    // Conditions
    consecutiveFailures: 3,
    latencyThreshold: 3000,
    statusCodes: [] as number[],
    sslDaysBeforeExpiry: 7,
    // Channels
    emailEnabled: true,
    webhookEnabled: false,
    webhookUrl: '',
    webhookHeaders: {} as Record<string, string>,
  });

  useEffect(() => {
    const fetchMonitors = async () => {
      if (!token) return;
      try {
        const data = await monitorsApi.getMonitors(token);
        setMonitors(data);
      } catch (error) {
        console.error('Failed to fetch monitors:', error);
      }
    };
    fetchMonitors();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Build conditions based on type
      const conditions: Record<string, unknown> = {};
      if (formData.type === AlertType.DOWNTIME) {
        conditions.consecutiveFailures = formData.consecutiveFailures;
      } else if (formData.type === AlertType.LATENCY) {
        conditions.latencyThreshold = formData.latencyThreshold;
      } else if (formData.type === AlertType.STATUS_CODE) {
        conditions.statusCodes = formData.statusCodes;
      } else if (formData.type === AlertType.SSL_EXPIRY) {
        conditions.sslDaysBeforeExpiry = formData.sslDaysBeforeExpiry;
      }

      // Build channels
      const channels: Record<string, unknown> = {
        email: formData.emailEnabled,
      };

      if (formData.webhookEnabled) {
        channels.webhook = {
          enabled: true,
          url: formData.webhookUrl,
          headers: formData.webhookHeaders,
        };
      }

      const payload: CreateAlertRuleData = {
        name: formData.name,
        description: formData.description || undefined,
        type: formData.type,
        severity: formData.severity,
        enabled: formData.enabled,
        monitorId: formData.monitorId || undefined,
        conditions,
        channels,
      };

      await onCreate(payload);
    } catch (error) {
      console.error('Failed to create alert rule:', error);
      alert('Failed to create alert rule. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Create Alert Rule
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rule Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                placeholder="High Latency Alert"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                rows={2}
                placeholder="Alert when response time exceeds threshold"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alert Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      type: e.target.value as AlertType,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                >
                  <option value={AlertType.DOWNTIME}>Downtime</option>
                  <option value={AlertType.LATENCY}>High Latency</option>
                  <option value={AlertType.STATUS_CODE}>Status Code</option>
                  <option value={AlertType.SSL_EXPIRY}>SSL Expiry</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Severity *
                </label>
                <select
                  value={formData.severity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      severity: e.target.value as AlertSeverity,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                >
                  <option value={AlertSeverity.LOW}>Low</option>
                  <option value={AlertSeverity.MEDIUM}>Medium</option>
                  <option value={AlertSeverity.HIGH}>High</option>
                  <option value={AlertSeverity.CRITICAL}>Critical</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monitor (Optional)
              </label>
              <select
                value={formData.monitorId}
                onChange={(e) =>
                  setFormData({ ...formData, monitorId: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                <option value="">All Monitors (Global Rule)</option>
                {monitors.map((monitor) => (
                  <option key={monitor.id} value={monitor.id}>
                    {monitor.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Conditions */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Conditions
            </h3>

            {formData.type === AlertType.DOWNTIME && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Consecutive Failures
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.consecutiveFailures}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      consecutiveFailures: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Trigger alert after this many consecutive failed checks
                </p>
              </div>
            )}

            {formData.type === AlertType.LATENCY && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Latency Threshold (ms)
                </label>
                <input
                  type="number"
                  min="100"
                  max="30000"
                  step="100"
                  value={formData.latencyThreshold}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      latencyThreshold: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Alert when response time exceeds this value
                </p>
              </div>
            )}

            {formData.type === AlertType.STATUS_CODE && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status Codes (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="500, 502, 503"
                  onChange={(e) => {
                    const codes = e.target.value
                      .split(',')
                      .map((code) => parseInt(code.trim()))
                      .filter((code) => !isNaN(code));
                    setFormData({ ...formData, statusCodes: codes });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Alert when these status codes are returned
                </p>
              </div>
            )}

            {formData.type === AlertType.SSL_EXPIRY && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Days Before Expiry
                </label>
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={formData.sslDaysBeforeExpiry}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      sslDaysBeforeExpiry: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Alert this many days before SSL certificate expires
                </p>
              </div>
            )}
          </div>

          {/* Notification Channels */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Notification Channels
            </h3>

            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.emailEnabled}
                  onChange={(e) =>
                    setFormData({ ...formData, emailEnabled: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div>
                  <div className="font-medium text-gray-900">Email</div>
                  <div className="text-sm text-gray-500">
                    Send notifications via email
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.webhookEnabled}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      webhookEnabled: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div>
                  <div className="font-medium text-gray-900">Webhook</div>
                  <div className="text-sm text-gray-500">
                    Send notifications to a webhook URL
                  </div>
                </div>
              </label>

              {formData.webhookEnabled && (
                <div className="ml-7 space-y-3">
                  <input
                    type="url"
                    placeholder="https://your-webhook-url.com"
                    value={formData.webhookUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, webhookUrl: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? 'Creating...' : 'Create Alert Rule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
