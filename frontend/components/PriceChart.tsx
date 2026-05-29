'use client';

import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { getPriceHistory } from '@/lib/api';
import { formatIDR } from '@/lib/format';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface Props {
  origin: string;
  destination: string;
  date: string;
  airlineCode?: string;
}

export default function PriceChart({ origin, destination, date, airlineCode }: Props) {
  const { data = [], isLoading } = useQuery({
    queryKey: ['price-history', origin, destination, date, airlineCode],
    queryFn:  () => getPriceHistory(origin, destination, date, airlineCode),
  });

  if (isLoading) {
    return <div className="h-32 animate-pulse rounded-lg bg-midnight-700/5" />;
  }

  if (data.length < 2) {
    return (
      <div className="flex h-24 items-center justify-center font-display text-sm italic text-ink-400">
        Belum cukup data historis untuk menampilkan grafik.
      </div>
    );
  }

  const chartData = data.map((r) => ({
    date:  format(new Date(r.scrapedAt), 'dd MMM HH:mm', { locale: id }),
    price: r.priceIdr,
  }));

  const minPrice = Math.min(...data.map((r) => r.priceIdr));
  const maxPrice = Math.max(...data.map((r) => r.priceIdr));
  const trend = data[data.length - 1].priceIdr < data[0].priceIdr ? 'down' : 'up';

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-widest text-ink-400">
          Riwayat 7 hari
        </span>
        <span
          className={`font-mono text-[10px] font-bold uppercase tracking-widest ${
            trend === 'down' ? 'text-emerald-600' : 'text-red-600'
          }`}
        >
          {trend === 'down' ? '↓ Harga Turun' : '↑ Harga Naik'}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={140}>
        <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="2 4" stroke="rgba(11,20,38,0.08)" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: '#6B6E78', fontFamily: 'var(--font-mono)' }}
            tickLine={false}
            axisLine={{ stroke: 'rgba(11,20,38,0.1)' }}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#6B6E78', fontFamily: 'var(--font-mono)' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}jt`}
            domain={[minPrice * 0.95, maxPrice * 1.05]}
          />
          <Tooltip
            formatter={(v: number) => [formatIDR(v), 'Harga']}
            contentStyle={{
              fontSize: 12,
              borderRadius: 8,
              border: '1px solid rgba(11,20,38,0.12)',
              background: '#FBF8F2',
              fontFamily: 'var(--font-body)',
            }}
            labelStyle={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em' }}
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#E8862A"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#0B1426', stroke: '#E8862A', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
