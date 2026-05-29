'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, ArrowLeftRight, Plane, Loader2 } from 'lucide-react';
import { useIsFetching } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Airport, CabinClass } from '@/lib/types';
import { buildFlightSearchQuery, getTripType, isValidReturnDate, type TripType } from '@/lib/trip';
import { clsx } from 'clsx';
import AirportAutocomplete from './AirportAutocomplete';

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
  const paramsFingerprint = searchParams.toString();

  const [origin,      setOrigin]      = useState(searchParams.get('origin') || '');
  const [originAirport, setOriginAirport] = useState<Airport | null>(null);
  const [destination, setDestination] = useState(searchParams.get('destination') || '');
  const [destinationAirport, setDestinationAirport] = useState<Airport | null>(null);
  const [date,        setDate]        = useState(searchParams.get('date') || '');
  const [returnDate,  setReturnDate]  = useState(searchParams.get('returnDate') || '');
  const [tripType,    setTripType]    = useState<TripType>(
    getTripType(searchParams.get('returnDate'))
  );
  const [adults,      setAdults]      = useState(Number(searchParams.get('adults') || 1));
  const [cabin,       setCabin]       = useState<CabinClass>(
    (searchParams.get('cabin') as CabinClass) || 'ECONOMY'
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRoutePending, startTransition] = useTransition();
  const activeFlightFetches = useIsFetching({ queryKey: ['flights'] });
  const isSearching = isSubmitting || isRoutePending || (compact && activeFlightFetches > 0);

  useEffect(() => {
    setIsSubmitting(false);
  }, [paramsFingerprint]);

  function selectAirport(airport: Airport, type: 'origin' | 'dest') {
    if (type === 'origin') {
      setOrigin(airport.iataCode);
      setOriginAirport(airport);
    } else {
      setDestination(airport.iataCode);
      setDestinationAirport(airport);
    }
  }

  function clearAirport(type: 'origin' | 'dest') {
    if (type === 'origin') {
      setOrigin('');
      setOriginAirport(null);
    } else {
      setDestination('');
      setDestinationAirport(null);
    }
  }

  function swapLocations() {
    const nextOrigin = destination;
    const nextOriginAirport = destinationAirport;
    const nextDestination = origin;
    const nextDestinationAirport = originAirport;

    setOrigin(nextOrigin);
    setOriginAirport(nextOriginAirport);
    setDestination(nextDestination);
    setDestinationAirport(nextDestinationAirport);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!origin || !destination) {
      toast.error('Pilih bandara asal dan tujuan dari dropdown.');
      return;
    }
    if (origin === destination) {
      toast.error('Bandara asal dan tujuan tidak boleh sama.');
      return;
    }
    if (!date) {
      toast.error('Pilih tanggal keberangkatan.');
      return;
    }
    if (tripType === 'ROUND_TRIP' && !returnDate) {
      toast.error('Pilih tanggal pulang untuk tiket pulang-pergi.');
      return;
    }
    if (tripType === 'ROUND_TRIP' && returnDate && !isValidReturnDate(date, returnDate)) {
      toast.error('Tanggal pulang harus setelah atau sama dengan tanggal berangkat.');
      return;
    }

    const qs = buildFlightSearchQuery({
      origin,
      destination,
      date,
      returnDate,
      tripType,
      adults,
      cabin,
    });
    setIsSubmitting(true);
    startTransition(() => {
      router.push(`/search?${qs}`);
    });
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
        <div className="col-span-1 border-b border-midnight-700/10 p-5 sm:p-6 lg:col-span-2">
          <div className="inline-flex rounded-full border border-midnight-700/10 bg-cream-100/70 p-1">
            <TripTypeButton
              active={tripType === 'ONE_WAY'}
              onClick={() => setTripType('ONE_WAY')}
            >
              Sekali Jalan
            </TripTypeButton>
            <TripTypeButton
              active={tripType === 'ROUND_TRIP'}
              onClick={() => setTripType('ROUND_TRIP')}
            >
              Pulang Pergi
            </TripTypeButton>
          </div>
        </div>

        {/* Origin field */}
        <FieldCell label="Dari" code={origin || 'IATA'} className="border-b lg:border-b lg:border-r">
          <AirportAutocomplete
            value={origin}
            selectedAirport={originAirport}
            placeholder="Ketik kota asal"
            onSelect={(airport) => selectAirport(airport, 'origin')}
            onClear={() => clearAirport('origin')}
          />
        </FieldCell>

        {/* Destination field */}
        <FieldCell label="Ke" code={destination || 'IATA'} className="border-b">
          <AirportAutocomplete
            value={destination}
            selectedAirport={destinationAirport}
            placeholder="Ketik kota tujuan"
            onSelect={(airport) => selectAirport(airport, 'dest')}
            onClear={() => clearAirport('dest')}
          />
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
            onChange={(e) => {
              setDate(e.target.value);
              if (returnDate && returnDate < e.target.value) setReturnDate('');
            }}
            required
          />
        </FieldCell>

        {tripType === 'ROUND_TRIP' && (
          <FieldCell label="Pulang" code="RTN" className="border-b">
            <input
              type="date"
              className="input-editorial date-input"
              value={returnDate}
              min={date || new Date().toISOString().split('T')[0]}
              onChange={(e) => setReturnDate(e.target.value)}
              required
            />
          </FieldCell>
        )}

        {/* Adults + cabin in a single cell on lg */}
        <FieldCell
          label="Kabin & Penumpang"
          code="PAX"
          className={clsx('border-b lg:border-b-0', tripType === 'ROUND_TRIP' && 'lg:col-span-2')}
        >
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
            <Meta label="Trip"   value={tripType === 'ROUND_TRIP' ? 'pp' : 'one'} />
            <Meta label="Pax"    value={`0${adults}`} />
            <Meta label="Kabin"  value={cabin.slice(0, 4).toLowerCase()} />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSearching}
          className="btn-primary w-full disabled:cursor-wait disabled:opacity-70"
        >
          {isSearching ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Search className="h-3.5 w-3.5" />
          )}
          {isSearching ? 'Mencari...' : 'Cari Tiket'}
        </button>
      </aside>
    </form>
  );
}

function TripTypeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'rounded-full px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest transition-all',
        active
          ? 'bg-midnight-700 text-cream-50 shadow-pass'
          : 'text-ink-400 hover:text-midnight-700'
      )}
    >
      {children}
    </button>
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
