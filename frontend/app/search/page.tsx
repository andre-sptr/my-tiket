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
    origin: searchParams.get('origin') || '',
    destination: searchParams.get('destination') || '',
    date: searchParams.get('date') || '',
    returnDate: searchParams.get('returnDate') || undefined,
    adults: Number(searchParams.get('adults') || 1),
    cabin: (searchParams.get('cabin') as SearchParams['cabin']) || 'ECONOMY',
    airlines: searchParams.get('airlines') || undefined,
  };

  const hasParams = params.origin && params.destination && params.date;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['flights', params],
    queryFn: () => searchFlights(params),
    enabled: !!hasParams,
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
        if (sortBy === 'price') return a.priceIdr - b.priceIdr;
        if (sortBy === 'duration') return a.durationMinutes - b.durationMinutes;
        return a.departureAt.localeCompare(b.departureAt);
      });
  }, [data, filterAirlines, filterStops, sortBy]);

  if (!hasParams) {
    return (
      <div className="text-center py-16 text-gray-400">
        Isi form pencarian di atas untuk mulai mencari tiket.
      </div>
    );
  }

  return (
    <div>
      {/* Filter bar */}
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

      {/* Results */}
      <div className="space-y-3 mt-4">
        {isLoading && Array.from({ length: 4 }).map((_, i) => (
          <FlightCardSkeleton key={i} />
        ))}

        {isError && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl p-4 text-red-600 dark:text-red-400">
            Gagal memuat data: {(error as Error).message}
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            Tidak ada penerbangan ditemukan. Coba ubah filter atau tanggal.
          </div>
        )}

        {filtered.map((flight: FlightOffer) => (
          <FlightCard key={flight.id} flight={flight} searchParams={params} />
        ))}
      </div>

      {/* Disclaimer */}
      {data && data.flights.length > 0 && (
        <p className="text-xs text-gray-400 mt-6 text-center">
          * Harga bersumber dari Amadeus GDS dan website maskapai langsung. Konfirmasi harga final sebelum booking.
          Harga dapat berubah sewaktu-waktu.
        </p>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <div className="space-y-6">
      <SearchForm compact />
      <Suspense fallback={<div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <FlightCardSkeleton key={i} />)}</div>}>
        <SearchResults />
      </Suspense>
    </div>
  );
}
