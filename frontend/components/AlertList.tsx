'use client';

import { Trash2, CheckCircle2, MessageCircle, Calendar } from 'lucide-react';
import { formatIDR, formatShortDate } from '@/lib/format';
import type { Alert } from '@/lib/types';
import { clsx } from 'clsx';

interface Props {
  alerts: Alert[];
  onDelete: (id: string) => void;
  triggered?: boolean;
}

export default function AlertList({ alerts, onDelete, triggered = false }: Props) {
  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <article
          key={alert.id}
          className={clsx(
            'pass-card p-5 sm:p-6',
            triggered && 'opacity-80'
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              {/* Route header */}
              <div className="flex items-center gap-3">
                <span
                  className={clsx(
                    'block h-2 w-2 rounded-full',
                    triggered ? 'bg-emerald-500' : 'animate-pulse-soft bg-amber-400'
                  )}
                />
                <div className="font-display num-display text-3xl font-light tracking-tightest text-midnight-700">
                  {alert.origin}
                  <span className="mx-2 text-amber-400">→</span>
                  {alert.destination}
                </div>
                {alert.airlineCode && (
                  <span className="font-mono text-[10px] uppercase tracking-widest text-ink-400">
                    via {alert.airlineCode}
                  </span>
                )}
              </div>

              {/* Date range + cabin */}
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 font-mono text-[10px] uppercase tracking-widest text-ink-400">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3 w-3" />
                  {formatShortDate(alert.departureDateFrom)}
                  {alert.departureDateFrom !== alert.departureDateTo && (
                    <> — {formatShortDate(alert.departureDateTo)}</>
                  )}
                </span>
                <span>·</span>
                {alert.returnDate && (
                  <>
                    <span>PP</span>
                    <span>Pulang {formatShortDate(alert.returnDate)}</span>
                    <span>/</span>
                  </>
                )}
                <span>{alert.cabinClass.replace('_', ' ')}</span>
                <span>·</span>
                <span className="flex items-center gap-1.5">
                  <MessageCircle className="h-3 w-3" />
                  {alert.phoneNumberMasked}
                </span>
              </div>

              {/* Prices */}
              <div className="mt-4 flex flex-wrap items-baseline gap-x-5 gap-y-2 border-t border-dashed border-midnight-700/15 pt-4">
                <div>
                  <div className="font-mono text-[9px] uppercase tracking-widest text-ink-400">
                    Target
                  </div>
                  <div className="font-display text-xl text-amber-500">
                    ≤ {formatIDR(alert.maxPriceIdr)}
                  </div>
                </div>
                {alert.lastPriceSeen && (
                  <div>
                    <div className="font-mono text-[9px] uppercase tracking-widest text-ink-400">
                      Terakhir
                    </div>
                    <div className="font-display text-xl text-midnight-700">
                      {formatIDR(alert.lastPriceSeen)}
                    </div>
                  </div>
                )}
              </div>

              {/* Status row */}
              {triggered && alert.triggeredAt && (
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-emerald-700">
                  <CheckCircle2 className="h-3 w-3" />
                  Terpicu {formatShortDate(alert.triggeredAt)}
                  {alert.matchedDate && <> · tgl {formatShortDate(alert.matchedDate)}</>}
                </div>
              )}
              {!triggered && alert.lastCheckedAt && (
                <div className="mt-3 font-mono text-[9px] uppercase tracking-widest text-ink-400">
                  ✦ Cek terakhir: {new Date(alert.lastCheckedAt).toLocaleString('id-ID')}
                </div>
              )}
            </div>

            {/* Delete */}
            <button
              onClick={() => onDelete(alert.id)}
              className="rounded-full p-2 text-ink-400 transition-all hover:bg-red-50 hover:text-red-600"
              title="Hapus alert"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
