'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
//import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface MonitorFormData {
  name: string;
  url: string;
  interval: number;
  httpMethod: string;
  timeout: number;
  maxLatencyMs: number;
  maxConsecutiveFailures: number;
  headers: Record<string, string>;
  body: string;
}

export default function CreateMonitorPage() {
  const router = useRouter();
  // const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState<MonitorFormData>({
    name: '',
    url: '',
    interval: 60,
    httpMethod: 'GET',
    timeout: 10000,
    maxLatencyMs: 2000,
    maxConsecutiveFailures: 3,
    headers: {},
    body: '',
  });

  const [customHeaders, setCustomHeaders] = useState<
    Array<{ key: string; value: string }>
  >([]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === 'interval' ||
        name === 'timeout' ||
        name === 'maxLatencyMs' ||
        name === 'maxConsecutiveFailures'
          ? Number(value)
          : value,
    }));
  };

  const addHeader = () => {
    setCustomHeaders([...customHeaders, { key: '', value: '' }]);
  };

  const removeHeader = (index: number) => {
    setCustomHeaders(customHeaders.filter((_, i) => i !== index));
  };

  const updateHeader = (
    index: number,
    field: 'key' | 'value',
    value: string
  ) => {
    const updated = [...customHeaders];
    updated[index][field] = value;
    setCustomHeaders(updated);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const headers = customHeaders.reduce(
        (acc, { key, value }) => {
          if (key && value) {
            acc[key] = value;
          }
          return acc;
        },
        {} as Record<string, string>
      );

      const payload = {
        ...formData,
        headers: Object.keys(headers).length > 0 ? headers : undefined,
        body: formData.body.trim() || undefined,
      };

      await new Promise((resolve) => setTimeout(resolve, 1000));

      console.log('Monitor created:', payload);
      router.push('/dashboard/monitors');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create monitor');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href="/dashboard/monitors"
          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          ← Back to Monitors
        </Link>
      </div>

      <div className="max-w-3xl">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Create New Monitor
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Set up monitoring for your service or API endpoint
        </p>

        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Basic Information
            </h2>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Monitor Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Production API"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label
                  htmlFor="url"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  URL *
                </label>
                <input
                  type="url"
                  id="url"
                  name="url"
                  required
                  value={formData.url}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  placeholder="https://api.example.com/health"
                  disabled={isLoading}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="httpMethod"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    HTTP Method
                  </label>
                  <select
                    id="httpMethod"
                    name="httpMethod"
                    value={formData.httpMethod}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isLoading}
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="PATCH">PATCH</option>
                    <option value="DELETE">DELETE</option>
                    <option value="HEAD">HEAD</option>
                    <option value="OPTIONS">OPTIONS</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="interval"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Check Interval (seconds) *
                  </label>
                  <input
                    type="number"
                    id="interval"
                    name="interval"
                    required
                    min="10"
                    max="3600"
                    value={formData.interval}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Alert Configuration
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="timeout"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Timeout (ms)
                </label>
                <input
                  type="number"
                  id="timeout"
                  name="timeout"
                  min="1000"
                  max="30000"
                  value={formData.timeout}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label
                  htmlFor="maxLatencyMs"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Max Latency (ms)
                </label>
                <input
                  type="number"
                  id="maxLatencyMs"
                  name="maxLatencyMs"
                  min="100"
                  max="10000"
                  value={formData.maxLatencyMs}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label
                  htmlFor="maxConsecutiveFailures"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Max Failures
                </label>
                <input
                  type="number"
                  id="maxConsecutiveFailures"
                  name="maxConsecutiveFailures"
                  min="1"
                  max="10"
                  value={formData.maxConsecutiveFailures}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Advanced Options
            </h2>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Custom Headers
                  </label>
                  <button
                    type="button"
                    onClick={addHeader}
                    className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    disabled={isLoading}
                  >
                    + Add Header
                  </button>
                </div>

                {customHeaders.length > 0 && (
                  <div className="space-y-2">
                    {customHeaders.map((header, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Header name"
                          value={header.key}
                          onChange={(e) =>
                            updateHeader(index, 'key', e.target.value)
                          }
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                          disabled={isLoading}
                        />
                        <input
                          type="text"
                          placeholder="Header value"
                          value={header.value}
                          onChange={(e) =>
                            updateHeader(index, 'value', e.target.value)
                          }
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          onClick={() => removeHeader(index)}
                          className="px-3 py-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          disabled={isLoading}
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
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {customHeaders.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No custom headers added
                  </p>
                )}
              </div>

              {(formData.httpMethod === 'POST' ||
                formData.httpMethod === 'PUT' ||
                formData.httpMethod === 'PATCH') && (
                <div>
                  <label
                    htmlFor="body"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Request Body
                  </label>
                  <textarea
                    id="body"
                    name="body"
                    rows={6}
                    value={formData.body}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    placeholder='{"key": "value"}'
                    disabled={isLoading}
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    JSON or plain text request body
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Link
              href="/dashboard/monitors"
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <LoadingSpinner size="small" message="" />
                  Creating...
                </span>
              ) : (
                'Create Monitor'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
