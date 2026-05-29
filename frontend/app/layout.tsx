import type { Metadata } from 'next';
import { Fraunces, Manrope, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Toaster } from 'sonner';
import Navbar from '@/components/Navbar';

const display = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  axes: ['opsz', 'SOFT'],
  display: 'swap',
});

const body = Manrope({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'myTiket — Pantau Harga Tiket Pesawat',
  description:
    'Monitor harga tiket pesawat dari semua maskapai. Set alert harga dan dapatkan notifikasi saat harga turun.',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${display.variable} ${body.variable} ${mono.variable}`}
    >
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="relative min-h-screen bg-cream-100 text-ink-700 font-sans antialiased selection:bg-amber-200 selection:text-midnight-700">
        {/* Atmospheric backdrop layers */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 -z-10 bg-paper"
        />
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 -z-10 opacity-[0.18] mix-blend-multiply bg-noise"
        />

        <Providers>
          <Navbar />
          <main className="relative mx-auto w-full max-w-[1200px] px-5 pb-24 pt-8 sm:px-8">
            {children}
          </main>
          <SiteFooter />
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#0B1426',
                color: '#FBF8F2',
                border: '1px solid #1E2A44',
                fontFamily: 'var(--font-body)',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-cream-300/60 bg-cream-50/60">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-6 px-5 py-10 sm:flex-row sm:items-end sm:justify-between sm:px-8">
        <div className="font-display text-2xl font-light italic tracking-tightest text-midnight-700">
          myTiket<span className="text-amber-400">.</span>
        </div>
        <div className="font-mono text-[10px] uppercase tracking-widest text-ink-400">
          <span>Est. 2026</span>
          <span className="mx-3 text-amber-400">✦</span>
          <span>Jakarta — Worldwide</span>
          <span className="mx-3 text-amber-400">✦</span>
          <span>Pemantau Harga Independen</span>
        </div>
      </div>
    </footer>
  );
}
