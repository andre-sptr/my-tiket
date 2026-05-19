import type {
  SearchParams,
  SearchResponse,
  Airport,
  Alert,
  CreateAlertPayload,
  PriceRecord,
} from './types';

const BASE = '/api'; // proxied by Next.js ke backend :4000

async function fetcher<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return res.json();
}

// ─── Flights ──────────────────────────────────────────────────────────────────

export async function searchFlights(params: SearchParams): Promise<SearchResponse> {
  const qs = new URLSearchParams({
    origin: params.origin,
    destination: params.destination,
    date: params.date,
    adults: String(params.adults),
    cabin: params.cabin,
    ...(params.returnDate ? { returnDate: params.returnDate } : {}),
    ...(params.airlines ? { airlines: params.airlines } : {}),
  });
  return fetcher<SearchResponse>(`/flights/search?${qs}`);
}

export async function searchAirports(keyword: string): Promise<Airport[]> {
  if (keyword.length < 2) return [];
  const qs = new URLSearchParams({ keyword });
  return fetcher<Airport[]>(`/airports?${qs}`);
}

export async function getPriceHistory(
  origin: string,
  destination: string,
  date: string,
  airlineCode?: string
): Promise<PriceRecord[]> {
  const qs = new URLSearchParams({ origin, destination, date });
  if (airlineCode) qs.set('airline', airlineCode);
  return fetcher<PriceRecord[]>(`/flights/history?${qs}`);
}

export async function getCheapestDates(
  origin: string,
  destination: string
): Promise<{ date: string; priceIdr: number }[]> {
  const qs = new URLSearchParams({ origin, destination });
  return fetcher<{ date: string; priceIdr: number }[]>(`/flights/cheapest-dates?${qs}`);
}

export async function getInspiration(origin: string) {
  const qs = new URLSearchParams({ origin });
  return fetcher<{ destination: string; cityName: string; priceIdr: number; date: string }[]>(
    `/flights/inspiration?${qs}`
  );
}

// ─── Alerts ───────────────────────────────────────────────────────────────────

export async function createAlert(payload: CreateAlertPayload): Promise<Alert> {
  return fetcher<Alert>('/alerts', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchAlerts(clientId: string): Promise<Alert[]> {
  return fetcher<Alert[]>(`/alerts?clientId=${encodeURIComponent(clientId)}`);
}

export async function deleteAlert(alertId: string): Promise<void> {
  await fetcher(`/alerts/${alertId}`, { method: 'DELETE' });
}

// ─── Push ─────────────────────────────────────────────────────────────────────

export async function getVapidPublicKey(): Promise<string> {
  const data = await fetcher<{ publicKey: string }>('/push/vapid-key');
  return data.publicKey;
}

export async function savePushSubscription(
  subscription: PushSubscriptionJSON,
  clientId: string
): Promise<void> {
  await fetcher('/push/subscribe', {
    method: 'POST',
    body: JSON.stringify({ subscription, clientId }),
  });
}
