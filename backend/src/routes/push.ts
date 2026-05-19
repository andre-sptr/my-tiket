import type { FastifyPluginAsync } from 'fastify';
import { getVapidPublicKey } from '../services/webpush';

export const pushRouter: FastifyPluginAsync = async (fastify) => {
  // GET /api/push/vapid-key
  fastify.get('/push/vapid-key', async () => {
    return { publicKey: getVapidPublicKey() };
  });

  // POST /api/push/subscribe
  fastify.post('/push/subscribe', async (req, reply) => {
    const { subscription, clientId } = req.body as {
      subscription: { endpoint: string; keys: { p256dh: string; auth: string } };
      clientId: string;
    };

    if (!subscription?.endpoint || !clientId) {
      return reply.status(400).send({ message: 'subscription dan clientId diperlukan' });
    }

    // Subscription sudah di-embed langsung ke alert saat create
    // Endpoint ini untuk future use (multi-device, pre-registration)
    return { ok: true };
  });
};
