import Amadeus from 'amadeus';
import type { Redis } from 'ioredis';
import type { FlightOffer } from './types';
import { normalizeAmadeusOffer } from './normalizer';
import { searchStaticAirports } from './airports';

const CACHE_TTL = 60 * 10; // 10 menit

// Cek apakah credentials valid (bukan placeholder dari .env.example)
function isCredentialValid(value: string | undefined): boolean {
  if (!value) return false;
  if (value.includes('your_') || value.includes('_here')) return false;
  if (value.length < 8) return false;
  return true;
}

let warnedDisabled = false;

export class AmadeusService {
  private client?: Amadeus;
  private redis: Redis;
  public readonly enabled: boolean;

  constructor(redis: Redis) {
    const clientId = process.env.AMADEUS_CLIENT_ID;
    const clientSecret = process.env.AMADEUS_CLIENT_SECRET;

    this.enabled = isCredentialValid(clientId) && isCredentialValid(clientSecret);
    this.redis = redis;

    if (this.enabled) {
      this.client = new Amadeus({
        clientId: clientId!,
        clientSecret: clientSecret!,
        hostname: (process.env.AMADEUS_HOSTNAME as 'test' | 'production') || 'test',
      });
    } else if (!warnedDisabled) {
      warnedDisabled = true;
      console.warn(
        '⚠️  Amadeus DISABLED — credentials kosong/placeholder.\n' +
          '   - Search full-service airlines tidak fungsional\n' +
          '   - Airport autocomplete pakai static list (~60 bandara)\n' +
          '   - Cheapest dates & inspiration mengembalikan []\n' +
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
    cabin: string;
    max?: number;
  }): Promise<FlightOffer[]> {
    if (!this.enabled || !this.client) return [];

    const cacheKey = `amadeus:search:${params.origin}:${params.destination}:${params.date}:${params.cabin}:${params.adults}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    try {
      const response = await this.client.shopping.flightOffersSearch.get({
        originLocationCode: params.origin,
        destinationLocationCode: params.destination,
        departureDate: params.date,
        ...(params.returnDate ? { returnDate: params.returnDate } : {}),
        adults: params.adults,
        travelClass: params.cabin,
        currencyCode: 'IDR',
        max: params.max || 30,
      });

      const offers: FlightOffer[] = (response.data || []).map(normalizeAmadeusOffer);
      await this.redis.setex(cacheKey, CACHE_TTL, JSON.stringify(offers));
      return offers;
    } catch (err: any) {
      throw new Error(`Amadeus search failed: ${err.description?.[0]?.detail || err.message}`);
    }
  }

  async confirmPrice(offer: unknown): Promise<number> {
    if (!this.enabled || !this.client) return 0;

    try {
      const response = await this.client.shopping.flightOffers.pricing.post(
        JSON.stringify({ data: { type: 'flight-offers-pricing', flightOffers: [offer] } }),
      );
      const priceStr = response.data?.flightOffers?.[0]?.price?.grandTotal;
      return priceStr ? Math.round(Number(priceStr)) : 0;
    } catch {
      return 0;
    }
  }

  async searchAirports(keyword: string) {
    // Fallback ke static list saat Amadeus disabled
    if (!this.enabled || !this.client) {
      return searchStaticAirports(keyword);
    }

    const cacheKey = `amadeus:airports:${keyword.toLowerCase()}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    try {
      const response = await this.client.referenceData.locations.get({
        keyword,
        subType: 'AIRPORT,CITY',
        page: { limit: 10 },
      });
      const results = (response.data || []).map((loc: any) => ({
        iataCode: loc.iataCode,
        name: loc.name,
        cityName: loc.address?.cityName || loc.name,
        countryCode: loc.address?.countryCode || '',
      }));
      await this.redis.setex(cacheKey, 60 * 60 * 24, JSON.stringify(results)); // 24 jam
      return results;
    } catch {
      // Kalau Amadeus error, fallback ke static juga
      return searchStaticAirports(keyword);
    }
  }

  async getCheapestDates(origin: string, destination: string) {
    if (!this.enabled || !this.client) return [];

    const cacheKey = `amadeus:cheapest:${origin}:${destination}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    try {
      const response = await this.client.shopping.flightDates.get({
        origin,
        destination,
        currencyCode: 'IDR',
      });
      const results = (response.data || []).map((d: any) => ({
        date: d.departureDate,
        priceIdr: Math.round(Number(d.price?.total || 0)),
      }));
      await this.redis.setex(cacheKey, 60 * 60 * 6, JSON.stringify(results)); // 6 jam
      return results;
    } catch {
      return [];
    }
  }

  async getInspiration(origin: string) {
    if (!this.enabled || !this.client) return [];

    const cacheKey = `amadeus:inspiration:${origin}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    try {
      const response = await this.client.shopping.flightDestinations.get({
        origin,
        currencyCode: 'IDR',
      });
      const results = (response.data || []).map((d: any) => ({
        destination: d.destination,
        cityName: d.destination,
        priceIdr: Math.round(Number(d.price?.total || 0)),
        date: d.departureDate,
      }));
      await this.redis.setex(cacheKey, 60 * 60 * 6, JSON.stringify(results));
      return results;
    } catch {
      return [];
    }
  }
}
