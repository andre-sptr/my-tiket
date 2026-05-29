'use client';

import { clsx } from 'clsx';
import { SlidersHorizontal } from 'lucide-react';

interface Props {
  airlines: string[];
  filterAirlines: string[];
  onFilterAirlines: (v: string[]) => void;
  filterStops: number | null;
  onFilterStops: (v: number | null) => void;
  sortBy: 'price' | 'duration' | 'departure';
  onSortBy: (v: 'price' | 'duration' | 'departure') => void;
  totalResults: number;
  isLoading: boolean;
}

const chipBase   = 'rounded-full border px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-widest transition-all cursor-pointer';
const chipActive = 'border-midnight-700 bg-midnight-700 text-cream-50';
const chipIdle   = 'border-midnight-700/15 bg-transparent text-ink-500 hover:border-midnight-700/50 hover:text-midnight-700';

export default function FilterBar({
  airlines, filterAirlines, onFilterAirlines,
  filterStops, onFilterStops,
  sortBy, onSortBy,
  totalResults, isLoading,
}: Props) {
  function toggleAirline(code: string) {
    if (filterAirlines.includes(code)) {
      onFilterAirlines(filterAirlines.filter((a) => a !== code));
    } else {
      onFilterAirlines([...filterAirlines, code]);
    }
  }

  return (
    <div className="pass-card space-y-5 p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <SlidersHorizontal className="h-3.5 w-3.5 text-amber-500" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-ink-500">
            Filter &amp; Urutkan
          </span>
        </div>
        {!isLoading && (
          <span className="font-display text-sm italic text-ink-400">
            {totalResults} pilihan ditemukan
          </span>
        )}
      </div>

      <Row label="Urutkan">
        {(['price', 'duration', 'departure'] as const).map((s) => (
          <button
            key={s}
            onClick={() => onSortBy(s)}
            className={clsx(chipBase, sortBy === s ? chipActive : chipIdle)}
          >
            {s === 'price' ? 'Termurah' : s === 'duration' ? 'Tercepat' : 'Keberangkatan'}
          </button>
        ))}
      </Row>

      <Row label="Transit">
        <button onClick={() => onFilterStops(null)} className={clsx(chipBase, filterStops === null ? chipActive : chipIdle)}>Semua</button>
        <button onClick={() => onFilterStops(0)}    className={clsx(chipBase, filterStops === 0    ? chipActive : chipIdle)}>Langsung</button>
        <button onClick={() => onFilterStops(1)}    className={clsx(chipBase, filterStops === 1    ? chipActive : chipIdle)}>1 Transit</button>
      </Row>

      {airlines.length > 0 && (
        <Row label="Maskapai">
          {airlines.map((code) => (
            <button
              key={code}
              onClick={() => toggleAirline(code)}
              className={clsx(chipBase, filterAirlines.includes(code) ? chipActive : chipIdle)}
            >
              {code}
            </button>
          ))}
        </Row>
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-2 min-w-[60px] font-mono text-[9px] uppercase tracking-widest text-ink-400">
        {label}
      </span>
      {children}
    </div>
  );
}
