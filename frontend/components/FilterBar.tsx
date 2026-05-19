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

const chipCls = 'px-3 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer';
const activeChip = 'bg-brand-600 text-white border-brand-600';
const inactiveChip = 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-brand-400';

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
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          <SlidersHorizontal className="w-4 h-4" />
          Filter & Urutkan
        </div>
        {!isLoading && (
          <span className="text-xs text-gray-400">{totalResults} penerbangan</span>
        )}
      </div>

      {/* Sort */}
      <div className="flex gap-2 flex-wrap">
        <span className="text-xs text-gray-400 self-center mr-1">Urutkan:</span>
        {(['price', 'duration', 'departure'] as const).map((s) => (
          <button key={s} onClick={() => onSortBy(s)} className={clsx(chipCls, sortBy === s ? activeChip : inactiveChip)}>
            {s === 'price' ? 'Harga Termurah' : s === 'duration' ? 'Tercepat' : 'Keberangkatan'}
          </button>
        ))}
      </div>

      {/* Stops */}
      <div className="flex gap-2 flex-wrap">
        <span className="text-xs text-gray-400 self-center mr-1">Transit:</span>
        <button onClick={() => onFilterStops(null)} className={clsx(chipCls, filterStops === null ? activeChip : inactiveChip)}>Semua</button>
        <button onClick={() => onFilterStops(0)} className={clsx(chipCls, filterStops === 0 ? activeChip : inactiveChip)}>Langsung</button>
        <button onClick={() => onFilterStops(1)} className={clsx(chipCls, filterStops === 1 ? activeChip : inactiveChip)}>1 Transit</button>
      </div>

      {/* Airlines */}
      {airlines.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <span className="text-xs text-gray-400 self-center mr-1">Maskapai:</span>
          {airlines.map((code) => (
            <button key={code} onClick={() => toggleAirline(code)} className={clsx(chipCls, filterAirlines.includes(code) ? activeChip : inactiveChip)}>
              {code}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
