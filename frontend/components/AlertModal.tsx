'use client';

import { useState } from 'react';
import { X, Loader2, CheckCircle2 } from 'lucide-react';
import { createAlert } from '@/lib/api';
import { getClientId, addAlertId } from '@/lib/localStorage';
import { formatIDR } from '@/lib/format';
import type { CabinClass, FlightOffer, SearchParams } from '@/lib/types';
import { toast } from 'sonner';

interface Props {
  flight?: FlightOffer;
  searchParams?: SearchParams;
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
      toast.success(`Alert aktif! Notif WhatsApp dikirim saat harga ≤ ${formatIDR(maxPrice)}.`);
      setTimeout(onClose, 1800);
    } catch (err) {
      toast.error(`Gagal membuat alert: ${(err as Error).message}`);
      setStatus('idle');
    }
  }

  const labelCls = 'font-mono text-[10px] uppercase tracking-widest text-ink-400';
  const inputCls = 'mt-1.5 w-full rounded-lg border border-midnight-700/15 bg-cream-100/60 px-3 py-2.5 font-display text-base text-midnight-700 placeholder:text-ink-400/55 placeholder:italic focus:border-amber-400 focus:bg-cream-50 focus:outline-none focus:ring-2 focus:ring-amber-400/30';
  const monoInput = 'mt-1.5 w-full rounded-lg border border-midnight-700/15 bg-cream-100/60 px-3 py-2.5 font-mono text-sm uppercase tracking-wider text-midnight-700 placeholder:text-ink-400/55 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-midnight-700/55 backdrop-blur-sm animate-fade-in">
      <div className="pass-card max-h-[90vh] w-full max-w-md overflow-y-auto bg-cream-50">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-midnight-700/10 bg-cream-50/95 px-6 py-5 backdrop-blur">
          <div>
            <p className={labelCls}>№ 01 · Sinyal Harga</p>
            <h2 className="mt-1 font-display text-2xl font-light italic tracking-tight text-midnight-700">
              Set Alert
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-ink-400 transition-colors hover:bg-midnight-700/5 hover:text-midnight-700"
            aria-label="Tutup"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {status === 'success' ? (
          <div className="flex flex-col items-center gap-4 px-6 py-12 text-center animate-fade-up">
            <div className="rounded-full bg-emerald-100 p-4">
              <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            </div>
            <p className="font-display text-2xl italic text-midnight-700">Alert aktif.</p>
            <p className="font-mono text-[11px] uppercase tracking-widest text-ink-400">
              Sinyal akan dikirim ke {phoneNumber}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6">
            {/* Origin / Destination */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Dari (IATA)</label>
                <input
                  type="text"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value.toUpperCase().slice(0, 3))}
                  placeholder="CGK"
                  maxLength={3}
                  className={monoInput}
                  required
                />
              </div>
              <div>
                <label className={labelCls}>Tujuan (IATA)</label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value.toUpperCase().slice(0, 3))}
                  placeholder="DPS"
                  maxLength={3}
                  className={monoInput}
                  required
                />
              </div>
            </div>

            {/* Date range */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Berangkat dari</label>
                <input
                  type="date"
                  value={dateFrom}
                  min={today}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className={inputCls}
                  required
                />
              </div>
              <div>
                <label className={labelCls}>Sampai</label>
                <input
                  type="date"
                  value={dateTo}
                  min={dateFrom}
                  onChange={(e) => setDateTo(e.target.value)}
                  className={inputCls}
                  required
                />
              </div>
            </div>

            {/* Cabin & Airline */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Kelas</label>
                <select
                  value={cabinClass}
                  onChange={(e) => setCabinClass(e.target.value as CabinClass)}
                  className={inputCls}
                >
                  {CABIN_CLASSES.map((c) => (
                    <option key={c} value={c}>
                      {c.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>
                  Maskapai <span className="normal-case text-ink-400">(opsional)</span>
                </label>
                <input
                  type="text"
                  value={airlineCode}
                  onChange={(e) => setAirlineCode(e.target.value.toUpperCase().slice(0, 3))}
                  placeholder="GA"
                  maxLength={3}
                  className={monoInput}
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className={labelCls}>Nomor WhatsApp</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="08123xxxxxxx"
                className={inputCls}
                required
              />
              <p className="mt-1.5 font-mono text-[9px] uppercase tracking-widest text-ink-400">
                Notifikasi akan dikirim ke nomor ini
              </p>
            </div>

            {/* Max price */}
            <div>
              <label className={labelCls}>Beri tahu kalau harga ≤</label>
              <div className="relative mt-1.5">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs uppercase tracking-widest text-ink-400">
                  Rp
                </span>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  min={1}
                  step={50000}
                  className="w-full rounded-lg border border-midnight-700/15 bg-cream-100/60 py-2.5 pl-10 pr-3 font-display text-base text-midnight-700 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30"
                  required
                />
              </div>
              <p className="mt-1.5 font-display text-sm italic text-amber-500">
                ≈ {formatIDR(maxPrice)}
              </p>
            </div>

            <button
              type="submit"
              disabled={status === 'loading'}
              className="btn-primary w-full disabled:opacity-60"
            >
              {status === 'loading' ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Mengaktifkan…
                </>
              ) : (
                <>Aktifkan Alert</>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
