'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, ArrowLeftRight, Plane } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { searchAirports } from '@/lib/api';
import type { Airport, CabinClass } from '@/lib/types';
import { clsx } from 'clsx';

const CABIN_OPTIONS: { value: CabinClass; label: string }[] = [
  { value: 'ECONOMY',          label: 'Ekonomi' },
  { value: 'PREMIUM_ECONOMY',  label: 'Premium' },
  { value: 'BUSINESS',         label: 'Bisnis' },
  { value: 'FIRST',            label: 'Pertama' },
];

interface Props {
  compact?: boolean;
}

export default function SearchForm({ compact = false }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [origin,      setOrigin]      = useState(searchParams.get('origin') || '');
  const [originName,  setOriginName]  = useState('');
  const [destination, setDestination] = useState(searchParams.get('destination') || '');
  const [destName,    setDestName]    = useState('');
  const [date,        setDate]        = useState(searchParams.get('date') || '');
  const [adults,      setAdults]      = useState(Number(searchParams.get('adults') || 1));
  const [cabin,       setCabin]       = useState<CabinClass>(
    (searchParams.get('cabin') as CabinClass) || 'ECONOMY'
  );

  const [originQuery, setOriginQuery] = useState('');
  const [destQuery,   setDestQuery]   = useState('');
  const [activeInput, setActiveInput] = useState<'origin' | 'dest' | null>(null);

  const { data: originResults } = useQuery({
    queryKey: ['airports', originQuery],
    queryFn:  () => searchAirports(originQuery),
    enabled:  originQuery.length >= 2,
  });

  const { data: destResults } = useQuery({
    queryKey: ['airports', destQuery],
    queryFn:  () => searchAirports(destQuery),
    enabled:  destQuery.length >= 2,
  });

  function selectAirport(airport: Airport, type: 'origin' | 'dest') {
    if (type === 'origin') {
      setOrigin(airport.iataCode);
      setOriginName(`${airport.cityName}`);
      setOriginQuery('');
    } else {
      setDestination(airport.iataCode);
      setDestName(`${airport.cityName}`);
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

  return (
    <form
      onSubmit={handleSubmit}
      className={clsx(
        'pass-card relative grid grid-cols-12 gap-0 overflow-visible',
        compact ? 'p-0' : 'p-0'
      )}
    >
      {/* ============== MAIN PASS BODY (cols 1–9) ============== */}
      <div className="col-span-12 grid grid-cols-1 gap-0 lg:col-span-9 lg:grid-cols-2">
        {/* Origin field */}
        <FieldCell label="Dari" code={origin || 'IATA'} className="border-b lg:border-b lg:border-r">
          <input
            className="input-editorial"
            placeholder="Jakarta"
            value={activeInput === 'origin' ? originQuery : originName || origin}
            onChange={(e) => { setOriginQuery(e.target.value); setActiveInput('origin'); }}
            onFocus={() => setActiveInput('origin')}
            required
          />
          {activeInput === 'origin' && originResults && originResults.length > 0 && (
            <AirportDropdown results={originResults} onSelect={(a) => selectAirport(a, 'origin')} />
          )}
        </FieldCell>

        {/* Destination field */}
        <FieldCell label="Ke" code={destination || 'IATA'} className="border-b">
          <input
            className="input-editorial"
            placeholder="Singapura"
            value={activeInput === 'dest' ? destQuery : destName || destination}
            onChange={(e) => { setDestQuery(e.target.value); setActiveInput('dest'); }}
            onFocus={() => setActiveInput('dest')}
            required
          />
          {activeInput === 'dest' && destResults && destResults.length > 0 && (
            <AirportDropdown results={destResults} onSelect={(a) => selectAirport(a, 'dest')} />
          )}
        </FieldCell>

        {/* Dashed flight route + swap button */}
        <div className="col-span-2 hidden items-center justify-center px-6 lg:flex">
          <div className="relative flex w-full items-center text-midnight-700/35">
            <div className="dashed-route flex-1" />
            <button
              type="button"
              onClick={swapLocations}
              aria-label="Tukar asal dan tujuan"
              className="mx-3 flex h-9 w-9 items-center justify-center rounded-full border border-midnight-700/20 bg-cream-50 text-midnight-700 transition-all hover:rotate-180 hover:border-amber-400 hover:text-amber-500"
            >
              <ArrowLeftRight className="h-3.5 w-3.5" />
            </button>
            <div className="dashed-route flex-1" />
            <Plane className="absolute -top-3 left-1/2 h-4 w-4 -translate-x-1/2 -rotate-12 text-amber-400" />
          </div>
        </div>

        {/* Date */}
        <FieldCell label="Berangkat" code="TGL" className="border-b lg:border-r">
          <input
            type="date"
            className="input-editorial date-input"
            value={date}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </FieldCell>

        {/* Adults + cabin in a single cell on lg */}
        <FieldCell label="Kabin & Penumpang" code="PAX" className="border-b lg:border-b-0">
          <div className="flex items-center gap-3">
            <select
              className="input-editorial -ml-1 max-w-[120px] cursor-pointer pr-4"
              value={adults}
              onChange={(e) => setAdults(Number(e.target.value))}
            >
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>{n} Dewasa</option>
              ))}
            </select>
            <span className="text-midnight-700/30">·</span>
            <select
              className="input-editorial cursor-pointer pr-4"
              value={cabin}
              onChange={(e) => setCabin(e.target.value as CabinClass)}
            >
              {CABIN_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </FieldCell>
      </div>

      {/* ============== STUB (cols 10–12) ============== */}
      <aside
        className="perforation relative col-span-12 flex flex-col justify-between gap-6 border-t border-dashed border-midnight-700/30 bg-cream-100/70 p-6 lg:col-span-3 lg:border-l lg:border-t-0"
      >
        <div>
          <div className="font-mono text-[9px] uppercase tracking-widest text-ink-400">
            Boarding Sequence
          </div>
          <div className="mt-2 font-display text-3xl font-light tracking-tightest text-midnight-700">
            <span className="num-display">
              {(origin || '—').padEnd(3, '—').slice(0, 3)}
            </span>
            <span className="mx-1 text-amber-400">→</span>
            <span className="num-display">
              {(destination || '—').padEnd(3, '—').slice(0, 3)}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <Meta label="Pax"    value={`0${adults}`} />
            <Meta label="Kabin"  value={cabin.slice(0, 4).toLowerCase()} />
          </div>
        </div>

        <button type="submit" className="btn-primary w-full">
          <Search className="h-3.5 w-3.5" />
          Cari Tiket
        </button>
      </aside>
    </form>
  );
}

