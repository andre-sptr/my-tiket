import type { FlightSource } from '@/lib/types';
import { clsx } from 'clsx';

const SOURCE_META: Record<FlightSource, { label: string; color: string }> = {
  DUFFEL:      { label: 'Duffel',     color: 'border-sky-500 text-sky-500' },
  AMADEUS:     { label: 'Amadeus',    color: 'border-blue-500 text-blue-500' },
  LIONAIR:     { label: 'Lion Air',   color: 'border-orange-600 text-orange-600' },
  CITILINK:    { label: 'Citilink',   color: 'border-emerald-600 text-emerald-600' },
  AIRASIA:     { label: 'AirAsia',    color: 'border-red-600 text-red-600' },
  SUPERAIRJET: { label: 'Super Jet',  color: 'border-purple-600 text-purple-600' },
};

const FALLBACK = { label: 'Unknown', color: 'border-ink-400 text-ink-400' };

export default function SourceBadge({ source }: { source: FlightSource }) {
  const meta = SOURCE_META[source] || FALLBACK;
  return (
    <span className={clsx('stamp', meta.color)}>
      {meta.label}
    </span>
  );
}
