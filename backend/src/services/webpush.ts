import webpush from 'web-push';

webpush.setVapidDetails(
  `mailto:${process.env.VAPID_EMAIL || 'admin@tiket.andresptr.site'}`,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export interface PushPayload {
  title: string;
  body: string;
  url: string;
  alertId: string;
}

export async function sendPushNotification(
  subscription: webpush.PushSubscription,
  payload: PushPayload
): Promise<boolean> {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    return true;
  } catch (err: any) {
    // 410 = subscription expired/invalid
    if (err.statusCode === 410 || err.statusCode === 404) {
      return false; // caller should deactivate alert
    }
    console.error('[WebPush] Send failed:', err.message);
    throw err;
  }
}

export function getVapidPublicKey(): string {
  return process.env.VAPID_PUBLIC_KEY!;
}
