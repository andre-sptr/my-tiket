'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getClientId } from '@/lib/localStorage';
import { fetchAlerts, deleteAlert } from '@/lib/api';
import AlertList from '@/components/AlertList';
import AlertModal from '@/components/AlertModal';
import { Bell, BellOff, Plus } from 'lucide-react';
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
    queryFn: () => fetchAlerts(clientId),
    enabled: !!clientId,
  });

  const deleteMutation = useMutation({
    mutationFn: (alertId: string) => deleteAlert(alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts', clientId] });
    },
  });

  const activeAlerts = alerts.filter((a: Alert) => a.isActive);
  const triggeredAlerts = alerts.filter((a: Alert) => !a.isActive && a.triggeredAt);

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Bell className="w-6 h-6 text-brand-500" />
          <h1 className="text-2xl font-bold">Alert Saya</h1>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg px-4 py-2 text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Buat Alert Baru
        </button>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && alerts.length === 0 && (
        <div className="text-center py-20 space-y-3">
          <BellOff className="w-12 h-12 mx-auto text-gray-300" />
          <p className="text-gray-400">Belum ada alert aktif.</p>
          <p className="text-sm text-gray-400">
            Klik <strong>"Buat Alert Baru"</strong> di atas untuk mulai memantau harga.
          </p>
        </div>
      )}

      {activeAlerts.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block" />
            Sedang Dipantau ({activeAlerts.length})
          </h2>
          <AlertList alerts={activeAlerts} onDelete={(id) => deleteMutation.mutate(id)} />
        </section>
      )}

      {triggeredAlerts.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3 text-gray-500">
            ✅ Sudah Terpicu ({triggeredAlerts.length})
          </h2>
          <AlertList
            alerts={triggeredAlerts}
            onDelete={(id) => deleteMutation.mutate(id)}
            triggered
          />
        </section>
      )}

      <p className="text-xs text-gray-400 text-center">
        Notifikasi dikirim via WhatsApp ke nomor yang Anda daftarkan saat membuat alert.
      </p>

      {showCreate && <AlertModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
