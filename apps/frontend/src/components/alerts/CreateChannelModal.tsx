import { useState } from 'react';
import { ChannelType } from '@/types/alert';

interface CreateChannelModalProps {
  onClose: () => void;
  onCreate: (data: any) => Promise<void>;
}

export function CreateChannelModal({
  onClose,
  onCreate,
}: CreateChannelModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: ChannelType.EMAIL,
    enabled: true,
    isDefault: false,
    // Email config
    emailAddresses: [] as string[],
    emailInput: '',
    // Webhook config
    webhookUrl: '',
    webhookMethod: 'POST',
    webhookHeaders: {} as Record<string, string>,
    // SMS config
    phoneNumbers: [] as string[],
    phoneInput: '',
    // Slack config
    slackWebhookUrl: '',
    slackChannel: '',
    // Quiet hours
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
    quietHoursTimezone: 'UTC',
  });

  const handleAddEmail = () => {
    if (
      formData.emailInput &&
      !formData.emailAddresses.includes(formData.emailInput)
    ) {
      setFormData({
        ...formData,
        emailAddresses: [...formData.emailAddresses, formData.emailInput],
        emailInput: '',
      });
    }
  };

  const handleRemoveEmail = (email: string) => {
    setFormData({
      ...formData,
      emailAddresses: formData.emailAddresses.filter((e) => e !== email),
    });
  };

  const handleAddPhone = () => {
    if (
      formData.phoneInput &&
      !formData.phoneNumbers.includes(formData.phoneInput)
    ) {
      setFormData({
        ...formData,
        phoneNumbers: [...formData.phoneNumbers, formData.phoneInput],
        phoneInput: '',
      });
    }
  };

  const handleRemovePhone = (phone: string) => {
    setFormData({
      ...formData,
      phoneNumbers: formData.phoneNumbers.filter((p) => p !== phone),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Build configuration based on type
      const configuration: any = {};

      if (formData.type === ChannelType.EMAIL) {
        configuration.emailAddresses = formData.emailAddresses;
      } else if (formData.type === ChannelType.WEBHOOK) {
        configuration.webhookUrl = formData.webhookUrl;
        configuration.webhookMethod = formData.webhookMethod;
        configuration.webhookHeaders = formData.webhookHeaders;
      } else if (formData.type === ChannelType.SMS) {
        configuration.phoneNumbers = formData.phoneNumbers;
      } else if (formData.type === ChannelType.SLACK) {
        configuration.slackWebhookUrl = formData.slackWebhookUrl;
        configuration.slackChannel = formData.slackChannel;
      }

      const payload = {
        name: formData.name,
        type: formData.type,
        enabled: formData.enabled,
        isDefault: formData.isDefault,
        configuration,
        quietHours: formData.quietHoursEnabled
          ? {
              enabled: true,
              startTime: formData.quietHoursStart,
              endTime: formData.quietHoursEnd,
              timezone: formData.quietHoursTimezone,
            }
          : undefined,
      };

      await onCreate(payload);
    } catch (error) {
      console.error('Failed to create notification channel:', error);
      alert('Failed to create notification channel. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Add Notification Channel
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
                Channel Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Primary Email Alerts"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Channel Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    type: e.target.value as ChannelType,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={ChannelType.EMAIL}>Email</option>
                <option value={ChannelType.WEBHOOK}>Webhook</option>
                <option value={ChannelType.SMS}>SMS</option>
                <option value={ChannelType.SLACK}>Slack</option>
              </select>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.enabled}
                  onChange={(e) =>
                    setFormData({ ...formData, enabled: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Enabled</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={(e) =>
                    setFormData({ ...formData, isDefault: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Set as default</span>
              </label>
            </div>
          </div>

          {/* Configuration based on type */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Configuration
            </h3>

            {/* Email Configuration */}
            {formData.type === ChannelType.EMAIL && (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Email Addresses
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={formData.emailInput}
                    onChange={(e) =>
                      setFormData({ ...formData, emailInput: e.target.value })
                    }
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddEmail();
                      }
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="user@example.com"
                  />
                  <button
                    type="button"
                    onClick={handleAddEmail}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
                {formData.emailAddresses.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.emailAddresses.map((email) => (
                      <span
                        key={email}
                        className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                      >
                        {email}
                        <button
                          type="button"
                          onClick={() => handleRemoveEmail(email)}
                          className="hover:text-blue-900"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Webhook Configuration */}
            {formData.type === ChannelType.WEBHOOK && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Webhook URL *
                  </label>
                  <input
                    type="url"
                    required
                    value={formData.webhookUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, webhookUrl: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://your-webhook-url.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Method
                  </label>
                  <select
                    value={formData.webhookMethod}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        webhookMethod: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                  </select>
                </div>
              </div>
            )}

            {/* SMS Configuration */}
            {formData.type === ChannelType.SMS && (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Phone Numbers
                </label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={formData.phoneInput}
                    onChange={(e) =>
                      setFormData({ ...formData, phoneInput: e.target.value })
                    }
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddPhone();
                      }
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+1234567890"
                  />
                  <button
                    type="button"
                    onClick={handleAddPhone}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
                {formData.phoneNumbers.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.phoneNumbers.map((phone) => (
                      <span
                        key={phone}
                        className="inline-flex items-center gap-2 px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm"
                      >
                        {phone}
                        <button
                          type="button"
                          onClick={() => handleRemovePhone(phone)}
                          className="hover:text-purple-900"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Slack Configuration */}
            {formData.type === ChannelType.SLACK && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Slack Webhook URL *
                  </label>
                  <input
                    type="url"
                    required
                    value={formData.slackWebhookUrl}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        slackWebhookUrl: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://hooks.slack.com/services/..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Channel (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.slackChannel}
                    onChange={(e) =>
                      setFormData({ ...formData, slackChannel: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="#alerts"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Quiet Hours */}
          <div className="border-t border-gray-200 pt-6">
            <label className="flex items-center gap-3 cursor-pointer mb-4">
              <input
                type="checkbox"
                checked={formData.quietHoursEnabled}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    quietHoursEnabled: e.target.checked,
                  })
                }
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div>
                <div className="font-medium text-gray-900">
                  Enable Quiet Hours
                </div>
                <div className="text-sm text-gray-500">
                  Suppress notifications during specific hours
                </div>
              </div>
            </label>

            {formData.quietHoursEnabled && (
              <div className="grid grid-cols-3 gap-3 ml-7">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={formData.quietHoursStart}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        quietHoursStart: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={formData.quietHoursEnd}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        quietHoursEnd: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Timezone
                  </label>
                  <input
                    type="text"
                    value={formData.quietHoursTimezone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        quietHoursTimezone: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="UTC"
                  />
                </div>
              </div>
            )}
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
              {loading ? 'Creating...' : 'Create Channel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
