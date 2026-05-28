'use client';

import { useQuery } from '@tanstack/react-query';
import { getInspiration } from '@/lib/api';
import { formatIDR, formatShortDate } from '@/lib/format';
import Link from 'next/link';
import { Plane } from 'lucide-react';

interface Props {
  origin: string;
}

export default function ExploreSection({ origin }: Props) {
  const { data = [], isLoading } = useQuery({
    queryKey: ['inspiration', origin],
    queryFn: () => getInspiration(origin),
    staleTime: 60 * 60 * 1000, // 1 jam (data cached harian)
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return <p className="text-sm text-gray-400">Data destinasi tidak tersedia saat ini.</p>;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {data.slice(0, 8).map((dest) => (
        <Link
          key={dest.destination}
          href={`/search?origin=${origin}&destination=${dest.destination}&date=${dest.date}&adults=1&cabin=ECONOMY`}
          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 hover:shadow-md hover:border-brand-300 transition-all group"
        >
          <div className="flex items-center gap-2 mb-2">
            <Plane className="w-4 h-4 text-brand-500 group-hover:translate-x-1 transition-transform" />
            <span className="font-bold text-sm">{dest.destination}</span>
          </div>
          <p className="text-xs text-gray-400 mb-1">{dest.cityName}</p>
          <p className="text-sm font-semibold text-brand-600">{formatIDR(dest.priceIdr)}</p>
          <p className="text-xs text-gray-400 mt-0.5">{formatShortDate(dest.date)}</p>
        </Link>
      ))}
    </div>
  );
}
