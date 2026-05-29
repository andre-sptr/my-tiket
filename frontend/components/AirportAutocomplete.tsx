'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, MapPin, Search } from 'lucide-react';
import { clsx } from 'clsx';
import { searchAirports } from '@/lib/api';
import type { Airport } from '@/lib/types';
import {
  formatAirportDisplay,
  formatAirportOptionDetail,
  getAirportInputValue,
} from '@/lib/airport';

interface Props {
  value: string;
  selectedAirport: Airport | null;
  placeholder: string;
  onSelect: (airport: Airport) => void;
  onClear: () => void;
  inputClassName?: string;
  panelClassName?: string;
}

export default function AirportAutocomplete({
  value,
  selectedAirport,
  placeholder,
  onSelect,
  onClear,
  inputClassName,
  panelClassName,
}: Props) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const searchQuery = query.trim();

  const {
    data: results = [],
    isFetching,
    isError,
  } = useQuery({
    queryKey: ['airports', searchQuery],
    queryFn: () => searchAirports(searchQuery),
    enabled: isOpen && searchQuery.length >= 2,
  });

  function handleFocus() {
    setIsOpen(true);
    setQuery((current) => current || selectedAirport?.cityName || value);
  }

  function handleChange(nextValue: string) {
    setQuery(nextValue);
    setIsOpen(true);
    if (value || selectedAirport) onClear();
  }

  function handleInput(event: React.FormEvent<HTMLInputElement>) {
    const nextValue = event.currentTarget.value;
    if (nextValue !== query) {
      handleChange(nextValue);
    }
  }

  function handleSelect(airport: Airport) {
    onSelect(airport);
    setQuery(airport.cityName);
    setIsOpen(false);
  }

  const inputValue = getAirportInputValue({
    isActive: isOpen,
    query,
    selectedAirport,
    code: value,
  });

  const showPanel = isOpen && (searchQuery.length > 0 || results.length > 0);

  return (
    <div
      className="relative"
      onBlur={(event) => {
        const nextFocus = event.relatedTarget as Node | null;
        if (!event.currentTarget.contains(nextFocus)) {
          setIsOpen(false);
        }
      }}
    >
      <div className="relative">
        <input
          className={clsx(inputClassName || 'input-editorial', 'pr-8')}
          placeholder={placeholder}
          value={inputValue}
          onInput={handleInput}
          onFocus={handleFocus}
          autoComplete="off"
          required
        />
        <Search className="pointer-events-none absolute right-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
      </div>

      {showPanel && (
        <div
          className={clsx(
            'absolute left-0 right-0 top-full z-40 mt-3 max-h-72 overflow-auto rounded-xl border border-midnight-700/10 bg-cream-50 shadow-pass',
            panelClassName,
          )}
        >
          {searchQuery.length < 2 && (
            <DropdownState text="Ketik minimal 2 huruf kota atau kode bandara." />
          )}

          {searchQuery.length >= 2 && isFetching && (
            <DropdownState text="Mencari bandara..." loading />
          )}

          {searchQuery.length >= 2 && isError && !isFetching && (
            <DropdownState text="Bandara belum bisa dimuat. Coba lagi." />
          )}

          {searchQuery.length >= 2 && !isFetching && !isError && results.length === 0 && (
            <DropdownState text="Tidak ada bandara ditemukan." />
          )}

          {results.map((airport) => (
            <button
              key={airport.iataCode}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => handleSelect(airport)}
              className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-midnight-700/5 px-4 py-3 text-left last:border-b-0 hover:bg-cream-100 focus:bg-cream-100 focus:outline-none"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-50 text-amber-500">
                <MapPin className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block truncate font-display text-base italic text-midnight-700">
                  {formatAirportDisplay(airport)}
                </span>
                <span className="block truncate font-mono text-[9px] uppercase tracking-widest text-ink-400">
                  {formatAirportOptionDetail(airport)}
                </span>
              </span>
              <span className="rounded-full border border-midnight-700/10 px-2 py-1 font-mono text-xs font-bold text-amber-500">
                {airport.iataCode}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function DropdownState({ text, loading = false }: { text: string; loading?: boolean }) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-ink-400">
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-500" /> : null}
      {text}
    </div>
  );
}
