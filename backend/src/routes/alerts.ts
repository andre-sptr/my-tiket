import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

const CreateAlertSchema = z.object({
  origin: z.string().length(3).toUpperCase(),
  destination: z.string().length(3).toUpperCase(),
  departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  airlineCode: z.string().optional(),
  flightNumber: z.string().optional(),
  cabinClass: z.enum(['ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST']).default('ECONOMY'),
  thresholdPrice: z.number().int().positive(),
  pushSubscription: z.object({
    endpoint: z.string().url(),
    keys: z.object({
      p256dh: z.string(),
      auth: z.string(),
    }),
  }),
  clientId: z.string().min(1).max(64),
});

export const alertsRouter: FastifyPluginAsync = async (fastify) => {
  // POST /api/alerts
  fastify.post('/alerts', async (req, reply) => {
    const body = CreateAlertSchema.safeParse(req.body);
    if (!body.success) {
      return reply.status(400).send({ message: 'Data tidak valid', errors: body.error.flatten() });
    }

    const { origin, destination, departureDate, airlineCode, flightNumber, cabinClass, thresholdPrice, pushSubscription, clientId } = body.data;

    const alert = await fastify.prisma.alert.create({
      data: {
        origin,
        destination,
        departureDate: new Date(departureDate),
        airlineCode: airlineCode || null,
        flightNumber: flightNumber || null,
        cabinClass,
        thresholdPrice: BigInt(thresholdPrice),
        pushSubscription,
        clientId,
      },
    });

    return {
      id: alert.id,
      origin: alert.origin,
      destination: alert.destination,
      departureDate: alert.departureDate.toISOString().split('T')[0],
      airlineCode: alert.airlineCode,
      flightNumber: alert.flightNumber,
      cabinClass: alert.cabinClass,
      thresholdPrice: Number(alert.thresholdPrice),
      isActive: alert.isActive,
      lastCheckedAt: null,
      lastPriceSeen: null,
      triggeredAt: null,
      createdAt: alert.createdAt.toISOString(),
    };
  });

  // GET /api/alerts?clientId=xxx
  fastify.get('/alerts', async (req, reply) => {
    const { clientId } = req.query as { clientId?: string };
    if (!clientId) {
      return reply.status(400).send({ message: 'clientId required' });
    }

    const alerts = await fastify.prisma.alert.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
    });

    return alerts.map((a) => ({
      id: a.id,
      origin: a.origin,
      destination: a.destination,
      departureDate: a.departureDate.toISOString().split('T')[0],
      airlineCode: a.airlineCode,
      flightNumber: a.flightNumber,
      cabinClass: a.cabinClass,
      thresholdPrice: Number(a.thresholdPrice),
      isActive: a.isActive,
      lastCheckedAt: a.lastCheckedAt?.toISOString() || null,
      lastPriceSeen: a.lastPriceSeen ? Number(a.lastPriceSeen) : null,
      triggeredAt: a.triggeredAt?.toISOString() || null,
      createdAt: a.createdAt.toISOString(),
    }));
  });

  // DELETE /api/alerts/:id
  fastify.delete('/alerts/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    try {
      await fastify.prisma.alert.delete({ where: { id } });
      return reply.status(204).send();
    } catch {
      return reply.status(404).send({ message: 'Alert tidak ditemukan' });
    }
  });
};
