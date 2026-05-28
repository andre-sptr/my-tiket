'use client';

import { Trash2, Bell, CheckCircle2 } from 'lucide-react';
import { formatIDR, formatShortDate } from '@/lib/format';
import type { Alert } from '@/lib/types';

interface Props {
  alerts: Alert[];
  onDelete: (id: string) => void;
  triggered?: boolean;
}

export default function AlertList({ alerts, onDelete, triggered = false }: Props) {
  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 p-2 rounded-lg ${triggered ? 'bg-green-100 dark:bg-green-900/30' : 'bg-brand-50 dark:bg-brand-900/30'}`}>
                {triggered
                  ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                  : <Bell className="w-4 h-4 text-brand-500 animate-pulse" />
                }
              </div>
              <div className="space-y-1">
                <div className="font-semibold text-sm">
                  {alert.origin} → {alert.destination}
                  {alert.airlineCode && (
                    <span className="ml-2 text-xs font-normal text-gray-400">
                      {alert.airlineCode}
                      {alert.flightNumber && ` · ${alert.flightNumber}`}
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-400">
                  {formatShortDate(alert.departureDate)} · {alert.cabinClass}
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span>
                    Target: <span className="font-semibold text-brand-600">{formatIDR(alert.thresholdPrice)}</span>
                  </span>
                  {alert.lastPriceSeen && (
                    <span className="text-gray-400">
                      Terakhir: <span className="font-medium">{formatIDR(alert.lastPriceSeen)}</span>
                    </span>
                  )}
                </div>
                {triggered && alert.triggeredAt && (
                  <div className="text-xs text-green-500">
                    ✅ Terpicu {formatShortDate(alert.triggeredAt)}
                  </div>
                )}
                {!triggered && alert.lastCheckedAt && (
                  <div className="text-xs text-gray-400">
                    Terakhir dicek: {new Date(alert.lastCheckedAt).toLocaleString('id-ID')}
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => onDelete(alert.id)}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors flex-shrink-0"
              title="Hapus alert"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
