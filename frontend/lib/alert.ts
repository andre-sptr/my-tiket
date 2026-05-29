import type { CabinClass, CreateAlertPayload } from './types';
import type { TripType } from './trip';

interface BuildCreateAlertPayloadInput {
  origin: string;
  destination: string;
  departureDateFrom: string;
  departureDateTo: string;
  returnDate?: string;
  tripType: TripType;
  airlineCode?: string;
  cabinClass: CabinClass;
  phoneNumber: string;
  maxPriceIdr: number;
  clientId: string;
}

export function isValidAlertReturnDate(departureDateTo: string, returnDate: string): boolean {
  return returnDate >= departureDateTo;
}

export function buildCreateAlertPayload({
  origin,
  destination,
  departureDateFrom,
  departureDateTo,
  returnDate,
  tripType,
  airlineCode,
  cabinClass,
  phoneNumber,
  maxPriceIdr,
  clientId,
}: BuildCreateAlertPayloadInput): CreateAlertPayload {
  const normalizedAirline = airlineCode?.trim().toUpperCase();

  return {
    origin: origin.toUpperCase(),
    destination: destination.toUpperCase(),
    departureDateFrom,
    departureDateTo,
    ...(tripType === 'ROUND_TRIP' && returnDate ? { returnDate } : {}),
    airlineCode: normalizedAirline || undefined,
    cabinClass,
    phoneNumber,
    maxPriceIdr,
    clientId,
  };
}
