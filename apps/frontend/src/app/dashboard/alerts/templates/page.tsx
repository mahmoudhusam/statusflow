'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { alertsApi } from '@/lib/api/alerts';
import { monitorsApi } from '@/lib/api/monitors';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';
import type { AlertTemplate } from '@/types/alert';
import type { Monitor } from '@/types/monitor';

export default function AlertTemplatesPage() {
  const { token } = useAuth();
  const [templates, setTemplates] = useState<AlertTemplate[]>([]);
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] =
    useState<AlertTemplate | null>(null);
  const [selectedMonitor, setSelectedMonitor] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchData = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      const [templatesData, monitorsData] = await Promise.all([
        alertsApi.getAlertTemplates(token),
        monitorsApi.getMonitors(token),
      ]);
      setTemplates(templatesData);
      setMonitors(monitorsData);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('Failed to load templates');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUseTemplate = (template: AlertTemplate) => {
    setSelectedTemplate(template);
    setShowCreateModal(true);
  };

  const handleCreateFromTemplate = async () => {
    if (!selectedTemplate || !token) return;

    setIsCreating(true);
    try {
      const ruleData = {
        name: selectedTemplate.name,
        description: selectedTemplate.description,
        type: selectedTemplate.type,
        severity: selectedTemplate.severity,
        enabled: true,
        monitorId: selectedMonitor || undefined,
        conditions: selectedTemplate.conditions as Record<string, unknown>,
        channels: {
          email: true,
          webhook: {
            enabled: false,
          },
        } as Record<string, unknown>,
      };

      await alertsApi.createAlertRule(ruleData, token);
      setShowCreateModal(false);
      setSelectedTemplate(null);
      setSelectedMonitor('');
      alert('Alert rule created successfully!');
    } catch (err) {
      console.error('Failed to create alert rule:', err);
      alert('Failed to create alert rule. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const getTemplateIcon = (type: string) => {
    switch (type) {
      case 'downtime':
        return '⚠️';
      case 'latency':
        return '⏱️';
      case 'status_code':
        return '📄';
      case 'ssl_expiry':
        return '🔒';
      default:
        return '🔔';
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

  const formatConditions = (template: AlertTemplate) => {
    const conditions: string[] = [];

    if (template.conditions.consecutiveFailures) {
      conditions.push(
        `${template.conditions.consecutiveFailures} consecutive failures`
      );
    }
    if (template.conditions.latencyThreshold) {
      conditions.push(`Latency > ${template.conditions.latencyThreshold}ms`);
    }
    if (template.conditions.statusCodes) {
      conditions.push(
        `Status codes: ${template.conditions.statusCodes.join(', ')}`
      );
    }
    if (template.conditions.sslDaysBeforeExpiry) {
      conditions.push(
        `${template.conditions.sslDaysBeforeExpiry} days before expiry`
      );
    }

    return conditions;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="large" message="Loading templates..." />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorDisplay
        title="Failed to load templates"
        message={error}
        onRetry={fetchData}
      />
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <p className="text-gray-600">
          Start with pre-configured alert templates and customize them for your
          monitors
        </p>
      </div>

      {/* Templates Grid */}
      {templates.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No templates available
          </h3>
          <p className="text-gray-600">
            Alert templates will be available soon
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="text-3xl">
                    {getTemplateIcon(template.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {template.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {template.description}
                    </p>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ${getSeverityColor(template.severity)}`}
                >
                  {template.severity.toUpperCase()}
                </span>
              </div>

              {/* Type Badge */}
              <div className="mb-4">
                <span className="inline-flex items-center px-3 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium">
                  {template.type.replace('_', ' ').toUpperCase()}
                </span>
              </div>

              {/* Conditions */}
              <div className="mb-4">
                <div className="text-xs font-medium text-gray-500 mb-2">
                  Conditions
                </div>
                <div className="space-y-1">
                  {formatConditions(template).map((condition, index) => (
                    <div
                      key={index}
                      className="text-sm text-gray-700 flex items-center gap-2"
                    >
                      <svg
                        className="w-4 h-4 text-green-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {condition}
                    </div>
                  ))}
                </div>
              </div>

              {/* Use Template Button */}
              <button
                onClick={() => handleUseTemplate(template)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Use This Template
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Create from Template Modal */}
      {showCreateModal && selectedTemplate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Create Alert Rule
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setSelectedTemplate(null);
                  setSelectedMonitor('');
                }}
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

            <div className="p-6">
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-2xl">
                    {getTemplateIcon(selectedTemplate.type)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {selectedTemplate.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {selectedTemplate.description}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Apply to Monitor (Optional)
                </label>
                <select
                  value={selectedMonitor}
                  onChange={(e) => setSelectedMonitor(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                >
                  <option value="">All Monitors (Global Rule)</option>
                  {monitors.map((monitor) => (
                    <option key={monitor.id} value={monitor.id}>
                      {monitor.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Leave unselected to apply this rule to all monitors
                </p>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setSelectedTemplate(null);
                    setSelectedMonitor('');
                  }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  disabled={isCreating}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateFromTemplate}
                  disabled={isCreating}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {isCreating ? 'Creating...' : 'Create Alert Rule'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
