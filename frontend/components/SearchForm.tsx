'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, ArrowLeftRight, Calendar, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { searchAirports } from '@/lib/api';
import type { Airport, CabinClass } from '@/lib/types';
import { clsx } from 'clsx';

const CABIN_OPTIONS: { value: CabinClass; label: string }[] = [
  { value: 'ECONOMY', label: 'Ekonomi' },
  { value: 'PREMIUM_ECONOMY', label: 'Premium Ekonomi' },
  { value: 'BUSINESS', label: 'Bisnis' },
  { value: 'FIRST', label: 'Pertama' },
];

interface Props {
  compact?: boolean;
}

export default function SearchForm({ compact = false }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [origin, setOrigin] = useState(searchParams.get('origin') || '');
  const [originName, setOriginName] = useState('');
  const [destination, setDestination] = useState(searchParams.get('destination') || '');
  const [destName, setDestName] = useState('');
  const [date, setDate] = useState(searchParams.get('date') || '');
  const [adults, setAdults] = useState(Number(searchParams.get('adults') || 1));
  const [cabin, setCabin] = useState<CabinClass>((searchParams.get('cabin') as CabinClass) || 'ECONOMY');

  const [originQuery, setOriginQuery] = useState('');
  const [destQuery, setDestQuery] = useState('');
  const [activeInput, setActiveInput] = useState<'origin' | 'dest' | null>(null);

  const { data: originResults } = useQuery({
    queryKey: ['airports', originQuery],
    queryFn: () => searchAirports(originQuery),
    enabled: originQuery.length >= 2,
  });

  const { data: destResults } = useQuery({
    queryKey: ['airports', destQuery],
    queryFn: () => searchAirports(destQuery),
    enabled: destQuery.length >= 2,
  });

  function selectAirport(airport: Airport, type: 'origin' | 'dest') {
    if (type === 'origin') {
      setOrigin(airport.iataCode);
      setOriginName(`${airport.cityName} (${airport.iataCode})`);
      setOriginQuery('');
    } else {
      setDestination(airport.iataCode);
      setDestName(`${airport.cityName} (${airport.iataCode})`);
      setDestQuery('');
    }
    setActiveInput(null);
  }

  function swapLocations() {
    setOrigin(destination);
    setOriginName(destName);
    setDestination(origin);
    setDestName(originName);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!origin || !destination || !date) return;
    const qs = new URLSearchParams({
      origin, destination, date,
      adults: String(adults),
      cabin,
    });
    router.push(`/search?${qs}`);
  }

  const inputCls = 'w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent';

  return (
    <form
      onSubmit={handleSubmit}
      className={clsx(
        'bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800',
        compact ? 'p-4' : 'p-6'
      )}
    >
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
        {/* Origin */}
        <div className="relative md:col-span-2">
          <label className="block text-xs font-medium text-gray-500 mb-1">Dari</label>
          <input
            className={inputCls}
            placeholder="Jakarta (CGK)"
            value={activeInput === 'origin' ? originQuery : originName || origin}
            onChange={(e) => { setOriginQuery(e.target.value); setActiveInput('origin'); }}
            onFocus={() => setActiveInput('origin')}
            required
          />
          {activeInput === 'origin' && originResults && originResults.length > 0 && (
            <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-56 overflow-auto">
              {originResults.map((ap) => (
                <button
                  key={ap.iataCode}
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2"
                  onClick={() => selectAirport(ap, 'origin')}
                >
                  <span className="font-mono font-bold text-brand-500">{ap.iataCode}</span>
                  <span>{ap.cityName}, {ap.countryCode}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Swap button */}
        <div className="flex justify-center md:col-span-1">
          <button
            type="button"
            onClick={swapLocations}
            className="p-2 rounded-full border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeftRight className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Destination */}
        <div className="relative md:col-span-2">
          <label className="block text-xs font-medium text-gray-500 mb-1">Ke</label>
          <input
            className={inputCls}
            placeholder="Singapura (SIN)"
            value={activeInput === 'dest' ? destQuery : destName || destination}
            onChange={(e) => { setDestQuery(e.target.value); setActiveInput('dest'); }}
            onFocus={() => setActiveInput('dest')}
            required
          />
          {activeInput === 'dest' && destResults && destResults.length > 0 && (
            <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-56 overflow-auto">
              {destResults.map((ap) => (
                <button
                  key={ap.iataCode}
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2"
                  onClick={() => selectAirport(ap, 'dest')}
                >
                  <span className="font-mono font-bold text-brand-500">{ap.iataCode}</span>
                  <span>{ap.cityName}, {ap.countryCode}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Date */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Tanggal Berangkat</label>
          <input
            type="date"
            className={inputCls}
            value={date}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        {/* Adults */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Penumpang</label>
          <select
            className={inputCls}
            value={adults}
            onChange={(e) => setAdults(Number(e.target.value))}
          >
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>{n} Dewasa</option>
            ))}
          </select>
        </div>

        {/* Cabin */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Kelas</label>
          <select
            className={inputCls}
            value={cabin}
            onChange={(e) => setCabin(e.target.value as CabinClass)}
          >
            {CABIN_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Submit */}
        <div>
          <button
            type="submit"
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg px-4 py-2.5 text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <Search className="w-4 h-4" />
            Cari Tiket
          </button>
        </div>
      </div>
    </form>
  );
}
