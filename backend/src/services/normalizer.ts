import type { FlightOffer } from './types';

// Airline logo via AviationStack / avs.io (public, free for logos)
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
    ? bags.weight ? `${bags.weight} ${bags.weightUnit || 'kg'}` : `${bags.quantity || 0} koper`
    : 'Lihat ketentuan';

  // Build booking URL ke Google Flights (fallback)
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

function parseDuration(iso: string): number {
  // PT2H30M → 150 menit
  const hours = iso.match(/(\d+)H/)?.[1] || '0';
  const mins = iso.match(/(\d+)M/)?.[1] || '0';
  return parseInt(hours) * 60 + parseInt(mins);
}
