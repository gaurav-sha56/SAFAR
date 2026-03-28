'use client';

import { useEffect } from 'react';

export default function PwaRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const registerServiceWorker = async () => {
      try {
        await navigator.serviceWorker.register('/service-worker.js', {
          scope: '/',
        });
      } catch (error) {
        console.error('Service worker registration failed', error);
      }
    };

    registerServiceWorker();
  }, []);

  return null;
}
