/**
 * WAHA (WhatsApp HTTP API) service.
 * Docs: https://waha.devlike.pro/
 *
 * Standard endpoint:
 *   POST {WAHA_URL}/api/sendText
 *   Headers: X-Api-Key: {WAHA_API_KEY}
 *   Body: { session: "BotWA", chatId: "62812xxx@c.us", text: "..." }
 */

const wahaUrl = process.env.WAHA_URL?.replace(/\/$/, '');
const wahaSession = process.env.WAHA_SESSION;
const wahaApiKey = process.env.WAHA_API_KEY;

export const wahaEnabled = !!(wahaUrl && wahaSession && wahaApiKey);

if (!wahaEnabled) {
  console.warn(
    '⚠️  WAHA DISABLED — set WAHA_URL, WAHA_SESSION, WAHA_API_KEY di .env\n' +
      '   Alert WhatsApp tidak akan terkirim sampai kredensial diisi.',
  );
}

/**
 * Normalisasi nomor HP ke format WhatsApp chatId.
 * Input bisa: 08123, +628123, 628123, 8123 → output: "628123xxxxxx@c.us"
 */
export function normalizePhoneToChatId(phone: string): string {
  let digits = phone.replace(/\D/g, ''); // hapus semua selain digit
  if (digits.startsWith('0')) digits = '62' + digits.slice(1);
  else if (digits.startsWith('8')) digits = '62' + digits;
  // Kalau sudah mulai dengan 62 atau kode negara lain, biarkan
  return `${digits}@c.us`;
}

/** Format nomor untuk tampilan: "62812xxxxxxxx" */
export function normalizePhoneToE164(phone: string): string {
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0')) digits = '62' + digits.slice(1);
  else if (digits.startsWith('8')) digits = '62' + digits;
  return digits;
}

export async function sendWhatsAppText(phone: string, text: string): Promise<boolean> {
  if (!wahaEnabled) {
    console.warn('[WAHA] skipped — disabled');
    return false;
  }

  const chatId = normalizePhoneToChatId(phone);

  try {
    const resp = await fetch(`${wahaUrl}/api/sendText`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': wahaApiKey!,
      },
      body: JSON.stringify({
        session: wahaSession,
        chatId,
        text,
      }),
    });

    if (!resp.ok) {
      const errBody = await resp.text().catch(() => '');
      console.error(`[WAHA] send failed ${resp.status}: ${errBody.slice(0, 200)}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[WAHA] network error:', (err as Error).message);
    return false;
  }
}
