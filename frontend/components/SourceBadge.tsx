import type { FlightSource } from '@/lib/types';
import { clsx } from 'clsx';

const SOURCE_META: Record<FlightSource, { label: string; color: string }> = {
  DUFFEL: { label: 'Duffel', color: 'bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400' },
  AMADEUS: { label: 'Amadeus GDS', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' },
  LIONAIR: { label: 'Lion Air', color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' },
  CITILINK: { label: 'Citilink', color: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' },
  AIRASIA: { label: 'AirAsia', color: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' },
  SUPERAIRJET: { label: 'Super Air Jet', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' },
};

const FALLBACK_META = { label: 'Unknown', color: 'bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400' };

export default function SourceBadge({ source }: { source: FlightSource }) {
  const meta = SOURCE_META[source] || FALLBACK_META;
  return (
    <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-full', meta.color)}>
      {meta.label}
    </span>
  );
}
