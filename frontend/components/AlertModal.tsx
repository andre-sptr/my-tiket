'use client';

import { useState } from 'react';
import { X, Bell, Loader2, CheckCircle2, MessageCircle } from 'lucide-react';
import { createAlert } from '@/lib/api';
import { getClientId, addAlertId } from '@/lib/localStorage';
import { formatIDR } from '@/lib/format';
import type { CabinClass, FlightOffer, SearchParams } from '@/lib/types';
import { toast } from 'sonner';

interface Props {
  /** Optional prefill dari flight card */
  flight?: FlightOffer;
  searchParams?: SearchParams;
  /** Optional default origin/destination kalau dibuka dari halaman alerts */
  defaultOrigin?: string;
  defaultDestination?: string;
  onClose: () => void;
}

const CABIN_CLASSES: CabinClass[] = ['ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST'];

export default function AlertModal({
  flight,
  searchParams,
  defaultOrigin,
  defaultDestination,
  onClose,
}: Props) {
  const today = new Date().toISOString().split('T')[0];

  const [origin, setOrigin] = useState(flight?.origin || defaultOrigin || '');
  const [destination, setDestination] = useState(flight?.destination || defaultDestination || '');
  const [dateFrom, setDateFrom] = useState(searchParams?.date || today);
  const [dateTo, setDateTo] = useState(() => {
    if (searchParams?.returnDate) return searchParams.returnDate;
    if (searchParams?.date) {
      const d = new Date(searchParams.date);
      d.setDate(d.getDate() + 7);
      return d.toISOString().split('T')[0];
    }
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });
  const [cabinClass, setCabinClass] = useState<CabinClass>(
    flight?.cabinClass || searchParams?.cabin || 'ECONOMY',
  );
  const [airlineCode, setAirlineCode] = useState(flight?.airline.code || '');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [maxPrice, setMaxPrice] = useState(
    flight ? Math.floor(flight.priceIdr * 0.9) : 1_000_000,
  );
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (origin.length !== 3 || destination.length !== 3) {
      toast.error('Kode bandara harus 3 huruf (mis. CGK, DPS)');
      return;
    }
    if (dateTo < dateFrom) {
      toast.error('Tanggal akhir harus ≥ tanggal mulai');
      return;
    }
    const phoneDigits = phoneNumber.replace(/\D/g, '');
    if (phoneDigits.length < 8) {
      toast.error('Nomor HP tidak valid');
      return;
    }

    setStatus('loading');
    try {
      const clientId = getClientId();
      const alert = await createAlert({
        origin: origin.toUpperCase(),
        destination: destination.toUpperCase(),
        departureDateFrom: dateFrom,
        departureDateTo: dateTo,
        airlineCode: airlineCode.trim().toUpperCase() || undefined,
        cabinClass,
        phoneNumber,
        maxPriceIdr: maxPrice,
        clientId,
      });

      addAlertId(alert.id);
      setStatus('success');
      toast.success(`Alert aktif! Notif WhatsApp akan dikirim saat harga ≤ ${formatIDR(maxPrice)}.`);
      setTimeout(onClose, 1800);
    } catch (err) {
      toast.error(`Gagal membuat alert: ${(err as Error).message}`);
      setStatus('idle');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md border border-gray-200 dark:border-gray-800 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-brand-500" />
            <h2 className="font-semibold text-lg">Set Alert Harga</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {status === 'success' ? (
          <div className="p-10 flex flex-col items-center gap-3 text-center">
            <CheckCircle2 className="w-14 h-14 text-green-500" />
            <p className="font-semibold text-lg">Alert Aktif!</p>
            <p className="text-sm text-gray-400">
              Notifikasi WhatsApp akan dikirim ke {phoneNumber} saat harga tercapai.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {/* Origin & Destination */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1 text-gray-500">Dari (IATA)</label>
                <input
                  type="text"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value.toUpperCase().slice(0, 3))}
                  placeholder="CGK"
                  maxLength={3}
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 text-gray-500">Tujuan (IATA)</label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value.toUpperCase().slice(0, 3))}
                  placeholder="DPS"
                  maxLength={3}
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>
            </div>

            {/* Date range */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1 text-gray-500">Berangkat dari</label>
                <input
                  type="date"
                  value={dateFrom}
                  min={today}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 text-gray-500">Sampai</label>
                <input
                  type="date"
                  value={dateTo}
                  min={dateFrom}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>
            </div>

            {/* Cabin & Airline */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1 text-gray-500">Kelas</label>
                <select
                  value={cabinClass}
                  onChange={(e) => setCabinClass(e.target.value as CabinClass)}
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {CABIN_CLASSES.map((c) => (
                    <option key={c} value={c}>
                      {c.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 text-gray-500">
                  Maskapai <span className="text-gray-400">(opsional)</span>
                </label>
                <input
                  type="text"
                  value={airlineCode}
                  onChange={(e) => setAirlineCode(e.target.value.toUpperCase().slice(0, 3))}
                  placeholder="GA, JT, …"
                  maxLength={3}
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            {/* Phone number */}
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-500">
                <MessageCircle className="w-3 h-3 inline mr-1" />
                Nomor WhatsApp
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="08123xxxxxxx atau +628123xxxxxxx"
                className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                required
              />
              <p className="text-xs text-gray-400 mt-1">
                Notifikasi akan dikirim via WhatsApp saat harga tercapai.
              </p>
            </div>

            {/* Max price */}
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-500">
                Beri tahu kalau harga ≤
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">
                  Rp
                </span>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  min={1}
                  step={50000}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">{formatIDR(maxPrice)}</p>
            </div>

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-semibold rounded-lg py-2.5 flex items-center justify-center gap-2 transition-colors"
            >
              {status === 'loading' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Mengaktifkan…
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4" /> Aktifkan Alert
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
