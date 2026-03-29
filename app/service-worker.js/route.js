import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function getFirebasePublicConfig() {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  };
}

function buildServiceWorkerScript() {
  const cacheName = 'safar-shell-v3';
  const appShellAssets = [
    '/',
    '/owner',
    '/offline',
    '/manifest.json',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
  ];
  const firebaseConfig = getFirebasePublicConfig();
  const hasFirebaseMessaging = Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.messagingSenderId &&
    firebaseConfig.appId
  );

  return `
const CACHE_NAME = '${cacheName}';
const APP_SHELL_ASSETS = ${JSON.stringify(appShellAssets)};
const FIREBASE_CONFIG = ${JSON.stringify(firebaseConfig)};
const HAS_FIREBASE_MESSAGING = ${JSON.stringify(hasFirebaseMessaging)};

if (HAS_FIREBASE_MESSAGING) {
  importScripts('https://www.gstatic.com/firebasejs/11.6.1/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/11.6.1/firebase-messaging-compat.js');

  firebase.initializeApp(FIREBASE_CONFIG);

  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    const title = payload.notification?.title || payload.data?.title || 'SAFAR Alert';
    const body = payload.notification?.body || payload.data?.body || 'A new fleet alert just came in.';
    const url = payload.data?.url || '/owner/alerts';
    const severity = payload.data?.severity || 'medium';

    self.registration.showNotification(title, {
      body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      tag: payload.data?.tag || payload.data?.alertId || 'safar-alert',
      data: {
        url,
      },
      requireInteraction: severity === 'high',
      renotify: true,
    });
  });
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL_ASSETS)).catch(() => undefined)
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/owner/alerts';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }

      return undefined;
    })
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch(() => undefined);
          return response;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          return cachedResponse || caches.match('/offline');
        })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch(() => undefined);
          return response;
        })
        .catch(() => caches.match('/icons/icon-192x192.png'));
    })
  );
});
`;
}

export async function GET() {
  return new NextResponse(buildServiceWorkerScript(), {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Service-Worker-Allowed': '/',
    },
  });
}
