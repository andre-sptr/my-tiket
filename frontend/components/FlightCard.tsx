'use client';

import { useState } from 'react';
import { Luggage, BellPlus, ExternalLink, ChevronDown, Plane } from 'lucide-react';
import { formatIDR, formatTime, formatDuration } from '@/lib/format';
import type { FlightOffer, SearchParams } from '@/lib/types';
import AlertModal from './AlertModal';
import SourceBadge from './SourceBadge';
import PriceChart from './PriceChart';
import { clsx } from 'clsx';

interface Props {
  flight: FlightOffer;
  searchParams: SearchParams;
}

const SOURCE_LABELS: Record<FlightOffer['source'], string> = {
  DUFFEL: 'Duffel',
  AMADEUS: 'Amadeus',
  LIONAIR: 'Lion Air',
  CITILINK: 'Citilink',
  AIRASIA: 'AirAsia',
  SUPERAIRJET: 'Super Jet',
};

export default function FlightCard({ flight, searchParams }: Props) {
  const [showChart, setShowChart] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const direct = flight.stops === 0;
  const sourceLabel = SOURCE_LABELS[flight.source] || 'Sumber';
  const bookingUrl = flight.bookingUrl?.trim();

  return (
    <>
      <article className="pass-card group overflow-hidden transition-transform duration-300 hover:-translate-y-0.5">
        <div className="grid grid-cols-12 gap-0">

          {/* ============== LEFT: itinerary ============== */}
          <div className="col-span-12 p-5 sm:p-7 md:col-span-9">
            {/* top row — airline + source */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="relative h-11 w-11 overflow-hidden rounded-md border border-midnight-700/10 bg-cream-50 p-1.5">
                  <img
                    src={flight.airline.logo}
                    alt={flight.airline.name}
                    className="h-full w-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/airline-placeholder.png';
                    }}
                  />
                </div>
                <div>
                  <div className="font-display text-lg font-medium leading-tight text-midnight-700">
                    {flight.airline.name}
                  </div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-ink-400">
                    {flight.flightNumber}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {direct && (
                  <span className="stamp border-emerald-600 text-emerald-700">
                    Langsung
                  </span>
                )}
                <SourceBadge source={flight.source} />
              </div>
            </div>

            {/* itinerary row */}
            <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-6">
              {/* Depart */}
              <div>
                <div className="font-display num-display text-[clamp(2rem,5vw,3rem)] font-light leading-none tracking-tightest">
                  {formatTime(flight.departureAt)}
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-amber-500">{flight.origin}</span>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-ink-400">
                    Berangkat
                  </span>
                </div>
              </div>

              {/* Route */}
              <div className="flex w-full min-w-[120px] flex-col items-center text-midnight-700/40">
                <span className="mb-1 font-mono text-[10px] uppercase tracking-widest text-ink-400">
                  {formatDuration(flight.durationMinutes)}
                </span>
                <div className="relative flex w-full items-center">
                  <span className="block h-1.5 w-1.5 rounded-full bg-midnight-700/50" />
                  <div className="dashed-route flex-1" />
                  <Plane className="mx-1 h-4 w-4 -rotate-12 text-amber-400" />
                  <div className="dashed-route flex-1" />
                  <span className="block h-1.5 w-1.5 rounded-full bg-midnight-700/50" />
                </div>
                <span className={clsx(
                  'mt-1 font-mono text-[9px] uppercase tracking-widest',
                  direct ? 'text-emerald-700' : 'text-amber-500'
                )}>
                  {direct ? 'Non-stop' : `${flight.stops} Transit`}
                </span>
              </div>

              {/* Arrive */}
              <div className="text-right">
                <div className="font-display num-display text-[clamp(2rem,5vw,3rem)] font-light leading-none tracking-tightest">
                  {formatTime(flight.arrivalAt)}
                </div>
                <div className="mt-1.5 flex items-center justify-end gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-ink-400">
                    Tiba
                  </span>
                  <span className="font-mono text-sm font-bold text-amber-500">{flight.destination}</span>
                </div>
              </div>
            </div>

            {/* footer row */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-dashed border-midnight-700/15 pt-4">
              <button
                onClick={() => setShowChart(!showChart)}
                className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-ink-400 transition-colors hover:text-midnight-700"
              >
                <ChevronDown className={clsx('h-3 w-3 transition-transform', showChart && 'rotate-180')} />
                {showChart ? 'Tutup' : 'Lihat'} riwayat harga
              </button>
              <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-ink-400">
                <Luggage className="h-3 w-3" />
                {flight.baggage}
              </div>
            </div>
          </div>

          {/* ============== RIGHT: stub ============== */}
          <aside className="perforation relative col-span-12 flex flex-col justify-between gap-5 border-t border-dashed border-midnight-700/30 bg-cream-100/60 p-5 sm:p-7 md:col-span-3 md:border-l md:border-t-0">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-ink-400">
                Harga / pax
              </div>
              <div className="mt-1 font-display text-[clamp(1.6rem,3vw,2.2rem)] font-light leading-tight tracking-tightest text-midnight-700">
                {formatIDR(flight.priceIdr)}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {bookingUrl ? (
                <a
                  href={bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Pesan ${flight.flightNumber} melalui ${sourceLabel}`}
                  className="btn-primary w-full whitespace-nowrap"
                >
                  Pesan di {sourceLabel}
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  className="btn-primary w-full cursor-not-allowed opacity-55"
                >
                  Link Belum Ada
                </button>
              )}
              <button
                onClick={() => setShowAlert(true)}
                className="btn-outline w-full"
              >
                <BellPlus className="h-3 w-3" />
                Set Alert
              </button>
              <p className="text-center font-mono text-[9px] uppercase tracking-widest text-ink-400">
                Buka sumber harga
              </p>
            </div>
          </aside>
        </div>

        {/* expanded chart */}
        {showChart && (
          <div className="border-t border-dashed border-midnight-700/15 bg-cream-50 px-5 py-5 sm:px-7 animate-fade-in">
            <PriceChart
              origin={flight.origin}
              destination={flight.destination}
              date={searchParams.date}
              airlineCode={flight.airline.code}
            />
          </div>
        )}
      </article>

      {showAlert && (
        <AlertModal
          flight={flight}
          searchParams={searchParams}
          onClose={() => setShowAlert(false)}
        />
      )}
    </>
  );
}
