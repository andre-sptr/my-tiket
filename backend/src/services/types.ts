export type FlightSource = 'AMADEUS' | 'LIONAIR' | 'CITILINK' | 'AIRASIA' | 'SUPERAIRJET';
export type CabinClass = 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';

export interface FlightOffer {
  id: string;
  source: FlightSource;
  airline: {
    code: string;
    name: string;
    logo: string;
  };
  flightNumber: string;
  origin: string;
  destination: string;
  departureAt: string;  // ISO datetime
  arrivalAt: string;
  durationMinutes: number;
  stops: number;
  cabinClass: CabinClass;
  priceIdr: number;
  baggage: string;
  bookingUrl: string;
  rawOffer?: unknown;
}

export interface SearchParams {
  origin: string;
  destination: string;
  date: string;
  returnDate?: string;
  adults: number;
  cabin: CabinClass;
  airlines?: string; // 'GA,JT' atau undefined = semua
}
