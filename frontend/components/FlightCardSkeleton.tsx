export default function FlightCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-3 sm:w-44">
          <div className="w-10 h-10 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="space-y-2">
            <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-2 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        </div>
        <div className="flex items-center gap-4 flex-1">
          <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
          <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
        <div className="flex flex-col items-end gap-2 sm:w-44">
          <div className="h-6 w-28 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="flex gap-2">
            <div className="h-7 w-20 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            <div className="h-7 w-16 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
