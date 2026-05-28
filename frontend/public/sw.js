// myTiket Service Worker — handles Web Push notifications

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: 'myTiket Alert', body: event.data.text() };
  }

  const options = {
    body: data.body || 'Harga tiket telah mencapai target Anda!',
    icon: '/icon-192.png',
    badge: '/icon-72.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/',
      alertId: data.alertId,
    },
    actions: [
      { action: 'view', title: 'Lihat Detail' },
      { action: 'dismiss', title: 'Tutup' },
    ],
    requireInteraction: true,
  };

  event.waitUntil(
    self.registration.showNotification(data.title || '🎫 Harga Tiket Turun!', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Jika sudah ada tab yang terbuka, fokus ke sana
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        // Buka tab baru
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});
