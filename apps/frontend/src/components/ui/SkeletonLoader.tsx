interface SkeletonLoaderProps {
  variant?: 'card' | 'row' | 'chart' | 'metric' | 'text';
  count?: number;
  className?: string;
}

export function SkeletonLoader({
  variant = 'card',
  count = 1,
  className = '',
}: SkeletonLoaderProps) {
  const renderSkeleton = () => {
    switch (variant) {
      case 'card':
        return (
          <div
            className={`border border-gray-200 rounded-lg p-4 dark:border-gray-700 ${className}`}
          >
            <div className="animate-pulse">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-32 mb-2" />
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-48" />
                  <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-24 mt-2" />
                </div>
                <div className="text-right">
                  <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded-full w-12" />
                  <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-16 mt-2" />
                  <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-12 mt-1" />
                </div>
              </div>
            </div>
          </div>
        );

      case 'row':
        return (
          <tr className={className}>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="animate-pulse bg-gray-300 dark:bg-gray-600 h-4 w-32 rounded" />
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="animate-pulse bg-gray-300 dark:bg-gray-600 h-6 w-12 rounded-full" />
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="animate-pulse bg-gray-300 dark:bg-gray-600 h-4 w-16 rounded" />
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="animate-pulse bg-gray-300 dark:bg-gray-600 h-4 w-12 rounded" />
            </td>
          </tr>
        );

      case 'chart':
        return (
          <div
            className={`bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}
          >
            <div className="animate-pulse">
              <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-40 mb-4" />
              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          </div>
        );

      case 'metric':
        return (
          <div
            className={`bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}
          >
            <div className="animate-pulse">
              <div className="flex items-center justify-between mb-2">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24" />
                <div className="h-3 w-3 bg-gray-300 dark:bg-gray-600 rounded-full" />
              </div>
              <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-20 mb-1" />
              <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-32" />
            </div>
          </div>
        );

      case 'text':
        return (
          <div className={`animate-pulse space-y-2 ${className}`}>
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full" />
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-5/6" />
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-4/6" />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index}>{renderSkeleton()}</div>
      ))}
    </>
  );
}
