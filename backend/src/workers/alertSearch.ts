export interface AlertSearchGroupInput {
  origin: string;
  destination: string;
  cabinClass: string;
  returnDate?: Date | null;
}

export function formatOptionalDate(date?: Date | null): string | undefined {
  return date ? date.toISOString().split('T')[0] : undefined;
}

export function buildAlertSearchGroupKey(alert: AlertSearchGroupInput): string {
  return [
    alert.origin,
    alert.destination,
    alert.cabinClass,
    formatOptionalDate(alert.returnDate) || 'ONE_WAY',
  ].join(':');
}
