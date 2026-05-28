// Static airport list — fallback saat Amadeus disabled
// Sumber: IATA codes (https://www.iata.org/en/publications/directories/code-search/)
// Coverage: bandara utama Indonesia + ASEAN + beberapa hub internasional

export interface AirportEntry {
  iataCode: string;
  name: string;
  cityName: string;
  countryCode: string;
}

export const STATIC_AIRPORTS: AirportEntry[] = [
  // ─── Indonesia ──────────────────────────────────────────
  { iataCode: 'CGK', name: 'Soekarno-Hatta International', cityName: 'Jakarta', countryCode: 'ID' },
  { iataCode: 'HLP', name: 'Halim Perdanakusuma', cityName: 'Jakarta', countryCode: 'ID' },
  { iataCode: 'DPS', name: 'Ngurah Rai International', cityName: 'Denpasar', countryCode: 'ID' },
  { iataCode: 'SUB', name: 'Juanda International', cityName: 'Surabaya', countryCode: 'ID' },
  { iataCode: 'KNO', name: 'Kualanamu International', cityName: 'Medan', countryCode: 'ID' },
  { iataCode: 'UPG', name: 'Sultan Hasanuddin International', cityName: 'Makassar', countryCode: 'ID' },
  { iataCode: 'BDO', name: 'Husein Sastranegara', cityName: 'Bandung', countryCode: 'ID' },
  { iataCode: 'JOG', name: 'Adi Sutjipto', cityName: 'Yogyakarta', countryCode: 'ID' },
  { iataCode: 'YIA', name: 'Yogyakarta International', cityName: 'Yogyakarta', countryCode: 'ID' },
  { iataCode: 'SOC', name: 'Adi Soemarmo', cityName: 'Solo', countryCode: 'ID' },
  { iataCode: 'SRG', name: 'Achmad Yani International', cityName: 'Semarang', countryCode: 'ID' },
  { iataCode: 'MLG', name: 'Abdul Rachman Saleh', cityName: 'Malang', countryCode: 'ID' },
  { iataCode: 'BPN', name: 'Sultan Aji Muhammad Sulaiman', cityName: 'Balikpapan', countryCode: 'ID' },
  { iataCode: 'BTH', name: 'Hang Nadim International', cityName: 'Batam', countryCode: 'ID' },
  { iataCode: 'PKU', name: 'Sultan Syarif Kasim II', cityName: 'Pekanbaru', countryCode: 'ID' },
  { iataCode: 'PDG', name: 'Minangkabau International', cityName: 'Padang', countryCode: 'ID' },
  { iataCode: 'PLM', name: 'Sultan Mahmud Badaruddin II', cityName: 'Palembang', countryCode: 'ID' },
  { iataCode: 'PNK', name: 'Supadio', cityName: 'Pontianak', countryCode: 'ID' },
  { iataCode: 'BJW', name: 'Soa', cityName: 'Bajawa', countryCode: 'ID' },
  { iataCode: 'LOP', name: 'Lombok International', cityName: 'Lombok', countryCode: 'ID' },
  { iataCode: 'BDJ', name: 'Syamsudin Noor', cityName: 'Banjarmasin', countryCode: 'ID' },
  { iataCode: 'AMQ', name: 'Pattimura', cityName: 'Ambon', countryCode: 'ID' },
  { iataCode: 'DJJ', name: 'Sentani', cityName: 'Jayapura', countryCode: 'ID' },
  { iataCode: 'MDC', name: 'Sam Ratulangi', cityName: 'Manado', countryCode: 'ID' },
  { iataCode: 'KOE', name: 'El Tari', cityName: 'Kupang', countryCode: 'ID' },
  { iataCode: 'TIM', name: 'Mozes Kilangin', cityName: 'Timika', countryCode: 'ID' },
  { iataCode: 'LBJ', name: 'Komodo', cityName: 'Labuan Bajo', countryCode: 'ID' },
  { iataCode: 'TKG', name: 'Radin Inten II', cityName: 'Lampung', countryCode: 'ID' },
  { iataCode: 'BTJ', name: 'Sultan Iskandar Muda', cityName: 'Banda Aceh', countryCode: 'ID' },

  // ─── Singapore / Malaysia ─────────────────────────────
  { iataCode: 'SIN', name: 'Changi International', cityName: 'Singapore', countryCode: 'SG' },
  { iataCode: 'KUL', name: 'Kuala Lumpur International', cityName: 'Kuala Lumpur', countryCode: 'MY' },
  { iataCode: 'PEN', name: 'Penang International', cityName: 'Penang', countryCode: 'MY' },
  { iataCode: 'JHB', name: 'Senai International', cityName: 'Johor Bahru', countryCode: 'MY' },
  { iataCode: 'BKI', name: 'Kota Kinabalu International', cityName: 'Kota Kinabalu', countryCode: 'MY' },

  // ─── ASEAN lain ──────────────────────────────────────
  { iataCode: 'BKK', name: 'Suvarnabhumi', cityName: 'Bangkok', countryCode: 'TH' },
  { iataCode: 'DMK', name: 'Don Mueang International', cityName: 'Bangkok', countryCode: 'TH' },
  { iataCode: 'HKT', name: 'Phuket International', cityName: 'Phuket', countryCode: 'TH' },
  { iataCode: 'MNL', name: 'Ninoy Aquino International', cityName: 'Manila', countryCode: 'PH' },
  { iataCode: 'CEB', name: 'Mactan-Cebu International', cityName: 'Cebu', countryCode: 'PH' },
  { iataCode: 'SGN', name: 'Tan Son Nhat International', cityName: 'Ho Chi Minh City', countryCode: 'VN' },
  { iataCode: 'HAN', name: 'Noi Bai International', cityName: 'Hanoi', countryCode: 'VN' },
  { iataCode: 'PNH', name: 'Phnom Penh International', cityName: 'Phnom Penh', countryCode: 'KH' },
  { iataCode: 'RGN', name: 'Yangon International', cityName: 'Yangon', countryCode: 'MM' },

  // ─── Asia (hub umum) ─────────────────────────────────
  { iataCode: 'HKG', name: 'Hong Kong International', cityName: 'Hong Kong', countryCode: 'HK' },
  { iataCode: 'TPE', name: 'Taoyuan International', cityName: 'Taipei', countryCode: 'TW' },
  { iataCode: 'NRT', name: 'Narita International', cityName: 'Tokyo', countryCode: 'JP' },
  { iataCode: 'HND', name: 'Haneda', cityName: 'Tokyo', countryCode: 'JP' },
  { iataCode: 'KIX', name: 'Kansai International', cityName: 'Osaka', countryCode: 'JP' },
  { iataCode: 'ICN', name: 'Incheon International', cityName: 'Seoul', countryCode: 'KR' },
  { iataCode: 'PEK', name: 'Beijing Capital International', cityName: 'Beijing', countryCode: 'CN' },
  { iataCode: 'PVG', name: 'Pudong International', cityName: 'Shanghai', countryCode: 'CN' },
  { iataCode: 'CAN', name: 'Baiyun International', cityName: 'Guangzhou', countryCode: 'CN' },

  // ─── Timur Tengah & lainnya ─────────────────────────
  { iataCode: 'DXB', name: 'Dubai International', cityName: 'Dubai', countryCode: 'AE' },
  { iataCode: 'DOH', name: 'Hamad International', cityName: 'Doha', countryCode: 'QA' },
  { iataCode: 'JED', name: 'King Abdulaziz International', cityName: 'Jeddah', countryCode: 'SA' },
  { iataCode: 'MED', name: 'Prince Mohammad bin Abdulaziz', cityName: 'Madinah', countryCode: 'SA' },

  // ─── Australia ──────────────────────────────────────
  { iataCode: 'SYD', name: 'Kingsford Smith', cityName: 'Sydney', countryCode: 'AU' },
  { iataCode: 'MEL', name: 'Tullamarine', cityName: 'Melbourne', countryCode: 'AU' },
  { iataCode: 'PER', name: 'Perth International', cityName: 'Perth', countryCode: 'AU' },
];

export function searchStaticAirports(keyword: string, limit = 10): AirportEntry[] {
  const q = keyword.trim().toLowerCase();
  if (q.length < 2) return [];

  // Exact IATA match first (case-insensitive)
  const exact = STATIC_AIRPORTS.find((a) => a.iataCode.toLowerCase() === q);
  const matches = STATIC_AIRPORTS.filter(
    (a) =>
      a.iataCode.toLowerCase().includes(q) ||
      a.cityName.toLowerCase().includes(q) ||
      a.name.toLowerCase().includes(q),
  );

  const ordered = exact ? [exact, ...matches.filter((m) => m !== exact)] : matches;
  return ordered.slice(0, limit);
}
