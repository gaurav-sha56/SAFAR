// SAFAR PWA service worker with cache fallback and background notification support.
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (event.request.method !== 'GET') {
    return;
  }

  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/owner/') || url.pathname.startsWith('/drivers/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => response)
        .catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});

self.addEventListener('push', (event) => {
  if (!event.data) {
    return;
  }

  let payload = {};
  try {
    payload = event.data.json();
  } catch {
    payload = { notification: { title: 'SAFAR Alert', body: event.data.text() } };
  }

  const notification = payload.notification || {};
  const data = payload.data || notification.data || {};
  const title = notification.title || data.title || 'SAFAR Alert';
  const body = notification.body || data.body || 'A new fleet alert just came in.';
  const url = data.url || '/owner/alerts';

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: notification.icon || '/icons/icon-192x192.png',
      badge: notification.badge || '/icons/icon-192x192.png',
      tag: notification.tag || data.tag || 'safar-alert',
      requireInteraction: Boolean(notification.requireInteraction),
      renotify: notification.renotify !== false,
      data: { url },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification?.data?.url || '/owner/alerts';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }

      return undefined;
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => Promise.all(
      cacheNames.map((cacheName) => {
        if (!cacheName.startsWith('static-')) {
          return caches.delete(cacheName);
        }
        return undefined;
      })
    ))
  );
  self.clients.claim();
});
