'use client';

import { useMemo } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

interface CheckStatusChartProps {
  successfulChecks: number;
  failedChecks: number;
}

export function CheckStatusChart({ successfulChecks, failedChecks }: CheckStatusChartProps) {
  const totalChecks = successfulChecks + failedChecks;

  const chartData = useMemo(() => {
    return {
      labels: ['Successful', 'Failed'],
      datasets: [
        {
          data: [successfulChecks, failedChecks],
          backgroundColor: ['rgba(34, 197, 94, 0.8)', 'rgba(239, 68, 68, 0.8)'],
          borderColor: ['rgb(34, 197, 94)', 'rgb(239, 68, 68)'],
          borderWidth: 1,
        },
      ],
    };
  }, [successfulChecks, failedChecks]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (context: { label: string; parsed: number }) => {
            const value = context.parsed;
            const percentage = totalChecks > 0 ? ((value / totalChecks) * 100).toFixed(1) : '0';
            return `${context.label}: ${value.toLocaleString()} (${percentage}%)`;
          },
        },
      },
    },
    cutout: '60%',
  };

  if (totalChecks === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Check Status (24h)
        </h2>
        <div className="h-64 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-gray-600 font-medium">No data available</p>
            <p className="text-sm text-gray-500 mt-1">
              Check status data will appear once your monitors start running
            </p>
          </div>
        </div>
      </div>
    );
  }

  const successRate = ((successfulChecks / totalChecks) * 100).toFixed(1);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Check Status (24h)
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Success Rate:</span>
          <span className={`text-sm font-medium ${
            Number(successRate) >= 99 ? 'text-green-600' : Number(successRate) >= 95 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {successRate}%
          </span>
        </div>
      </div>
      <div className="h-64 relative">
        <Doughnut data={chartData} options={options} />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{totalChecks.toLocaleString()}</p>
            <p className="text-xs text-gray-500">Total Checks</p>
          </div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <p className="text-lg font-semibold text-green-600">{successfulChecks.toLocaleString()}</p>
          <p className="text-xs text-green-700">Successful</p>
        </div>
        <div className="text-center p-3 bg-red-50 rounded-lg">
          <p className="text-lg font-semibold text-red-600">{failedChecks.toLocaleString()}</p>
          <p className="text-xs text-red-700">Failed</p>
        </div>
      </div>
    </div>
  );
}
