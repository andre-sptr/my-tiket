import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { UnifiedSearchService } from '../services/search';
import { AmadeusService } from '../services/amadeus';

const SearchQuerySchema = z.object({
  origin: z.string().length(3).toUpperCase(),
  destination: z.string().length(3).toUpperCase(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  returnDate: z.string().optional(),
  adults: z.coerce.number().int().min(1).max(9).default(1),
  cabin: z.enum(['ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST']).default('ECONOMY'),
  airlines: z.string().optional(),
});

export const flightsRouter: FastifyPluginAsync = async (fastify) => {
  // GET /api/flights/search
  fastify.get('/flights/search', async (req, reply) => {
    const query = SearchQuerySchema.safeParse(req.query);
    if (!query.success) {
      return reply.status(400).send({ message: 'Parameter tidak valid', errors: query.error.flatten() });
    }

    const service = new UnifiedSearchService(fastify.prisma, fastify.redis);
    const result = await service.search(query.data);
    return result;
  });

  // GET /api/airports?keyword=Jakarta
  fastify.get('/airports', async (req, reply) => {
    const { keyword } = req.query as { keyword?: string };
    if (!keyword || keyword.length < 2) {
      return reply.status(400).send({ message: 'keyword minimal 2 karakter' });
    }
    const amadeus = new AmadeusService(fastify.redis);
    return amadeus.searchAirports(keyword);
  });

  // GET /api/flights/history?origin=CGK&destination=SIN&date=2024-12-01&airline=GA
  fastify.get('/flights/history', async (req, reply) => {
    const { origin, destination, date, airline } = req.query as Record<string, string>;
    if (!origin || !destination || !date) {
      return reply.status(400).send({ message: 'origin, destination, date required' });
    }

    const records = await fastify.prisma.priceRecord.findMany({
      where: {
        origin: origin.toUpperCase(),
        destination: destination.toUpperCase(),
        date: new Date(date),
        ...(airline ? { airlineCode: airline.toUpperCase() } : {}),
        scrapedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // 7 hari
      },
      orderBy: { scrapedAt: 'asc' },
      select: { scrapedAt: true, priceIdr: true, source: true },
    });

    return records.map((r) => ({
      scrapedAt: r.scrapedAt.toISOString(),
      priceIdr: Number(r.priceIdr),
      source: r.source,
    }));
  });

  // GET /api/flights/cheapest-dates?origin=CGK&destination=SIN
  fastify.get('/flights/cheapest-dates', async (req, reply) => {
    const { origin, destination } = req.query as { origin?: string; destination?: string };
    if (!origin || !destination) {
      return reply.status(400).send({ message: 'origin dan destination required' });
    }
    const amadeus = new AmadeusService(fastify.redis);
    return amadeus.getCheapestDates(origin.toUpperCase(), destination.toUpperCase());
  });

  // GET /api/flights/inspiration?origin=CGK
  fastify.get('/flights/inspiration', async (req, reply) => {
    const { origin } = req.query as { origin?: string };
    if (!origin) {
      return reply.status(400).send({ message: 'origin required' });
    }
    const amadeus = new AmadeusService(fastify.redis);
    return amadeus.getInspiration(origin.toUpperCase());
  });
};
