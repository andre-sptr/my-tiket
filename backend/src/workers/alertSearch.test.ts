import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildAlertSearchGroupKey, formatOptionalDate } from './alertSearch';

describe('alert search helpers', () => {
  it('includes returnDate in the worker group key for round-trip alerts', () => {
    const key = buildAlertSearchGroupKey({
      origin: 'CGK',
      destination: 'DPS',
      cabinClass: 'ECONOMY',
      returnDate: new Date('2026-06-12T00:00:00.000Z'),
    });

    assert.equal(key, 'CGK:DPS:ECONOMY:2026-06-12');
  });

  it('keeps one-way alerts in a separate group', () => {
    const key = buildAlertSearchGroupKey({
      origin: 'CGK',
      destination: 'DPS',
      cabinClass: 'ECONOMY',
      returnDate: null,
    });

    assert.equal(key, 'CGK:DPS:ECONOMY:ONE_WAY');
  });

  it('formats nullable dates for search params', () => {
    assert.equal(formatOptionalDate(new Date('2026-06-12T00:00:00.000Z')), '2026-06-12');
    assert.equal(formatOptionalDate(null), undefined);
  });
});
