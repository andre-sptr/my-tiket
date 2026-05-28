'use client';

import { useState } from 'react';
import { X, Bell, BellOff, Loader2, CheckCircle2 } from 'lucide-react';
import { createAlert } from '@/lib/api';
import { requestAndSubscribe, getExistingSubscription } from '@/lib/push';
import { getClientId, addAlertId } from '@/lib/localStorage';
import { formatIDR, formatDate, formatTime } from '@/lib/format';
import type { FlightOffer, SearchParams } from '@/lib/types';
import { toast } from 'sonner';

interface Props {
  flight: FlightOffer;
  searchParams: SearchParams;
  onClose: () => void;
}

export default function AlertModal({ flight, searchParams, onClose }: Props) {
  const [threshold, setThreshold] = useState(Math.floor(flight.priceIdr * 0.9));
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');

    try {
      // Get or create push subscription
      let subscription = await getExistingSubscription();
      if (!subscription) {
        subscription = await requestAndSubscribe();
      }
      if (!subscription) {
        toast.error('Izin notifikasi diperlukan untuk mengaktifkan alert.');
        setStatus('idle');
        return;
      }

      const clientId = getClientId();
      const alert = await createAlert({
        origin: flight.origin,
        destination: flight.destination,
        departureDate: searchParams.date,
        airlineCode: flight.airline.code,
        flightNumber: flight.flightNumber,
        cabinClass: flight.cabinClass,
        thresholdPrice: threshold,
        pushSubscription: subscription.toJSON(),
        clientId,
      });

      addAlertId(alert.id);
      setStatus('success');
      toast.success(`Alert aktif! Kami akan notif saat ${formatIDR(threshold)} tercapai.`);

      setTimeout(onClose, 1500);
    } catch (err) {
      toast.error(`Gagal membuat alert: ${(err as Error).message}`);
      setStatus('idle');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md border border-gray-200 dark:border-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-brand-500" />
            <h2 className="font-semibold text-lg">Set Price Alert</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {status === 'success' ? (
          <div className="p-10 flex flex-col items-center gap-3 text-center">
            <CheckCircle2 className="w-14 h-14 text-green-500" />
            <p className="font-semibold text-lg">Alert Aktif!</p>
            <p className="text-sm text-gray-400">Kami akan mengirim notifikasi saat harga mencapai target Anda.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-5">
            {/* Flight info */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <img
                  src={flight.airline.logo}
                  alt={flight.airline.name}
                  className="w-8 h-8 object-contain rounded"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/airline-placeholder.png'; }}
                />
                <div>
                  <div className="font-semibold text-sm">{flight.airline.name}</div>
                  <div className="text-xs text-gray-400">{flight.flightNumber}</div>
                </div>
              </div>
              <div className="text-sm">
                <span className="font-bold">{flight.origin}</span>
                <span className="text-gray-400 mx-2">→</span>
                <span className="font-bold">{flight.destination}</span>
                <span className="text-gray-400 text-xs ml-2">{formatDate(searchParams.date)}</span>
              </div>
              <div className="text-sm text-gray-500">
                {formatTime(flight.departureAt)} — {formatTime(flight.arrivalAt)} · {flight.cabinClass}
              </div>
              <div className="text-sm font-medium">
                Harga saat ini: <span className="text-brand-600">{formatIDR(flight.priceIdr)}</span>
              </div>
            </div>

            {/* Threshold input */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Beritahu saya jika harga ≤
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">Rp</span>
                <input
                  type="number"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  min={1}
                  step={10000}
                  required
                />
              </div>
              {threshold >= flight.priceIdr && (
                <p className="text-xs text-orange-500 mt-1">
                  ⚠️ Target lebih tinggi dari harga saat ini. Alert akan langsung terpicu.
                </p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                Hemat {Math.round((1 - threshold / flight.priceIdr) * 100)}% dari harga saat ini
              </p>
            </div>

            {/* Push notification note */}
            <div className="flex items-start gap-2 text-xs text-gray-400 bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3">
              <Bell className="w-3.5 h-3.5 mt-0.5 text-blue-500 flex-shrink-0" />
              <span>
                Notifikasi akan muncul di browser Anda (bahkan saat tab ditutup) saat harga menyentuh target.
                Pastikan notifikasi browser diizinkan.
              </span>
            </div>

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-semibold rounded-lg py-2.5 flex items-center justify-center gap-2 transition-colors"
            >
              {status === 'loading' ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Mengaktifkan...</>
              ) : (
                <><Bell className="w-4 h-4" /> Aktifkan Alert</>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
