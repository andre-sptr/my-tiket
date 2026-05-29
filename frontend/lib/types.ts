// ─── Shared Types ─────────────────────────────────────────────────────────────

export type FlightSource = 'DUFFEL' | 'AMADEUS' | 'LIONAIR' | 'CITILINK' | 'AIRASIA' | 'SUPERAIRJET';
export type CabinClass = 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';

export interface FlightOffer {
  id: string;
  source: FlightSource;
  airline: {
    code: string;   // 'GA', 'JT', 'QG'
    name: string;
    logo: string;   // URL logo
  };
  flightNumber: string;   // 'GA-841'
  origin: string;
  destination: string;
  departureAt: string;    // ISO datetime
  arrivalAt: string;
  durationMinutes: number;
  stops: number;
  cabinClass: CabinClass;
  priceIdr: number;
  baggage: string;        // '1 koper 20kg'
  bookingUrl: string;
}

export interface SearchParams {
  origin: string;
  destination: string;
  date: string;           // YYYY-MM-DD
  returnDate?: string;
  adults: number;
  cabin: CabinClass;
  airlines?: string;      // 'GA,JT' atau undefined = semua
}

export interface Airport {
  iataCode: string;
  name: string;
  cityName: string;
  countryCode: string;
}

export interface PriceRecord {
  scrapedAt: string;
  priceIdr: number;
  source: FlightSource;
}

export interface Alert {
  id: string;
  origin: string;
  destination: string;
  departureDateFrom: string;
  departureDateTo: string;
  returnDate: string | null;
  airlineCode: string | null;
  cabinClass: CabinClass;
  phoneNumber: string;
  phoneNumberMasked: string;
  maxPriceIdr: number;
  isActive: boolean;
  lastCheckedAt: string | null;
  lastPriceSeen: number | null;
  matchedDate: string | null;
  triggeredAt: string | null;
  createdAt: string;
}

export interface CreateAlertPayload {
  origin: string;
  destination: string;
  departureDateFrom: string;
  departureDateTo: string;
  returnDate?: string;
  airlineCode?: string;
  cabinClass: CabinClass;
  phoneNumber: string;
  maxPriceIdr: number;
  clientId: string;
}

export interface SearchResponse {
  flights: FlightOffer[];
  cached: boolean;
  sources: FlightSource[];
  fetchedAt: string;
}
