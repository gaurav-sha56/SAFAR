'use client';

import { useEffect } from 'react';

export default function PwaRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const registerServiceWorker = async () => {
      try {
        await navigator.serviceWorker.register('/pwa-sw.js', {
          scope: '/',
        });
      } catch (error) {
        console.error('Service worker registration failed', error);
      }
    };

    const updateDisplayMode = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
      document.documentElement.classList.toggle('app-standalone', isStandalone);
      document.body.classList.toggle('app-standalone', isStandalone);
    };

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      window.deferredInstallPrompt = event;
      window.dispatchEvent(new CustomEvent('safar-installable'));
    };

    const handleAppInstalled = () => {
      window.deferredInstallPrompt = null;
      updateDisplayMode();
      window.dispatchEvent(new CustomEvent('safar-installed'));
    };

    registerServiceWorker();
    updateDisplayMode();

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const mediaListener = () => updateDisplayMode();

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', mediaListener);
    } else {
      mediaQuery.addListener(mediaListener);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('focus', updateDisplayMode);

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', mediaListener);
      } else {
        mediaQuery.removeListener(mediaListener);
      }

      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('focus', updateDisplayMode);
    };
  }, []);

  return null;
}
