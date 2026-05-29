'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';

const NAV_ITEMS = [
  { href: '/',       label: 'Beranda', code: '01' },
  { href: '/alerts', label: 'Alert',   code: '02' },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-midnight-700/10 bg-cream-100/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-8 px-5 py-4 sm:px-8">
        {/* Wordmark */}
        <Link
          href="/"
          aria-label="myTiket — beranda"
          className="group flex items-baseline gap-2"
        >
          <span className="font-display text-[28px] font-light italic leading-none tracking-tightest text-midnight-700">
            myTiket
          </span>
          <span className="block h-2 w-2 rounded-full bg-amber-400 transition-transform group-hover:scale-150" />
        </Link>

        {/* Editorial nav */}
        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'group relative flex items-baseline gap-2 rounded-full px-4 py-2 transition-colors',
                  active
                    ? 'text-midnight-700'
                    : 'text-ink-500 hover:text-midnight-700'
                )}
              >
                <span className="font-mono text-[9px] uppercase tracking-widest text-ink-400 group-hover:text-amber-500">
                  {item.code}
                </span>
                <span className="font-display text-base italic tracking-tight">
                  {item.label}
                </span>
                {active && (
                  <span className="absolute inset-x-4 -bottom-0.5 h-px bg-amber-400" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Status pill — adds atmosphere; visible only on sm+ */}
        <div className="hidden items-center gap-2 sm:flex">
          <span className="block h-2 w-2 animate-pulse-soft rounded-full bg-emerald-500" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-ink-400">
            Live · GMT+7
          </span>
        </div>
      </div>
    </header>
  );
}
