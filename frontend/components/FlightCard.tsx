'use client';

import { useState } from 'react';
import { Clock, Luggage, BellPlus, ExternalLink, ChevronDown } from 'lucide-react';
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

export default function FlightCard({ flight, searchParams }: Props) {
  const [showChart, setShowChart] = useState(false);
  const [showAlert, setShowAlert] = useState(false);

  const stops = flight.stops === 0
    ? 'Langsung'
    : `${flight.stops} Transit`;

  return (
    <>
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 hover:shadow-md transition-shadow">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Airline */}
          <div className="flex items-center gap-3 sm:w-44">
            <img
              src={flight.airline.logo}
              alt={flight.airline.name}
              className="w-10 h-10 object-contain rounded"
              onError={(e) => { (e.target as HTMLImageElement).src = '/airline-placeholder.png'; }}
            />
            <div>
              <div className="font-semibold text-sm">{flight.airline.name}</div>
              <div className="text-xs text-gray-400">{flight.flightNumber}</div>
            </div>
          </div>

          {/* Schedule */}
          <div className="flex items-center gap-4 flex-1">
            <div className="text-center">
              <div className="text-xl font-bold tabular-nums">{formatTime(flight.departureAt)}</div>
              <div className="text-xs text-gray-400">{flight.origin}</div>
            </div>

            <div className="flex-1 flex flex-col items-center">
              <div className="text-xs text-gray-400 mb-1">{formatDuration(flight.durationMinutes)}</div>
              <div className="w-full flex items-center gap-1">
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                <div className={clsx(
                  'text-xs px-1.5 py-0.5 rounded-full font-medium',
                  flight.stops === 0
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                    : 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                )}>
                  {stops}
                </div>
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
              </div>
            </div>

            <div className="text-center">
              <div className="text-xl font-bold tabular-nums">{formatTime(flight.arrivalAt)}</div>
              <div className="text-xs text-gray-400">{flight.destination}</div>
            </div>
          </div>

          {/* Price & actions */}
          <div className="flex flex-col items-end gap-2 sm:w-44">
            <SourceBadge source={flight.source} />
            <div className="text-2xl font-bold text-brand-600">{formatIDR(flight.priceIdr)}</div>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Luggage className="w-3 h-3" />
              {flight.baggage}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAlert(true)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-brand-50 dark:bg-brand-900/30 text-brand-600 hover:bg-brand-100 transition-colors"
              >
                <BellPlus className="w-3.5 h-3.5" />
                Set Alert
              </button>
              <a
                href={flight.bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-green-50 dark:bg-green-900/30 text-green-600 hover:bg-green-100 transition-colors"
              >
                Pesan
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Toggle chart */}
        <button
          onClick={() => setShowChart(!showChart)}
          className="mt-3 flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ChevronDown className={clsx('w-3.5 h-3.5 transition-transform', showChart && 'rotate-180')} />
          {showChart ? 'Sembunyikan' : 'Lihat'} Riwayat Harga
        </button>

        {showChart && (
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            <PriceChart
              origin={flight.origin}
              destination={flight.destination}
              date={searchParams.date}
              airlineCode={flight.airline.code}
            />
          </div>
        )}
      </div>

      {/* Alert Modal */}
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
