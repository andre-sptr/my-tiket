import { Duffel } from '@duffel/api';
import type { Redis } from 'ioredis';
import type { CabinClass, FlightOffer } from './types';
import { normalizeDuffelOffer } from './normalizer';
import { searchStaticAirports } from './airports';

const CACHE_TTL = 60 * 10; // 10 menit

function isTokenValid(value: string | undefined): boolean {
  if (!value) return false;
  if (value.includes('your_') || value.includes('_here')) return false;
  // Duffel token format: "duffel_test_xxx" atau "duffel_live_xxx"
  if (!value.startsWith('duffel_')) return false;
  return value.length >= 30;
}

let warnedDisabled = false;

function cabinToDuffel(c: CabinClass): 'economy' | 'premium_economy' | 'business' | 'first' {
  switch (c) {
    case 'BUSINESS':
      return 'business';
    case 'FIRST':
      return 'first';
    case 'PREMIUM_ECONOMY':
      return 'premium_economy';
    default:
      return 'economy';
  }
}

export class DuffelService {
  private client?: Duffel;
  private redis: Redis;
  public readonly enabled: boolean;

  constructor(redis: Redis) {
    const token = process.env.DUFFEL_ACCESS_TOKEN;

    this.enabled = isTokenValid(token);
    this.redis = redis;

    if (this.enabled) {
      this.client = new Duffel({ token: token! });
    } else if (!warnedDisabled) {
      warnedDisabled = true;
      console.warn(
        '⚠️  Duffel DISABLED — DUFFEL_ACCESS_TOKEN kosong/placeholder.\n' +
          '   Daftar gratis di https://duffel.com → Dashboard → API Tokens\n' +
          '   Copy token "duffel_test_..." ke backend/.env\n' +
          '   - Search full-service airlines tidak fungsional sampai token diisi\n' +
          '   - Airport autocomplete pakai static list (~60 bandara)\n' +
          '   - LCC scrapers (Lion Air, Citilink, AirAsia, SAJ) tetap jalan',
      );
    }
  }

  async searchFlights(params: {
    origin: string;
    destination: string;
    date: string;
    returnDate?: string;
    adults: number;
    cabin: CabinClass;
    max?: number;
  }): Promise<FlightOffer[]> {
    if (!this.enabled || !this.client) return [];

    const cacheKey = `duffel:search:${params.origin}:${params.destination}:${params.date}:${params.cabin}:${params.adults}${params.returnDate ? `:${params.returnDate}` : ''}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    try {
      const slices: any[] = [
        {
          origin: params.origin,
          destination: params.destination,
          departure_date: params.date,
        },
      ];
      if (params.returnDate) {
        slices.push({
          origin: params.destination,
          destination: params.origin,
          departure_date: params.returnDate,
        });
      }

      const passengers = Array.from({ length: params.adults }, () => ({ type: 'adult' as const }));

      const offerRequest = await this.client.offerRequests.create({
        slices,
        passengers,
        cabin_class: cabinToDuffel(params.cabin),
        return_offers: false, // pakai listing terpisah agar bisa sort + limit
      });

      const offersResp = await this.client.offers.list({
        offer_request_id: offerRequest.data.id,
        sort: 'total_amount',
        limit: params.max || 30,
      });

      const offers = (offersResp.data || []).map(normalizeDuffelOffer);
      await this.redis.setex(cacheKey, CACHE_TTL, JSON.stringify(offers));
      return offers;
    } catch (err: any) {
      const detail =
        err?.errors?.[0]?.message ||
        err?.errors?.[0]?.title ||
        err?.message ||
        'unknown';
      throw new Error(`Duffel search failed: ${detail}`);
    }
  }

  async searchAirports(keyword: string) {
    if (!this.enabled || !this.client) {
      return searchStaticAirports(keyword);
    }

    const cacheKey = `duffel:places:${keyword.toLowerCase()}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    try {
      const resp = await this.client.suggestions.list({ query: keyword } as any);
      const results = (resp.data || [])
        .filter((p: any) => p.iata_code || p.iata_city_code)
        .map((p: any) => ({
          iataCode: p.iata_code || p.iata_city_code,
          name: p.name,
          cityName: p.city_name || p.name,
          countryCode: p.iata_country_code || '',
        }))
        .slice(0, 10);

      // Kalau Duffel return kosong, fallback ke static
      const final = results.length > 0 ? results : searchStaticAirports(keyword);
      await this.redis.setex(cacheKey, 60 * 60 * 24, JSON.stringify(final));
      return final;
    } catch {
      return searchStaticAirports(keyword);
    }
  }

  // Cheapest dates: Duffel tidak punya endpoint khusus untuk ini.
  // Stub aman — return [] biar konsumer tidak crash.
  async getCheapestDates(_origin: string, _destination: string) {
    return [] as Array<{ date: string; priceIdr: number }>;
  }

  // Inspiration: Duffel juga tidak punya endpoint ini.
  async getInspiration(_origin: string) {
    return [] as Array<{ destination: string; cityName: string; priceIdr: number; date: string }>;
  }
}
