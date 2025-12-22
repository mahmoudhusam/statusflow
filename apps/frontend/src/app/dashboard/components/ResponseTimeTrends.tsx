'use client';

import { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import format from 'date-fns/format';
import type { PerformanceTrend } from '@/types/dashboard';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ResponseTimeTrendsProps {
  trends: PerformanceTrend[];
}

export function ResponseTimeTrends({ trends }: ResponseTimeTrendsProps) {
  const chartData = useMemo(() => {
    const labels = trends.map((t) => format(new Date(t.timestamp), 'HH:mm'));
    const data = trends.map((t) => t.avgResponseTime);

    return {
      labels,
      datasets: [
        {
          label: 'Response Time (ms)',
          data,
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: '#6366f1',
          pointHoverBorderColor: '#fff',
          pointHoverBorderWidth: 2,
        },
      ],
    };
  }, [trends]);

  // Calculate max response time for y-axis scaling
  const maxResponseTime = useMemo(() => {
    const times = trends.map((t) => t.avgResponseTime).filter((t): t is number => t !== null);
    if (times.length === 0) return 1000;
    const max = Math.max(...times);
    // Round up to nearest 100 for cleaner axis
    return Math.ceil(max / 100) * 100 + 100;
  }, [trends]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: (context: { parsed: { y: number | null } }) => {
            const value = context.parsed.y;
            if (value === null) return 'No data';
            return `Response Time: ${value}ms`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#9ca3af',
          font: {
            size: 11,
          },
          maxTicksLimit: 8,
        },
      },
      y: {
        min: 0,
        max: maxResponseTime,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          color: '#9ca3af',
          font: {
            size: 11,
          },
          callback: (value: number | string) => `${value}ms`,
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
  };

  if (trends.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Response Time Trends (24h)
        </h2>
        <div className="h-64 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <p className="text-gray-600 font-medium">No data available</p>
            <p className="text-sm text-gray-500 mt-1">
              Response time data will appear once your monitors start running
            </p>
          </div>
        </div>
      </div>
    );
  }

  const validResponseTimes = trends.filter(t => t.avgResponseTime !== null);
  const avgResponseTime = validResponseTimes.length > 0
    ? validResponseTimes.reduce((sum, t) => sum + (t.avgResponseTime || 0), 0) / validResponseTimes.length
    : 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Response Time Trends (24h)
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Avg:</span>
          <span className={`text-sm font-medium ${
            avgResponseTime <= 200 ? 'text-green-600' : avgResponseTime <= 500 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {Math.round(avgResponseTime)}ms
          </span>
        </div>
      </div>
      <div className="h-64">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}
