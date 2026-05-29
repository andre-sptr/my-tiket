import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CreateAlertSchema } from './alerts';

const baseAlert = {
  origin: 'CGK',
  destination: 'DPS',
  departureDateFrom: '2026-06-05',
  departureDateTo: '2026-06-07',
  cabinClass: 'ECONOMY' as const,
  phoneNumber: '081234567890',
  maxPriceIdr: 1_000_000,
  clientId: 'client-1',
};

describe('alert validation', () => {
  it('accepts round-trip alerts with returnDate after the departure window', () => {
    const parsed = CreateAlertSchema.safeParse({
      ...baseAlert,
      returnDate: '2026-06-12',
    });

    assert.equal(parsed.success, true);
  });

  it('rejects round-trip alerts when returnDate is before the last departure date', () => {
    const parsed = CreateAlertSchema.safeParse({
      ...baseAlert,
      returnDate: '2026-06-06',
    });

    assert.equal(parsed.success, false);
  });
});
