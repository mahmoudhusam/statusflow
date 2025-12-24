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
  // Special handling for 'row' variant (table rows)
  if (variant === 'row') {
    return (
      <>
        {Array.from({ length: count }).map((_, index) => (
          <tr key={index} className={className}>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="animate-pulse bg-gray-300 h-4 w-32 rounded" />
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="animate-pulse bg-gray-300 h-6 w-12 rounded-full" />
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="animate-pulse bg-gray-300 h-4 w-16 rounded" />
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="animate-pulse bg-gray-300 h-4 w-12 rounded" />
            </td>
          </tr>
        ))}
      </>
    );
  }

  // Render skeletons directly as grid children (no extra wrapper div)
  const skeletons = Array.from({ length: count }).map((_, index) => {
    switch (variant) {
      case 'card':
        return (
          <div
            key={index}
            className={`border border-gray-200 rounded-lg p-4 ${className}`}
          >
            <div className="animate-pulse">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="h-5 bg-gray-300 rounded w-32 mb-2" />
                  <div className="h-4 bg-gray-300 rounded w-48" />
                  <div className="h-3 bg-gray-300 rounded w-24 mt-2" />
                </div>
                <div className="text-right">
                  <div className="h-6 bg-gray-300 rounded-full w-12" />
                  <div className="h-3 bg-gray-300 rounded w-16 mt-2" />
                  <div className="h-3 bg-gray-300 rounded w-12 mt-1" />
                </div>
              </div>
            </div>
          </div>
        );
      case 'chart':
        return (
          <div
            key={index}
            className={`bg-white p-4 rounded-lg border border-gray-200 h-[200px] ${className}`}
          >
            <div className="animate-pulse h-full flex flex-col">
              <div className="h-4 bg-gray-300 rounded w-32 mb-2" />
              <div className="flex-1 bg-gray-200 rounded" />
            </div>
          </div>
        );
      case 'metric':
        return (
          <div
            key={index}
            className={`bg-white p-4 rounded-lg border border-gray-200 ${className}`}
          >
            <div className="animate-pulse">
              <div className="flex items-center justify-between mb-2">
                <div className="h-3 bg-gray-300 rounded w-20" />
                <div className="h-5 w-5 bg-gray-300 rounded" />
              </div>
              <div className="h-7 bg-gray-300 rounded w-16 mb-1" />
              <div className="h-3 bg-gray-300 rounded w-24" />
            </div>
          </div>
        );
      case 'text':
        return (
          <div key={index} className={`animate-pulse space-y-2 ${className}`}>
            <div className="h-4 bg-gray-300 rounded w-full" />
            <div className="h-4 bg-gray-300 rounded w-5/6" />
            <div className="h-4 bg-gray-300 rounded w-4/6" />
          </div>
        );
      default:
        return null;
    }
  });

  return <>{skeletons}</>;
}
