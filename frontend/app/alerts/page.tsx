'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getClientId } from '@/lib/localStorage';
import { fetchAlerts, deleteAlert } from '@/lib/api';
import AlertList from '@/components/AlertList';
import AlertModal from '@/components/AlertModal';
import { Plus } from 'lucide-react';
import type { Alert } from '@/lib/types';

export default function AlertsPage() {
  const [clientId, setClientId] = useState<string>('');
  const [showCreate, setShowCreate] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    setClientId(getClientId());
  }, []);

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['alerts', clientId],
    queryFn:  () => fetchAlerts(clientId),
    enabled:  !!clientId,
  });

  const deleteMutation = useMutation({
    mutationFn: (alertId: string) => deleteAlert(alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts', clientId] });
    },
  });

  const activeAlerts    = alerts.filter((a: Alert) => a.isActive);
  const triggeredAlerts = alerts.filter((a: Alert) => !a.isActive && a.triggeredAt);

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-6 border-b border-midnight-700/10 pb-6">
        <div>
          <p className="eyebrow mb-2">Dashboard Pribadi</p>
          <h1 className="font-display text-[clamp(2.4rem,6vw,4rem)] font-light leading-[0.95] tracking-tightest text-midnight-700">
            Alert <span className="italic text-amber-500">Saya</span>
          </h1>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="btn-primary"
        >
          <Plus className="h-3.5 w-3.5" />
          Buat Alert Baru
        </button>
      </header>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="pass-card h-32 animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && alerts.length === 0 && (
        <div className="pass-card flex flex-col items-center gap-3 px-6 py-16 text-center">
          <p className="font-mono text-[10px] uppercase tracking-widest text-ink-400">
            Belum ada sinyal
          </p>
          <p className="font-display text-2xl italic text-midnight-700">
            Sunyi di sini.
          </p>
          <p className="max-w-sm font-mono text-[10px] uppercase tracking-widest text-ink-400">
            Klik "Buat Alert Baru" untuk mulai memantau harga
          </p>
        </div>
      )}

      {activeAlerts.length > 0 && (
        <section>
          <h2 className="mb-4 flex items-center gap-3">
            <span className="block h-2 w-2 animate-pulse-soft rounded-full bg-amber-400" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-ink-500">
              Sedang Dipantau ({activeAlerts.length})
            </span>
          </h2>
          <AlertList alerts={activeAlerts} onDelete={(id) => deleteMutation.mutate(id)} />
        </section>
      )}

      {triggeredAlerts.length > 0 && (
        <section>
          <h2 className="mb-4 flex items-center gap-3">
            <span className="block h-2 w-2 rounded-full bg-emerald-500" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-ink-500">
              Sudah Terpicu ({triggeredAlerts.length})
            </span>
          </h2>
          <AlertList
            alerts={triggeredAlerts}
            onDelete={(id) => deleteMutation.mutate(id)}
            triggered
          />
        </section>
      )}

      <p className="border-t border-dashed border-midnight-700/15 pt-5 text-center font-mono text-[10px] uppercase tracking-widest text-ink-400">
        ✦ Notifikasi dikirim via WhatsApp ke nomor yang Anda daftarkan
      </p>

      {showCreate && <AlertModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
