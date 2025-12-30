'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';
import type { DashboardIncident, IncidentStatus } from '@/types/dashboard';

interface IncidentsListProps {
  incidents: DashboardIncident[];
}

export function IncidentsList({ incidents }: IncidentsListProps) {
  const [sortBy, setSortBy] = useState<'latest' | 'oldest'>('latest');

  // Sort incidents locally instead of refetching
  const sortedIncidents = useMemo(() => {
    return [...incidents].sort((a, b) => {
      const dateA = new Date(a.startedAt).getTime();
      const dateB = new Date(b.startedAt).getTime();
      return sortBy === 'latest' ? dateB - dateA : dateA - dateB;
    });
  }, [incidents, sortBy]);

  const handleSort = (newSort: 'latest' | 'oldest') => {
    setSortBy(newSort);
  };

  const getStatusBadge = (status: IncidentStatus) => {
    const styles = {
      critical: 'bg-red-100 text-red-700 border-red-200',
      warning: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      resolved: 'bg-green-100 text-green-700 border-green-200',
    };

    const labels = {
      critical: 'Critical',
      warning: 'Warning',
      resolved: 'Resolved',
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}
      >
        {labels[status]}
      </span>
    );
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m`;
    return `${seconds}s`;
  };

  if (sortedIncidents.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Incidents
        </h2>
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg
              className="w-6 h-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <p className="text-gray-600 font-medium">No incidents</p>
          <p className="text-sm text-gray-500 mt-1">
            All systems are running smoothly
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Recent Incidents
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => handleSort(e.target.value as 'latest' | 'oldest')}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white text-gray-900 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          >
            <option value="latest">Latest</option>
            <option value="oldest">Oldest</option>
          </select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <th className="px-6 py-3">Monitor</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Duration</th>
              <th className="px-6 py-3">Time</th>
              <th className="px-6 py-3">Message</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedIncidents.map((incident) => (
              <tr
                key={incident.id}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  {incident.monitorId ? (
                    <Link
                      href={`/dashboard/monitors/${incident.monitorId}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      {incident.monitorName || 'Unknown Monitor'}
                    </Link>
                  ) : (
                    <span className="text-sm text-gray-500">
                      {incident.monitorName || 'Unknown Monitor'}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(incident.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {formatDuration(incident.duration)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDistanceToNow(new Date(incident.startedAt), {
                    addSuffix: true,
                  })}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                  {incident.message}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
        <Link
          href="/dashboard/alerts/history"
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          View all incidents
        </Link>
      </div>
    </div>
  );
}
