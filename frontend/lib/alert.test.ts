import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildCreateAlertPayload, isValidAlertReturnDate } from './alert';

const baseInput = {
  origin: 'CGK',
  destination: 'DPS',
  departureDateFrom: '2026-06-05',
  departureDateTo: '2026-06-05',
  returnDate: '2026-06-12',
  airlineCode: '',
  cabinClass: 'ECONOMY' as const,
  phoneNumber: '081234567890',
  maxPriceIdr: 1_000_000,
  clientId: 'client-1',
};

describe('alert helpers', () => {
  it('adds returnDate only for round-trip alerts', () => {
    const oneWay = buildCreateAlertPayload({
      ...baseInput,
      tripType: 'ONE_WAY',
    });
    const roundTrip = buildCreateAlertPayload({
      ...baseInput,
      tripType: 'ROUND_TRIP',
    });

    assert.equal('returnDate' in oneWay, false);
    assert.equal(roundTrip.returnDate, '2026-06-12');
  });

  it('validates returnDate against the last departure date in the alert window', () => {
    assert.equal(isValidAlertReturnDate('2026-06-05', '2026-06-05'), true);
    assert.equal(isValidAlertReturnDate('2026-06-05', '2026-06-12'), true);
    assert.equal(isValidAlertReturnDate('2026-06-05', '2026-06-04'), false);
  });
});
