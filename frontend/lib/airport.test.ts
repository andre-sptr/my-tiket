import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Airport } from './types';
import {
  formatAirportDisplay,
  formatAirportOptionDetail,
  getAirportInputValue,
  isValidAirportCode,
} from './airport';

const jakartaAirport: Airport = {
  iataCode: 'CGK',
  name: 'Soekarno-Hatta International',
  cityName: 'Jakarta',
  countryCode: 'ID',
};

describe('airport autocomplete helpers', () => {
  it('formats a selected airport as city and IATA code', () => {
    assert.equal(formatAirportDisplay(jakartaAirport), 'Jakarta (CGK)');
  });

  it('formats dropdown detail with airport name and country code', () => {
    assert.equal(formatAirportOptionDetail(jakartaAirport), 'Soekarno-Hatta International - ID');
  });

  it('keeps the typed query visible while the field is active', () => {
    assert.equal(
      getAirportInputValue({
        isActive: true,
        query: 'jak',
        selectedAirport: jakartaAirport,
        code: 'CGK',
      }),
      'jak',
    );
  });

  it('falls back to the route code when no selected airport metadata is available', () => {
    assert.equal(
      getAirportInputValue({
        isActive: false,
        query: '',
        selectedAirport: null,
        code: 'DPS',
      }),
      'DPS',
    );
  });

  it('validates normalized three-letter airport codes only', () => {
    assert.equal(isValidAirportCode('cgk'), true);
    assert.equal(isValidAirportCode('CG'), false);
    assert.equal(isValidAirportCode('JKT1'), false);
  });
});
