'use client';

import { useState } from 'react';
import { X, Loader2, CheckCircle2 } from 'lucide-react';
import { clsx } from 'clsx';
import { toast } from 'sonner';
import { createAlert } from '@/lib/api';
import { getClientId, addAlertId } from '@/lib/localStorage';
import { formatIDR } from '@/lib/format';
import { buildCreateAlertPayload, isValidAlertReturnDate } from '@/lib/alert';
import { isValidAirportCode } from '@/lib/airport';
import { getTripType, type TripType } from '@/lib/trip';
import type { Airport, CabinClass, FlightOffer, SearchParams } from '@/lib/types';
import AirportAutocomplete from './AirportAutocomplete';

interface Props {
  flight?: FlightOffer;
  searchParams?: SearchParams;
  defaultOrigin?: string;
  defaultDestination?: string;
  onClose: () => void;
}

const CABIN_CLASSES: CabinClass[] = ['ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST'];

function addDays(dateString: string, days: number): string {
  const date = new Date(dateString);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

export default function AlertModal({
  flight,
  searchParams,
  defaultOrigin,
  defaultDestination,
  onClose,
}: Props) {
  const today = new Date().toISOString().split('T')[0];

  const [origin, setOrigin] = useState(flight?.origin || defaultOrigin || '');
  const [originAirport, setOriginAirport] = useState<Airport | null>(null);
  const [destination, setDestination] = useState(flight?.destination || defaultDestination || '');
  const [destinationAirport, setDestinationAirport] = useState<Airport | null>(null);
  const [dateFrom, setDateFrom] = useState(searchParams?.date || today);
  const [dateTo, setDateTo] = useState(() => {
    if (searchParams?.returnDate && searchParams?.date) return searchParams.date;
    if (searchParams?.date) return addDays(searchParams.date, 7);
    return addDays(today, 14);
  });
  const [returnDate, setReturnDate] = useState(searchParams?.returnDate || '');
  const [tripType, setTripType] = useState<TripType>(getTripType(searchParams?.returnDate));
  const [cabinClass, setCabinClass] = useState<CabinClass>(
    flight?.cabinClass || searchParams?.cabin || 'ECONOMY',
  );
  const [airlineCode, setAirlineCode] = useState(flight?.airline.code || '');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [maxPrice, setMaxPrice] = useState(
    flight ? Math.floor(flight.priceIdr * 0.9) : 1_000_000,
  );
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  function handleTripTypeChange(nextTripType: TripType) {
    setTripType(nextTripType);
    if (nextTripType === 'ROUND_TRIP' && !returnDate) {
      setReturnDate(addDays(dateTo || dateFrom || today, 7));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!isValidAirportCode(origin) || !isValidAirportCode(destination)) {
      toast.error('Pilih bandara asal dan tujuan dari dropdown.');
      return;
    }
    if (origin.toUpperCase() === destination.toUpperCase()) {
      toast.error('Bandara asal dan tujuan tidak boleh sama.');
      return;
    }
    if (dateTo < dateFrom) {
      toast.error('Tanggal akhir harus setelah atau sama dengan tanggal mulai.');
      return;
    }
    if (tripType === 'ROUND_TRIP' && !returnDate) {
      toast.error('Pilih tanggal pulang untuk alert tiket pulang-pergi.');
      return;
    }
    if (tripType === 'ROUND_TRIP' && returnDate && !isValidAlertReturnDate(dateTo, returnDate)) {
      toast.error('Tanggal pulang harus setelah atau sama dengan tanggal berangkat terakhir.');
      return;
    }
    const phoneDigits = phoneNumber.replace(/\D/g, '');
    if (phoneDigits.length < 8) {
      toast.error('Nomor HP tidak valid.');
      return;
    }

    setStatus('loading');
    try {
      const clientId = getClientId();
      const alert = await createAlert(
        buildCreateAlertPayload({
          origin,
          destination,
          departureDateFrom: dateFrom,
          departureDateTo: dateTo,
          returnDate,
          tripType,
          airlineCode,
          cabinClass,
          phoneNumber,
          maxPriceIdr: maxPrice,
          clientId,
        }),
      );

      addAlertId(alert.id);
      setStatus('success');
      toast.success(
        `Alert ${tripType === 'ROUND_TRIP' ? 'PP ' : ''}aktif. Notif WhatsApp dikirim saat harga <= ${formatIDR(maxPrice)}.`,
      );
      setTimeout(onClose, 1800);
    } catch (err) {
      toast.error(`Gagal membuat alert: ${(err as Error).message}`);
      setStatus('idle');
    }
  }

  const labelCls = 'font-mono text-[10px] uppercase tracking-widest text-ink-400';
  const inputCls = 'mt-1.5 w-full rounded-lg border border-midnight-700/15 bg-cream-100/60 px-3 py-2.5 font-display text-base text-midnight-700 placeholder:text-ink-400/55 placeholder:italic focus:border-amber-400 focus:bg-cream-50 focus:outline-none focus:ring-2 focus:ring-amber-400/30';
  const airportInputCls = 'w-full rounded-lg border border-midnight-700/15 bg-cream-100/60 px-3 py-2.5 font-display text-base text-midnight-700 placeholder:text-ink-400/55 placeholder:italic focus:border-amber-400 focus:bg-cream-50 focus:outline-none focus:ring-2 focus:ring-amber-400/30';
  const monoInput = 'mt-1.5 w-full rounded-lg border border-midnight-700/15 bg-cream-100/60 px-3 py-2.5 font-mono text-sm uppercase tracking-wider text-midnight-700 placeholder:text-ink-400/55 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-midnight-700/55 p-4 backdrop-blur-sm animate-fade-in">
      <div className="pass-card max-h-[90vh] w-full max-w-lg overflow-y-auto bg-cream-50">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-midnight-700/10 bg-cream-50/95 px-6 py-5 backdrop-blur">
          <div>
            <p className={labelCls}>No. 01 - Sinyal Harga</p>
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
              Sinyal {tripType === 'ROUND_TRIP' ? 'PP ' : ''}akan dikirim ke {phoneNumber}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6">
            <div>
              <label className={labelCls}>Tipe Tiket</label>
              <div className="mt-1.5 inline-flex rounded-full border border-midnight-700/10 bg-cream-100/70 p-1">
                <TripTypeButton
                  active={tripType === 'ONE_WAY'}
                  onClick={() => handleTripTypeChange('ONE_WAY')}
                >
                  Sekali Jalan
                </TripTypeButton>
                <TripTypeButton
                  active={tripType === 'ROUND_TRIP'}
                  onClick={() => handleTripTypeChange('ROUND_TRIP')}
                >
                  Pulang Pergi
                </TripTypeButton>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Dari</label>
                <div className="mt-1.5">
                  <AirportAutocomplete
                    value={origin}
                    selectedAirport={originAirport}
                    placeholder="Ketik kota asal"
                    onSelect={(airport) => {
                      setOrigin(airport.iataCode);
                      setOriginAirport(airport);
                    }}
                    onClear={() => {
                      setOrigin('');
                      setOriginAirport(null);
                    }}
                    inputClassName={airportInputCls}
                  />
                </div>
              </div>
              <div>
                <label className={labelCls}>Ke</label>
                <div className="mt-1.5">
                  <AirportAutocomplete
                    value={destination}
                    selectedAirport={destinationAirport}
                    placeholder="Ketik kota tujuan"
                    onSelect={(airport) => {
                      setDestination(airport.iataCode);
                      setDestinationAirport(airport);
                    }}
                    onClear={() => {
                      setDestination('');
                      setDestinationAirport(null);
                    }}
                    inputClassName={airportInputCls}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Berangkat dari</label>
                <input
                  type="date"
                  value={dateFrom}
                  min={today}
                  onChange={(e) => {
                    const nextDateFrom = e.target.value;
                    const nextDateTo = dateTo < nextDateFrom ? nextDateFrom : dateTo;
                    setDateFrom(nextDateFrom);
                    if (nextDateTo !== dateTo) setDateTo(nextDateTo);
                    if (returnDate && returnDate < nextDateTo) setReturnDate('');
                  }}
                  className={inputCls}
                  required
                />
              </div>
              <div>
                <label className={labelCls}>Berangkat sampai</label>
                <input
                  type="date"
                  value={dateTo}
                  min={dateFrom}
                  onChange={(e) => {
                    const nextDateTo = e.target.value;
                    setDateTo(nextDateTo);
                    if (returnDate && returnDate < nextDateTo) setReturnDate('');
                  }}
                  className={inputCls}
                  required
                />
              </div>
              {tripType === 'ROUND_TRIP' && (
                <div className="col-span-2">
                  <label className={labelCls}>Pulang</label>
                  <input
                    type="date"
                    value={returnDate}
                    min={dateTo || dateFrom || today}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className={inputCls}
                    required
                  />
                </div>
              )}
            </div>

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

            <div>
              <label className={labelCls}>Beri tahu kalau harga &lt;=</label>
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
                sekitar {formatIDR(maxPrice)}
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
                  Mengaktifkan...
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

function TripTypeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'rounded-full px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-widest transition-all',
        active
          ? 'bg-midnight-700 text-cream-50 shadow-pass'
          : 'text-ink-400 hover:text-midnight-700',
      )}
    >
      {children}
    </button>
  );
}
