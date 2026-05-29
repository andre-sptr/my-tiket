import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { normalizePhoneToE164, sendWhatsAppText, wahaEnabled } from '../services/waha';

const CreateAlertSchema = z
  .object({
    origin: z.string().length(3).toUpperCase(),
    destination: z.string().length(3).toUpperCase(),
    departureDateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    departureDateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    airlineCode: z.string().min(1).max(10).optional().nullable(),
    cabinClass: z.enum(['ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST']).default('ECONOMY'),
    phoneNumber: z.string().min(8).max(20),
    maxPriceIdr: z.number().int().positive(),
    clientId: z.string().min(1).max(64),
  })
  .refine((d) => d.departureDateFrom <= d.departureDateTo, {
    message: 'departureDateTo harus ≥ departureDateFrom',
    path: ['departureDateTo'],
  });

export const alertsRouter: FastifyPluginAsync = async (fastify) => {
  // POST /api/alerts
  fastify.post('/alerts', async (req, reply) => {
    const body = CreateAlertSchema.safeParse(req.body);
    if (!body.success) {
      return reply.status(400).send({ message: 'Data tidak valid', errors: body.error.flatten() });
    }

    const {
      origin,
      destination,
      departureDateFrom,
      departureDateTo,
      airlineCode,
      cabinClass,
      phoneNumber,
      maxPriceIdr,
      clientId,
    } = body.data;

    const phoneE164 = normalizePhoneToE164(phoneNumber);
    if (phoneE164.length < 10 || phoneE164.length > 15) {
      return reply.status(400).send({ message: 'Format nomor HP tidak valid' });
    }

    const alert = await fastify.prisma.alert.create({
      data: {
        origin,
        destination,
        departureDateFrom: new Date(departureDateFrom),
        departureDateTo: new Date(departureDateTo),
        airlineCode: airlineCode || null,
        cabinClass,
        phoneNumber: phoneE164,
        maxPriceIdr: BigInt(maxPriceIdr),
        clientId,
      },
    });

    return serializeAlert(alert);
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

    return alerts.map(serializeAlert);
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

  // POST /api/alerts/test-whatsapp — kirim pesan test, debug only
  fastify.post('/alerts/test-whatsapp', async (req, reply) => {
    const schema = z.object({ phoneNumber: z.string().min(8).max(20) });
    const body = schema.safeParse(req.body);
    if (!body.success) {
      return reply.status(400).send({ message: 'phoneNumber required' });
    }
    if (!wahaEnabled) {
      return reply.status(503).send({ message: 'WAHA tidak dikonfigurasi' });
    }
    const ok = await sendWhatsAppText(
      body.data.phoneNumber,
      'Test dari myTiket — WAHA terhubung. 🎫',
    );
    return { ok };
  });
};

function maskPhone(phone: string): string {
  // 6281234567890 → 628****7890
  if (phone.length < 8) return phone;
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
}

function serializeAlert(a: any) {
  return {
    id: a.id,
    origin: a.origin,
    destination: a.destination,
    departureDateFrom: a.departureDateFrom.toISOString().split('T')[0],
    departureDateTo: a.departureDateTo.toISOString().split('T')[0],
    airlineCode: a.airlineCode,
    cabinClass: a.cabinClass,
    phoneNumber: a.phoneNumber,
    phoneNumberMasked: maskPhone(a.phoneNumber),
    maxPriceIdr: Number(a.maxPriceIdr),
    isActive: a.isActive,
    lastCheckedAt: a.lastCheckedAt?.toISOString() || null,
    lastPriceSeen: a.lastPriceSeen ? Number(a.lastPriceSeen) : null,
    matchedDate: a.matchedDate ? a.matchedDate.toISOString().split('T')[0] : null,
    triggeredAt: a.triggeredAt?.toISOString() || null,
    createdAt: a.createdAt.toISOString(),
  };
}
