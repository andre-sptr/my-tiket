'use client';

import { useQuery } from '@tanstack/react-query';
import { getInspiration } from '@/lib/api';
import { formatIDR, formatShortDate } from '@/lib/format';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

interface Props {
  origin: string;
}

export default function ExploreSection({ origin }: Props) {
  const { data = [], isLoading } = useQuery({
    queryKey: ['inspiration', origin],
    queryFn:  () => getInspiration(origin),
    staleTime: 60 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-44 animate-pulse rounded-2xl border border-midnight-700/10 bg-cream-50"
          />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <p className="font-display text-base italic text-ink-400">
        Data destinasi tidak tersedia saat ini.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {data.slice(0, 8).map((dest, i) => (
        <Link
          key={dest.destination}
          href={`/search?origin=${origin}&destination=${dest.destination}&date=${dest.date}&adults=1&cabin=ECONOMY`}
          className="group relative flex h-44 flex-col justify-between overflow-hidden rounded-2xl border border-midnight-700/10 bg-cream-50 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-midnight-700/40 hover:shadow-pass animate-fade-up"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          {/* corner number */}
          <div className="flex items-start justify-between">
            <span className="font-mono text-[10px] uppercase tracking-widest text-ink-400">
              {String(i + 1).padStart(2, '0')} ✦ {origin} → {dest.destination}
            </span>
            <ArrowUpRight className="h-4 w-4 text-ink-400 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-amber-500" />
          </div>

          <div>
            <div className="font-display text-2xl font-light italic leading-tight text-midnight-700">
              {dest.cityName}
            </div>
            <div className="mt-3 flex items-end justify-between">
              <div>
                <div className="font-mono text-[9px] uppercase tracking-widest text-ink-400">
                  Mulai
                </div>
                <div className="font-display text-lg text-midnight-700">
                  {formatIDR(dest.priceIdr)}
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-[9px] uppercase tracking-widest text-ink-400">
                  Tgl
                </div>
                <div className="font-mono text-xs font-semibold text-amber-500">
                  {formatShortDate(dest.date)}
                </div>
              </div>
            </div>
          </div>

          {/* subtle hover wash */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-0 bg-gradient-to-br from-amber-200/0 to-amber-200/0 transition-all duration-500 group-hover:from-amber-100/60 group-hover:to-transparent"
          />
        </Link>
      ))}
    </div>
  );
}
