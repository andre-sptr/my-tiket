import { Suspense } from 'react';
import SearchForm from '@/components/SearchForm';
import ExploreSection from '@/components/ExploreSection';

const TICKER = [
  'CGK → SIN  Rp 1.420.000',
  'DPS → KUL  Rp 1.180.000',
  'SUB → HKG  Rp 3.940.000',
  'JOG → NRT  Rp 5.620.000',
  'BTH → BKK  Rp 1.760.000',
  'BPN → CGK  Rp     890.000',
  'KNO → DPS  Rp 1.340.000',
  'CGK → AMS  Rp 12.300.000',
];

export default function HomePage() {
  return (
    <div className="space-y-24">
      {/* — — — HERO — — — */}
      <section className="relative pt-6 sm:pt-12">
        {/* Eyebrow row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 eyebrow">
            <span className="text-amber-400">✦</span>
            <span>Vol. 01 · Edisi {new Date().getFullYear()}</span>
          </div>
          <div className="hidden font-mono text-[10px] uppercase tracking-widest text-ink-400 sm:block">
            Indonesia · Pemantau Independen
          </div>
        </div>

        <div className="mt-6 grid grid-cols-12 gap-x-6 gap-y-10">
          {/* Headline */}
          <div className="col-span-12 lg:col-span-8 animate-fade-up">
            <h1 className="font-display text-[clamp(2.8rem,9vw,7.5rem)] font-light leading-[0.92] tracking-tightest text-midnight-700">
              Terbang ke
              <br />
              <span className="italic text-amber-500">mana saja</span>
              <span className="text-midnight-700">,</span>
              <br />
              dengan harga
              <br />
              yang <span className="italic">tepat</span>
              <span className="text-amber-400">.</span>
            </h1>
          </div>

          {/* Sidebar editorial column */}
          <aside className="col-span-12 flex flex-col justify-end gap-6 lg:col-span-4 animate-fade-up [animation-delay:120ms]">
            <div className="rule" />
            <div className="space-y-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-ink-400">
                Cara Kerja
              </p>
              <p className="text-pretty font-display text-xl italic leading-snug text-midnight-700">
                Tetapkan rute, rentang tanggal, dan harga ideal Anda.
                Kami melacak setiap maskapai siang &amp; malam—lalu mengirim sinyal via
                <span className="font-medium not-italic text-amber-500"> WhatsApp </span>
                begitu pasar setuju.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2">
              <Stat n="6" label="Sumber" />
              <Stat n="24/7" label="Pantauan" />
              <Stat n="∞" label="Alert" />
            </div>
          </aside>
        </div>

        {/* Floating sun-rise gradient + tiny plane silhouette */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-10 hidden h-72 w-72 rounded-full bg-amber-200/50 blur-[80px] lg:block"
        />
      </section>

      {/* — — — TICKER — — — */}
      <section
        aria-hidden
        className="relative overflow-hidden rounded-full border-y border-midnight-700/10 bg-midnight-700 py-3 text-cream-50"
      >
        <div className="flex w-max animate-marquee gap-12 whitespace-nowrap pr-12 font-mono text-xs uppercase tracking-widest">
          {[...TICKER, ...TICKER].map((t, i) => (
            <span key={i} className="flex items-center gap-3">
              <span className="text-amber-400">✦</span>
              {t}
            </span>
          ))}
        </div>
      </section>

      {/* — — — SEARCH (BOARDING-PASS STYLE) — — — */}
      <section className="relative -mt-6">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow mb-2">№ 01 · Mulai dari sini</p>
            <h2 className="font-display text-3xl font-light italic tracking-tight text-midnight-700 sm:text-4xl">
              Susun perjalanan
            </h2>
          </div>
          <span className="hidden font-mono text-[10px] uppercase tracking-widest text-ink-400 sm:block">
            Boarding form · v.1
          </span>
        </div>
        <Suspense fallback={<div className="pass-card h-64 animate-pulse" />}>
          <SearchForm />
        </Suspense>
      </section>

      {/* — — — EXPLORE — — — */}
      <section>
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow mb-2">№ 02 · Inspirasi Minggu Ini</p>
            <h2 className="font-display text-3xl font-light italic tracking-tight text-midnight-700 sm:text-4xl">
              Termurah dari Jakarta
            </h2>
          </div>
          <span className="hidden font-mono text-[10px] uppercase tracking-widest text-amber-500 sm:block">
            Live ✦ CGK
          </span>
        </div>
        <ExploreSection origin="CGK" />
      </section>

      {/* — — — MANIFESTO STRIP — — — */}
      <section className="relative overflow-hidden rounded-[28px] bg-midnight-700 px-8 py-16 text-cream-50 sm:px-16 sm:py-24">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 right-0 h-96 w-96 rounded-full bg-amber-400/15 blur-[100px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-sky-400/15 blur-[80px]"
        />

        <p className="eyebrow !text-amber-300">Manifesto</p>
        <p className="mt-6 max-w-3xl text-pretty font-display text-3xl font-light italic leading-snug tracking-tight sm:text-5xl">
          Kami tidak menjual tiket. Kami menjaga harga jujur dengan
          <span className="text-amber-300"> sabar </span>
          —agar Anda tidak perlu lagi.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-x-10 gap-y-3 font-mono text-[10px] uppercase tracking-widest text-cream-50/70">
          <span>✦ Independen</span>
          <span>✦ Tanpa Markup</span>
          <span>✦ Notifikasi WhatsApp</span>
          <span>✦ Tanpa Login</span>
        </div>
      </section>
    </div>
  );
}

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <div className="border-l border-midnight-700/15 pl-3">
      <div className="font-display text-3xl font-light text-midnight-700">{n}</div>
      <div className="mt-1 font-mono text-[9px] uppercase tracking-widest text-ink-400">
        {label}
      </div>
    </div>
  );
}
