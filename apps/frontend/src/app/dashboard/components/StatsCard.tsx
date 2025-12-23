'use client';

import { ReactNode } from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    value?: string;
  };
  variant?: 'default' | 'success' | 'warning' | 'danger';
  size?: 'default' | 'compact';
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  variant = 'default',
  size = 'default',
}: StatsCardProps) {
  const variantStyles = {
    default: 'bg-gray-50 text-gray-600',
    success: 'bg-green-50 text-green-600',
    warning: 'bg-yellow-50 text-yellow-600',
    danger: 'bg-red-50 text-red-600',
  };

  const trendStyles = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-gray-500',
  };

  const trendIcons = {
    up: (
      <svg className={size === 'compact' ? 'w-3 h-3' : 'w-4 h-4'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
      </svg>
    ),
    down: (
      <svg className={size === 'compact' ? 'w-3 h-3' : 'w-4 h-4'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
      </svg>
    ),
    neutral: (
      <svg className={size === 'compact' ? 'w-3 h-3' : 'w-4 h-4'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
      </svg>
    ),
  };

  const isCompact = size === 'compact';

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${isCompact ? 'p-4' : 'p-6'} hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className={`font-medium text-gray-500 mb-1 ${isCompact ? 'text-xs' : 'text-sm'}`}>{title}</p>
          <p className={`font-bold text-gray-900 ${isCompact ? 'text-xl' : 'text-2xl'}`}>{value}</p>
          {subtitle && (
            <p className={`text-gray-500 mt-1 ${isCompact ? 'text-xs' : 'text-sm'}`}>{subtitle}</p>
          )}
          {trend && (
            <div className={`flex items-center gap-1 ${isCompact ? 'mt-1' : 'mt-2'} ${trendStyles[trend.direction]}`}>
              {trendIcons[trend.direction]}
              {trend.value && <span className={`font-medium ${isCompact ? 'text-xs' : 'text-sm'}`}>{trend.value}</span>}
            </div>
          )}
        </div>
        <div className={`rounded-lg ${variantStyles[variant]} ${isCompact ? 'p-2' : 'p-3'}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
