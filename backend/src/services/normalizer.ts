import type { CabinClass, FlightOffer } from './types';

// Airline logo via avs.io (public, free for logos)
function getAirlineLogo(code: string): string {
  return `https://pics.avs.io/60/60/${code}.png`;
}

// Airline names map (extend sesuai kebutuhan)
const AIRLINE_NAMES: Record<string, string> = {
  GA: 'Garuda Indonesia',
  ID: 'Batik Air',
  SJ: 'Sriwijaya Air',
  IU: 'Super Air Jet',
  QG: 'Citilink',
  JT: 'Lion Air',
  QZ: 'AirAsia Indonesia',
  SQ: 'Singapore Airlines',
  MH: 'Malaysia Airlines',
  AK: 'AirAsia Malaysia',
  FD: 'Thai AirAsia',
  TG: 'Thai Airways',
  CX: 'Cathay Pacific',
  EK: 'Emirates',
  QR: 'Qatar Airways',
};

// FX table — Duffel returns offer.total_currency in airline's native currency.
// Static rates untuk konversi cepat ke IDR. TODO: ganti dengan FX API real-time
// kalau perlu akurasi tinggi.
const FX_TO_IDR: Record<string, number> = {
  IDR: 1,
  USD: 16100,
  EUR: 17800,
  GBP: 20600,
  SGD: 12000,
  MYR: 3700,
  THB: 460,
  JPY: 105,
  CNY: 2230,
  HKD: 2060,
  AUD: 10650,
  AED: 4380,
  SAR: 4290,
};

function convertToIdr(amount: string, currency: string): number {
  const n = Number(amount);
  if (!Number.isFinite(n)) return 0;
  const rate = FX_TO_IDR[currency.toUpperCase()];
  if (rate === undefined) return Math.round(n * 16000); // fallback: assume USD-ish
  return Math.round(n * rate);
}

function parseDuration(iso: string): number {
  // PT2H30M → 150 menit
  const hours = iso.match(/(\d+)H/)?.[1] || '0';
  const mins = iso.match(/(\d+)M/)?.[1] || '0';
  return parseInt(hours) * 60 + parseInt(mins);
}

// ─── Duffel ─────────────────────────────────────────────────
type DuffelCabin = 'economy' | 'premium_economy' | 'business' | 'first';

function duffelCabinToInternal(c?: string): CabinClass {
  switch (c as DuffelCabin) {
    case 'business':
      return 'BUSINESS';
    case 'first':
      return 'FIRST';
    case 'premium_economy':
      return 'PREMIUM_ECONOMY';
    default:
      return 'ECONOMY';
  }
}

function formatDuffelBaggage(seg: any): string {
  const bags = seg?.passengers?.[0]?.baggages || [];
  if (!Array.isArray(bags) || bags.length === 0) return 'Lihat ketentuan';
  const parts: string[] = [];
  for (const b of bags) {
    if (b.type === 'checked' && b.quantity > 0) parts.push(`${b.quantity} koper`);
    if (b.type === 'carry_on' && b.quantity > 0) parts.push(`${b.quantity} cabin`);
  }
  return parts.length > 0 ? parts.join(' + ') : 'Lihat ketentuan';
}

export function normalizeDuffelOffer(offer: any): FlightOffer {
  const slice = offer.slices?.[0];
  const segments = slice?.segments || [];
  const firstSeg = segments[0];
  const lastSeg = segments[segments.length - 1];

  const carrier = firstSeg?.marketing_carrier || firstSeg?.operating_carrier || {};
  const carrierCode: string = carrier.iata_code || '';
  const carrierName: string = AIRLINE_NAMES[carrierCode] || carrier.name || carrierCode;
  const flightNumStr = firstSeg?.marketing_carrier_flight_number || firstSeg?.operating_carrier_flight_number || '';

  const durationStr = slice?.duration || firstSeg?.duration || 'PT0H';
  const durationMinutes = parseDuration(durationStr);

  const priceIdr = convertToIdr(offer.total_amount || '0', offer.total_currency || 'USD');

  const baggage = formatDuffelBaggage(firstSeg);

  const originIata = firstSeg?.origin?.iata_code || slice?.origin?.iata_code || '';
  const destinationIata = lastSeg?.destination?.iata_code || slice?.destination?.iata_code || '';
  const depDate = firstSeg?.departing_at?.split('T')[0] || '';

  // Booking URL: Duffel offers tidak punya deeplink ke airline; fallback ke Google Flights
  const bookingUrl = `https://www.google.com/travel/flights?q=${carrierCode}+flights+${originIata}+${destinationIata}+${depDate}`;

  // Ambil cabin class dari segment pertama, fallback economy
  const segCabin =
    firstSeg?.passengers?.[0]?.cabin_class ||
    firstSeg?.passengers?.[0]?.cabin?.name ||
    'economy';

  return {
    id: offer.id,
    source: 'DUFFEL',
    airline: {
      code: carrierCode,
      name: carrierName,
      logo: getAirlineLogo(carrierCode),
    },
    flightNumber: `${carrierCode}-${flightNumStr}`,
    origin: originIata,
    destination: destinationIata,
    departureAt: firstSeg?.departing_at || '',
    arrivalAt: lastSeg?.arriving_at || '',
    durationMinutes,
    stops: Math.max(0, segments.length - 1),
    cabinClass: duffelCabinToInternal(segCabin),
    priceIdr,
    baggage,
    bookingUrl,
    rawOffer: offer,
  };
}

// ─── Amadeus (legacy, dipertahankan utk historical data) ───
export function normalizeAmadeusOffer(offer: any): FlightOffer {
  const itinerary = offer.itineraries?.[0];
  const segments = itinerary?.segments || [];
  const firstSeg = segments[0];
  const lastSeg = segments[segments.length - 1];

  const carrierCode = firstSeg?.carrierCode || '';
  const flightNum = `${carrierCode}-${firstSeg?.number || ''}`;
  const durationStr = itinerary?.duration || 'PT0H';
  const durationMinutes = parseDuration(durationStr);

  const priceStr = offer.price?.grandTotal || offer.price?.total || '0';
  const priceIdr = Math.round(Number(priceStr));

  const bags = offer.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.includedCheckedBags;
  const baggage = bags
    ? bags.weight
      ? `${bags.weight} ${bags.weightUnit || 'kg'}`
      : `${bags.quantity || 0} koper`
    : 'Lihat ketentuan';

  const depDate = firstSeg?.departure?.at?.split('T')[0] || '';
  const bookingUrl = `https://www.google.com/travel/flights?q=${carrierCode}+flights+${firstSeg?.departure?.iataCode}+${lastSeg?.arrival?.iataCode}+${depDate}`;

  return {
    id: offer.id,
    source: 'AMADEUS',
    airline: {
      code: carrierCode,
      name: AIRLINE_NAMES[carrierCode] || carrierCode,
      logo: getAirlineLogo(carrierCode),
    },
    flightNumber: flightNum,
    origin: firstSeg?.departure?.iataCode || '',
    destination: lastSeg?.arrival?.iataCode || '',
    departureAt: firstSeg?.departure?.at || '',
    arrivalAt: lastSeg?.arrival?.at || '',
    durationMinutes,
    stops: segments.length - 1,
    cabinClass: (offer.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.cabin as any) || 'ECONOMY',
    priceIdr,
    baggage,
    bookingUrl,
    rawOffer: offer,
  };
}
