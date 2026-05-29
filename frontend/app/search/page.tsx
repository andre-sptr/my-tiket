'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import SearchForm from '@/components/SearchForm';
import FlightCard from '@/components/FlightCard';
import FlightCardSkeleton from '@/components/FlightCardSkeleton';
import FilterBar from '@/components/FilterBar';
import { searchFlights } from '@/lib/api';
import type { FlightOffer, SearchParams } from '@/lib/types';
import { useState, useMemo } from 'react';

function SearchResults() {
  const searchParams = useSearchParams();
  const [sortBy, setSortBy] = useState<'price' | 'duration' | 'departure'>('price');
  const [filterAirlines, setFilterAirlines] = useState<string[]>([]);
  const [filterStops, setFilterStops] = useState<number | null>(null);

  const params: SearchParams = {
    origin:      searchParams.get('origin') || '',
    destination: searchParams.get('destination') || '',
    date:        searchParams.get('date') || '',
    returnDate:  searchParams.get('returnDate') || undefined,
    adults:      Number(searchParams.get('adults') || 1),
    cabin:       (searchParams.get('cabin') as SearchParams['cabin']) || 'ECONOMY',
    airlines:    searchParams.get('airlines') || undefined,
  };

  const hasParams = params.origin && params.destination && params.date;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['flights', params],
    queryFn:  () => searchFlights(params),
    enabled:  !!hasParams,
  });

  const allAirlines = useMemo(() => {
    if (!data?.flights) return [];
    const set = new Set(data.flights.map((f: FlightOffer) => f.airline.code));
    return Array.from(set);
  }, [data]);

  const filtered = useMemo(() => {
    if (!data?.flights) return [];
    return data.flights
      .filter((f: FlightOffer) => {
        if (filterAirlines.length > 0 && !filterAirlines.includes(f.airline.code)) return false;
        if (filterStops !== null && f.stops !== filterStops) return false;
        return true;
      })
      .sort((a: FlightOffer, b: FlightOffer) => {
        if (sortBy === 'price')    return a.priceIdr - b.priceIdr;
        if (sortBy === 'duration') return a.durationMinutes - b.durationMinutes;
        return a.departureAt.localeCompare(b.departureAt);
      });
  }, [data, filterAirlines, filterStops, sortBy]);

  if (!hasParams) {
    return (
      <div className="pass-card flex flex-col items-center gap-3 px-6 py-20 text-center">
        <p className="font-mono text-[10px] uppercase tracking-widest text-ink-400">
          Belum ada pencarian
        </p>
        <p className="font-display text-2xl italic text-midnight-700">
          Isi form di atas untuk mulai mencari tiket.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header strip */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Hasil Pencarian</p>
          <h1 className="font-display text-3xl font-light italic tracking-tight text-midnight-700 sm:text-4xl">
            <span className="num-display">{params.origin}</span>
            <span className="mx-2 text-amber-400">→</span>
            <span className="num-display">{params.destination}</span>
          </h1>
        </div>
        <div className="hidden text-right font-mono text-[10px] uppercase tracking-widest text-ink-400 sm:block">
          <div>{new Date(params.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
          {params.returnDate && (
            <div>
              Pulang {new Date(params.returnDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
            </div>
          )}
          <div>{params.adults} pax · {params.cabin.toLowerCase()}</div>
        </div>
      </div>

      <FilterBar
        airlines={allAirlines}
        filterAirlines={filterAirlines}
        onFilterAirlines={setFilterAirlines}
        filterStops={filterStops}
        onFilterStops={setFilterStops}
        sortBy={sortBy}
        onSortBy={setSortBy}
        totalResults={filtered.length}
        isLoading={isLoading}
      />

      <div className="space-y-4">
        {isLoading && Array.from({ length: 4 }).map((_, i) => (
          <FlightCardSkeleton key={i} />
        ))}

        {isError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 font-display text-base italic text-red-700">
            Gagal memuat data: {(error as Error).message}
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="pass-card flex flex-col items-center gap-3 px-6 py-16 text-center">
            <p className="font-mono text-[10px] uppercase tracking-widest text-ink-400">
              Hasil Kosong
            </p>
            <p className="font-display text-2xl italic text-midnight-700">
              Tidak ada penerbangan ditemukan.
            </p>
            <p className="font-mono text-[10px] uppercase tracking-widest text-ink-400">
              Coba ubah filter atau tanggal
            </p>
          </div>
        )}

        {filtered.map((flight: FlightOffer, i) => (
          <div
            key={flight.id}
            className="animate-fade-up"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <FlightCard flight={flight} searchParams={params} />
          </div>
        ))}
      </div>

      {data && data.flights.length > 0 && (
        <p className="border-t border-dashed border-midnight-700/15 pt-4 text-center font-mono text-[10px] uppercase tracking-widest text-ink-400">
          ✦ Harga bersumber dari Duffel GDS &amp; situs maskapai langsung · Konfirmasi sebelum booking · Berubah sewaktu-waktu
        </p>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <div className="space-y-10">
      <Suspense fallback={<div className="pass-card h-64 animate-pulse" />}>
        <SearchForm compact />
      </Suspense>
      <Suspense
        fallback={
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <FlightCardSkeleton key={i} />
            ))}
          </div>
        }
      >
        <SearchResults />
      </Suspense>
    </div>
  );
}
