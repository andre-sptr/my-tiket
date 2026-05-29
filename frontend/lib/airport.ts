import type { Airport } from './types';

export function formatAirportDisplay(airport: Airport): string {
  return `${airport.cityName} (${airport.iataCode})`;
}

export function formatAirportOptionDetail(airport: Airport): string {
  return [airport.name, airport.countryCode].filter(Boolean).join(' - ');
}

export function getAirportInputValue({
  isActive,
  query,
  selectedAirport,
  code,
}: {
  isActive: boolean;
  query: string;
  selectedAirport: Airport | null;
  code: string;
}): string {
  if (isActive) return query;
  if (selectedAirport) return formatAirportDisplay(selectedAirport);
  return code;
}

export function isValidAirportCode(code: string): boolean {
  return /^[A-Z]{3}$/.test(code.trim().toUpperCase());
}
