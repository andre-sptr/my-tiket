import type { CabinClass } from './types';

export type TripType = 'ONE_WAY' | 'ROUND_TRIP';

export function getTripType(returnDate?: string | null): TripType {
  return returnDate ? 'ROUND_TRIP' : 'ONE_WAY';
}

export function isValidReturnDate(date: string, returnDate: string): boolean {
  return returnDate >= date;
}

export function buildFlightSearchQuery({
  origin,
  destination,
  date,
  returnDate,
  tripType,
  adults,
  cabin,
}: {
  origin: string;
  destination: string;
  date: string;
  returnDate?: string;
  tripType: TripType;
  adults: number;
  cabin: CabinClass;
}): URLSearchParams {
  return new URLSearchParams({
    origin,
    destination,
    date,
    adults: String(adults),
    cabin,
    ...(tripType === 'ROUND_TRIP' && returnDate ? { returnDate } : {}),
  });
}
