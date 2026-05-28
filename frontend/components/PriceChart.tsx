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
    queryFn: () => getPriceHistory(origin, destination, date, airlineCode),
  });

  if (isLoading) {
    return <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />;
  }

  if (data.length < 2) {
    return (
      <div className="h-24 flex items-center justify-center text-xs text-gray-400">
        Belum cukup data historis untuk menampilkan grafik.
      </div>
    );
  }

  const chartData = data.map((r) => ({
    date: format(new Date(r.scrapedAt), 'dd MMM HH:mm', { locale: id }),
    price: r.priceIdr,
  }));

  const minPrice = Math.min(...data.map((r) => r.priceIdr));
  const maxPrice = Math.max(...data.map((r) => r.priceIdr));
  const trend = data[data.length - 1].priceIdr < data[0].priceIdr ? 'down' : 'up';

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400">Riwayat harga 7 hari</span>
        <span className={`text-xs font-medium ${trend === 'down' ? 'text-green-500' : 'text-red-500'}`}>
          {trend === 'down' ? '↓ Harga turun' : '↑ Harga naik'}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={120}>
        <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} />
          <YAxis
            tick={{ fontSize: 10 }}
            tickLine={false}
            tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}jt`}
            domain={[minPrice * 0.95, maxPrice * 1.05]}
          />
          <Tooltip
            formatter={(v: number) => [formatIDR(v), 'Harga']}
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#0284c7"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
