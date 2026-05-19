'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, PlaneTakeoff } from 'lucide-react';
import { clsx } from 'clsx';

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-brand-600 text-lg">
          <PlaneTakeoff className="w-5 h-5" />
          myTiket
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          <Link
            href="/"
            className={clsx(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              pathname === '/'
                ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-600'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            )}
          >
            Beranda
          </Link>
          <Link
            href="/alerts"
            className={clsx(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5',
              pathname === '/alerts'
                ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-600'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            )}
          >
            <Bell className="w-4 h-4" />
            Alert Saya
          </Link>
        </div>
      </div>
    </nav>
  );
}