/* ------- internal building blocks ------- */

function FieldCell({
  label,
  code,
  children,
  className,
}: {
  label: string;
  code: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx('relative border-midnight-700/10 p-5 sm:p-6', className)}>
      <div className="flex items-center justify-between">
        <span className="font-mono text-[9px] uppercase tracking-widest text-ink-400">
          {label}
        </span>
        <span className="font-mono text-[9px] uppercase tracking-widest text-amber-500">
          {code}
        </span>
      </div>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-mono text-[9px] uppercase tracking-widest text-ink-400">{label}</div>
      <div className="font-display text-base text-midnight-700">{value}</div>
    </div>
  );
}

function AirportDropdown({
  results,
  onSelect,
}: {
  results: Airport[];
  onSelect: (a: Airport) => void;
}) {
  return (
    <div className="absolute left-0 right-0 top-full z-30 mt-3 max-h-64 overflow-auto rounded-xl border border-midnight-700/10 bg-cream-50 shadow-pass">
      {results.map((ap) => (
        <button
          key={ap.iataCode}
          type="button"
          onClick={() => onSelect(ap)}
          className="flex w-full items-center gap-4 border-b border-midnight-700/5 px-4 py-3 text-left last:border-b-0 hover:bg-cream-100"
        >
          <span className="font-mono text-sm font-bold text-amber-500">
            {ap.iataCode}
          </span>
          <span className="flex-1 font-display text-base italic text-midnight-700">
            {ap.cityName}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-widest text-ink-400">
            {ap.countryCode}
          </span>
        </button>
      ))}
    </div>
  );
}
