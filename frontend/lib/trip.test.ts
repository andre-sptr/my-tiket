import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildFlightSearchQuery, getTripType, isValidReturnDate } from './trip';

describe('trip search helpers', () => {
  it('detects round-trip searches from returnDate', () => {
    assert.equal(getTripType('2026-06-12'), 'ROUND_TRIP');
    assert.equal(getTripType(undefined), 'ONE_WAY');
  });

  it('adds returnDate only for round-trip searches', () => {
    const oneWay = buildFlightSearchQuery({
      origin: 'CGK',
      destination: 'DPS',
      date: '2026-06-05',
      returnDate: '2026-06-12',
      tripType: 'ONE_WAY',
      adults: 1,
      cabin: 'ECONOMY',
    });

    const roundTrip = buildFlightSearchQuery({
      origin: 'CGK',
      destination: 'DPS',
      date: '2026-06-05',
      returnDate: '2026-06-12',
      tripType: 'ROUND_TRIP',
      adults: 1,
      cabin: 'ECONOMY',
    });

    assert.equal(oneWay.has('returnDate'), false);
    assert.equal(roundTrip.get('returnDate'), '2026-06-12');
  });

  it('requires the return date to be the same day or after departure', () => {
    assert.equal(isValidReturnDate('2026-06-05', '2026-06-05'), true);
    assert.equal(isValidReturnDate('2026-06-05', '2026-06-12'), true);
    assert.equal(isValidReturnDate('2026-06-05', '2026-06-04'), false);
  });
});
