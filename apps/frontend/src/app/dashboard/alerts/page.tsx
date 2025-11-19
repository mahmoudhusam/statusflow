'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { alertsApi } from '@/lib/api/alerts';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';
import { AlertRuleCard } from '@/components/alerts/AlertRuleCard';
import { CreateAlertRuleModal } from '@/components/alerts/CreateAlertRuleModal';
import type { AlertRule } from '@/types/alert';

interface CreateRuleData {
  name: string;
  description?: string;
  type: string;
  severity: string;
  enabled?: boolean;
  monitorId?: string;
  conditions: Record<string, unknown>;
  channels: Record<string, unknown>;
}

type UpdateRuleData = Partial<AlertRule>;

export default function AlertRulesPage() {
  const { token } = useAuth();
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchAlertRules = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      const data = await alertsApi.getAlertRules(token);
      setRules(data);
    } catch (err) {
      console.error('Failed to fetch alert rules:', err);
      setError('Failed to load alert rules');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAlertRules();
  }, [fetchAlertRules]);

  const handleCreateRule = async (ruleData: CreateRuleData) => {
    try {
      const newRule = await alertsApi.createAlertRule(ruleData, token!);
      setRules([newRule, ...rules]);
      setShowCreateModal(false);
    } catch (err) {
      console.error('Failed to create alert rule:', err);
      throw err;
    }
  };

  const handleUpdateRule = async (id: string, updates: UpdateRuleData) => {
    try {
      const updatedRule = await alertsApi.updateAlertRule(id, updates, token!);
      setRules(rules.map((rule) => (rule.id === id ? updatedRule : rule)));
    } catch (err) {
      console.error('Failed to update alert rule:', err);
      throw err;
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm('Are you sure you want to delete this alert rule?')) return;

    try {
      await alertsApi.deleteAlertRule(id, token!);
      setRules(rules.filter((rule) => rule.id !== id));
    } catch (err) {
      console.error('Failed to delete alert rule:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="large" message="Loading alert rules..." />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorDisplay
        title="Failed to load alert rules"
        message={error}
        onRetry={fetchAlertRules}
      />
    );
  }

  return (
    <div>
      {/* Actions Bar */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            {rules.length} alert {rules.length === 1 ? 'rule' : 'rules'}
          </span>
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
          Create Alert Rule
        </button>
      </div>

      {/* Alert Rules Grid */}
      {rules.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No alert rules yet
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Create alert rules to get notified when your monitors detect issues.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Create your first alert rule
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {rules.map((rule) => (
            <AlertRuleCard
              key={rule.id}
              rule={rule}
              onUpdate={handleUpdateRule}
              onDelete={handleDeleteRule}
            />
          ))}
        </div>
      )}

      {/* Create Alert Rule Modal */}
      {showCreateModal && (
        <CreateAlertRuleModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateRule}
        />
      )}
    </div>
  );
}
