import webpush from 'web-push';

function isVapidKeyValid(value: string | undefined): boolean {
  if (!value) return false;
  if (value.includes('generate_')) return false;
  // VAPID public key 65 bytes base64url ≈ 87 chars, private 32 bytes ≈ 43 chars
  if (value.length < 40) return false;
  return true;
}

const vapidEnabled =
  isVapidKeyValid(process.env.VAPID_PUBLIC_KEY) &&
  isVapidKeyValid(process.env.VAPID_PRIVATE_KEY);

if (vapidEnabled) {
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL || 'admin@tiket.andresptr.site'}`,
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
} else {
  console.warn(
    '⚠️  WebPush DISABLED — VAPID keys belum di-generate.\n' +
      '   Jalankan: cd backend && npm run vapid:generate\n' +
      '   Lalu copy 2 baris VAPID_PUBLIC_KEY & VAPID_PRIVATE_KEY ke .env',
  );
}

export interface PushPayload {
  title: string;
  body: string;
  url: string;
  alertId: string;
}

export async function sendPushNotification(
  subscription: webpush.PushSubscription,
  payload: PushPayload,
): Promise<boolean> {
  if (!vapidEnabled) {
    console.warn('[WebPush] skipped — VAPID disabled');
    return false;
  }

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
  return process.env.VAPID_PUBLIC_KEY || '';
}

export function isWebPushEnabled(): boolean {
  return vapidEnabled;
}
