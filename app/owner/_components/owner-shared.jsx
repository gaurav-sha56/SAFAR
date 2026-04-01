'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { UserButton, useUser } from '@clerk/nextjs';
import { usePathname } from 'next/navigation';
import { getFirebaseMessagingDebugInfo, listenForForegroundMessages, requestFirebaseToken, isFirebaseMessagingSupported } from '@/app/lib/firebase';

const DEFAULT_FLEET = { id: '', name: '' };
const OWNER_FLEET_STORAGE_KEY = 'safar:owner-fleet-id';
const PUSH_PROMPT_DISMISSED_KEY = 'safar:push-prompt-dismissed';

export const NAV_ITEMS = [
  { href: '/owner', label: 'Dashboard', key: 'dashboard' },
  { href: '/owner/drivers', label: 'Drivers', key: 'drivers' },
  { href: '/owner/alerts', label: 'Alerts', key: 'alerts' },
  { href: '/owner/reports', label: 'Reports', key: 'reports' },
  { href: '/owner/maps', label: 'Maps', key: 'maps' },
  { href: '/owner/sos', label: 'SOS', key: 'sos' },
];

export function createFleetIdFromOwnerId(ownerId) {
  const seed = String(ownerId || 'guest-owner');
  let hashA = 0x811c9dc5;
  let hashB = 0x01000193;
  let hashC = 0x9e3779b9;
  let hashD = 0x85ebca6b;

  for (let i = 0; i < seed.length; i += 1) {
    const code = seed.charCodeAt(i);
    hashA = Math.imul(hashA ^ code, 0x01000193) >>> 0;
    hashB = Math.imul(hashB ^ (code + i), 0x85ebca6b) >>> 0;
    hashC = Math.imul(hashC ^ (code * 17), 0xc2b2ae35) >>> 0;
    hashD = Math.imul(hashD ^ (code + hashA), 0x27d4eb2d) >>> 0;
  }

  const hex = [hashA, hashB, hashC, hashD]
    .map((value) => value.toString(16).padStart(8, '0'))
    .join('');

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

export function hasValidLocation(coords) {
  return coords && typeof coords.lat === 'number' && Number.isFinite(coords.lat) && typeof coords.lng === 'number' && Number.isFinite(coords.lng);
}

export function getDriverCoords(driver) {
  if (typeof driver?.last_lat !== 'number' || typeof driver?.last_lng !== 'number') {
    return null;
  }

  return { lat: driver.last_lat, lng: driver.last_lng };
}

export function getDriverMapHref(coords) {
  return `https://www.openstreetmap.org/?mlat=${coords.lat}&mlon=${coords.lng}#map=16/${coords.lat}/${coords.lng}`;
}

export function getEmbeddedMapHref(coords) {
  const pad = 0.02;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${coords.lng - pad}%2C${coords.lat - pad}%2C${coords.lng + pad}%2C${coords.lat + pad}&layer=mapnik&marker=${coords.lat}%2C${coords.lng}`;
}

export function formatVehicleIdentity({ vehiclePlate, vehicleModel }) {
  const plate = typeof vehiclePlate === 'string' ? vehiclePlate.trim() : '';
  const model = typeof vehicleModel === 'string' ? vehicleModel.trim() : '';

  if (plate && model) return `${plate} - ${model}`;
  return plate || model || '';
}

export function formatDriverDisplayName(driver) {
  const vehicleIdentity = formatVehicleIdentity({
    vehiclePlate: driver?.vehicle_plate || driver?.vehiclePlate,
    vehicleModel: driver?.vehicle_model || driver?.vehicleModel,
  });

  if (vehicleIdentity) {
    return `${driver?.name || 'Driver'} - ${vehicleIdentity}`;
  }

  return driver?.name || 'Driver';
}

export function formatAlertTypeLabel(type) {
  if (typeof type !== 'string') {
    return 'Alert';
  }

  const normalized = type.trim().toLowerCase();
  const knownLabels = {
    overspeed: 'Overspeed',
    harsh_braking: 'Harsh Braking',
    tracking_stopped: 'Tracking Stopped',
    duty_tracking_interrupted: 'Duty Tracking Interrupted',
    device_offline: 'Device Offline',
    sos: 'SOS',
  };

  if (knownLabels[normalized]) {
    return knownLabels[normalized];
  }

  return normalized
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ') || 'Alert';
}

export function AlertBadge({ severity }) {
  const styles = {
    high: 'border-red-200 bg-red-50 text-red-700',
    medium: 'border-amber-200 bg-amber-50 text-amber-700',
    low: 'border-sky-200 bg-sky-50 text-sky-700',
  };

  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${styles[severity] || styles.medium}`}>{severity || 'Alert'}</span>;
}

export function StatusBadge({ status }) {
  const map = {
    active: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', label: 'Active' },
    offline: { color: 'bg-stone-100 text-stone-500 border-stone-200', dot: 'bg-stone-400', label: 'Offline' },
  };
  const current = map[status] || map.offline;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${current.color}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${current.dot} ${status === 'active' ? 'animate-pulse' : ''}`} />
      {current.label}
    </span>
  );
}

export function DutyBadge({ dutyStatus, trackingExpected }) {
  const status = typeof dutyStatus === 'string' ? dutyStatus.trim().toLowerCase() : 'off_duty';
  const labels = {
    on_duty: 'On Duty',
    off_duty: 'Off Duty',
    break: 'Break',
    shift_ended: 'Shift Ended',
  };
  const styles = {
    on_duty: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    off_duty: 'border-slate-200 bg-slate-100 text-slate-600',
    break: 'border-amber-200 bg-amber-50 text-amber-700',
    shift_ended: 'border-stone-200 bg-stone-100 text-stone-500',
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${styles[status] || styles.off_duty}`}>
      {labels[status] || 'Off Duty'}
      {trackingExpected ? ' · GPS On' : ''}
    </span>
  );
}

export function SurfaceCard({ children, className = '' }) {
  return <section className={`rounded-[28px] border border-sky-100 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] shadow-[0_18px_55px_rgba(15,42,94,0.08)] ${className}`}>{children}</section>;
}

export function PwaInstallBanner() {
  const [isStandalone, setIsStandalone] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const syncState = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
      setIsStandalone(standalone);
      setIsInstallable(Boolean(window.deferredInstallPrompt) && !standalone);
    };

    const handleInstallable = () => syncState();
    const handleInstalled = () => {
      setIsDismissed(true);
      syncState();
    };

    syncState();
    window.addEventListener('safar-installable', handleInstallable);
    window.addEventListener('safar-installed', handleInstalled);
    window.addEventListener('focus', syncState);

    return () => {
      window.removeEventListener('safar-installable', handleInstallable);
      window.removeEventListener('safar-installed', handleInstalled);
      window.removeEventListener('focus', syncState);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (typeof window === 'undefined' || !window.deferredInstallPrompt) return;

    try {
      setIsInstalling(true);
      await window.deferredInstallPrompt.prompt();
      const choice = await window.deferredInstallPrompt.userChoice;
      if (choice?.outcome !== 'accepted') {
        setIsDismissed(true);
      }
      window.deferredInstallPrompt = null;
      setIsInstallable(false);
    } catch (error) {
      console.error('Install prompt failed', error);
    } finally {
      setIsInstalling(false);
    }
  }, []);

  if (isStandalone || !isInstallable || isDismissed) return null;

  return (
    <div className="mb-6 overflow-hidden rounded-[28px] border border-sky-100 bg-[radial-gradient(circle_at_top_left,#e0f2fe_0%,#ffffff_42%,#fff7ed_100%)] p-5 shadow-[0_18px_55px_rgba(15,42,94,0.08)] sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-[0_16px_32px_rgba(15,23,42,0.22)]">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">Install SAFAR App</p>
            <h3 className="mt-2 text-xl font-black tracking-tight text-slate-950 sm:text-2xl">Launch faster with a real app-style experience.</h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Install SAFAR on this device for full-screen access, cleaner navigation, and a smoother owner dashboard on Android.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleInstall}
            disabled={isInstalling}
            className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(15,23,42,0.18)] transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isInstalling ? 'Preparing install...' : 'Install app'}
          </button>
          <button
            onClick={() => setIsDismissed(true)}
            className="inline-flex items-center justify-center rounded-full border border-sky-100 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-slate-900"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}

export function PushNotificationBanner({ fleetId, userId }) {
  const [status, setStatus] = useState('checking');
  const [message, setMessage] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);

  const syncToken = useCallback(async () => {
    if (!fleetId || !userId || typeof window === 'undefined') return;

    const supported = await isFirebaseMessagingSupported();
    if (!supported) {
      setStatus('unsupported');
      setMessage('This device/browser is not exposing Firebase web push support yet. Open the installed Android PWA in Chrome and try again.');
      setDebugInfo(getFirebaseMessagingDebugInfo());
      return;
    }

    if (!('Notification' in window)) {
      setStatus('unsupported');
      setMessage('This browser does not support the Notification API.');
      setDebugInfo(getFirebaseMessagingDebugInfo());
      return;
    }

    if (Notification.permission === 'denied') {
      setStatus('blocked');
      setMessage('Browser notifications are blocked on this device. Enable them from browser settings to receive live alerts.');
      setShowPromptModal(false);
      return;
    }

    if (Notification.permission !== 'granted') {
      setStatus('prompt');
      const wasDismissed = window.localStorage.getItem(`${PUSH_PROMPT_DISMISSED_KEY}:${userId}`) === 'true';
      setShowPromptModal(!wasDismissed);
      return;
    }

    try {
      const token = await requestFirebaseToken();
      if (!token) {
        setStatus('unsupported');
        setMessage('SAFAR could not get a device push token from this browser.');
        setDebugInfo(getFirebaseMessagingDebugInfo());
        return;
      }

      const response = await fetch('/api/push-subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fleetId,
          userId,
          token,
          notificationPermission: Notification.permission,
        }),
      });

      if (!response.ok) {
        throw new Error('Push subscription could not be saved.');
      }

      setStatus('enabled');
      setMessage('Instant fleet alerts are active on this device.');
      setDebugInfo(null);
      setShowPromptModal(false);
    } catch (error) {
      setStatus('error');
      setMessage(error.message || 'Instant alert setup failed. Please try again.');
      setDebugInfo(getFirebaseMessagingDebugInfo());
      console.error('Push notification sync failed:', error);
    }
  }, [fleetId, userId]);

  useEffect(() => {
    syncToken();
  }, [syncToken]);

  useEffect(() => {
    let unsubscribe = () => {};

    const attachListener = async () => {
      unsubscribe = await listenForForegroundMessages((payload) => {
        if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') {
          return;
        }

        const title = payload.notification?.title || payload.data?.title || 'SAFAR Alert';
        const body = payload.notification?.body || payload.data?.body || 'A new fleet alert just came in.';
        const url = payload.data?.url || '/owner/alerts';

        const notification = new Notification(title, {
          body,
          icon: '/icons/icon-192x192.png',
          tag: payload.data?.tag || payload.data?.alertId || 'safar-alert',
          data: { url },
        });

        notification.onclick = () => {
          window.focus();
          window.location.href = url;
        };
      });
    };

    attachListener();
    return () => unsubscribe?.();
  }, []);

  const handleEnable = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    setIsBusy(true);
    try {
      window.localStorage.removeItem(`${PUSH_PROMPT_DISMISSED_KEY}:${userId}`);
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setStatus(permission === 'denied' ? 'blocked' : 'prompt');
        setMessage(permission === 'denied' ? 'Notification permission was blocked. You can enable it later from browser settings.' : '');
        setShowPromptModal(permission !== 'denied');
        return;
      }

      await syncToken();
    } finally {
      setIsBusy(false);
    }
  }, [syncToken, userId]);

  const handleDismissPrompt = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(`${PUSH_PROMPT_DISMISSED_KEY}:${userId}`, 'true');
    }
    setShowPromptModal(false);
  }, [userId]);

  if (!fleetId || !userId) return null;
  if (status === 'checking' || status === 'enabled') return null;

  return (
    <>
      {showPromptModal ? (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/40 p-4 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-xl overflow-hidden rounded-[32px] border border-sky-100 bg-[radial-gradient(circle_at_top_left,#fff7ed_0%,#ffffff_40%,#e0f2fe_100%)] p-6 shadow-[0_28px_80px_rgba(15,23,42,0.28)] sm:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[22px] bg-slate-950 text-white shadow-[0_18px_38px_rgba(15,23,42,0.22)]">
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0a3 3 0 11-6 0h6z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-600">Instant Fleet Alerts</p>
                <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Turn on WhatsApp-style safety notifications.</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
                  Enable notifications once and SAFAR will alert you instantly for SOS, overspeed, and driver tracking issues even while the app is in the background.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 rounded-[24px] border border-white/80 bg-white/80 p-4 shadow-[0_14px_30px_rgba(15,42,94,0.05)] sm:grid-cols-3">
              {['SOS emergency alerts', 'Overspeed warnings', 'Tracking stopped updates'].map((item) => (
                <div key={item} className="rounded-[20px] bg-sky-50/70 px-4 py-4 text-sm font-semibold text-slate-700">
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={handleDismissPrompt}
                className="inline-flex items-center justify-center rounded-full border border-sky-100 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-slate-900"
              >
                Maybe later
              </button>
              <button
                onClick={handleEnable}
                disabled={isBusy}
                className="inline-flex items-center justify-center rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(15,23,42,0.18)] transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isBusy ? 'Enabling alerts...' : 'Enable notifications'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {(status === 'blocked' || status === 'error' || status === 'unsupported') ? (
        <div className="mb-6 overflow-hidden rounded-[28px] border border-orange-200 bg-[radial-gradient(circle_at_top_left,#fff7ed_0%,#ffffff_42%,#eff6ff_100%)] p-5 shadow-[0_18px_55px_rgba(15,42,94,0.08)] sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-[0_16px_32px_rgba(249,115,22,0.22)]">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0a3 3 0 11-6 0h6z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-600">Instant Fleet Alerts</p>
                <h3 className="mt-2 text-xl font-black tracking-tight text-slate-950 sm:text-2xl">Notifications need one quick fix.</h3>
                <p className={`mt-3 text-sm leading-6 ${status === 'blocked' || status === 'error' || status === 'unsupported' ? 'text-red-600' : 'text-emerald-700'}`}>{message}</p>
                {debugInfo ? (
                  <div className="mt-3 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-xs leading-6 text-slate-500">
                    <p>Permission: <span className="font-semibold text-slate-700">{String(debugInfo.permission)}</span></p>
                    <p>Service worker: <span className="font-semibold text-slate-700">{debugInfo.hasServiceWorker ? 'available' : 'missing'}</span></p>
                    <p>Firebase config: <span className="font-semibold text-slate-700">{Object.values(debugInfo.config).every(Boolean) ? 'complete' : 'incomplete'}</span></p>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleEnable}
                disabled={isBusy}
                className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(15,23,42,0.18)] transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isBusy ? 'Retrying...' : status === 'unsupported' ? 'Retry in app' : 'Try again'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function StandaloneBottomNav({ section }) {
  return (
    <div className="fixed bottom-[max(16px,calc(env(safe-area-inset-bottom)+12px))] left-1/2 z-40 w-[min(94vw,540px)] -translate-x-1/2 lg:hidden">
      <div className="rounded-[28px] border border-slate-200/70 bg-white/95 px-2 py-2 shadow-[0_24px_60px_rgba(15,23,42,0.18)] backdrop-blur-xl">
        <nav className="grid grid-cols-6 gap-1">
          {NAV_ITEMS.map((item) => {
            const active = item.key === section;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-h-[58px] flex-col items-center justify-center rounded-[20px] px-2 py-2 text-[11px] font-semibold transition ${
                  active ? 'bg-slate-950 text-white shadow-[0_12px_28px_rgba(15,23,42,0.18)]' : 'text-slate-500 hover:bg-sky-50 hover:text-slate-900'
                }`}
              >
                <span className={`mb-1 h-1.5 w-1.5 rounded-full ${active ? 'bg-orange-300' : 'bg-slate-300'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

export function EmptyState({ title, description }) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center px-6 py-12 text-center">
      <p className="text-base font-semibold text-slate-900">{title}</p>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}

export function WorkspaceLoading({ message = 'Preparing your fleet workspace...' }) {
  return (
    <SurfaceCard className="p-5 sm:p-8">
      <div className="flex min-h-[240px] items-center justify-center">
        <div className="rounded-full border border-sky-100 bg-white px-5 py-4 text-center text-sm font-semibold text-slate-500 shadow-[0_16px_45px_rgba(15,42,94,0.08)] sm:px-8 sm:py-5 sm:text-base">
          {message}
        </div>
      </div>
    </SurfaceCard>
  );
}

export function WorkspaceError({ message, onRetry }) {
  return (
    <SurfaceCard className="border-red-200 bg-[linear-gradient(180deg,#fff9f9_0%,#ffffff_100%)] p-5 sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-red-500">Workspace Error</p>
      <h2 className="mt-4 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">We could not prepare your fleet yet.</h2>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">{message || 'Please retry once so we can reconnect your fleet workspace.'}</p>
      <button
        onClick={onRetry}
        className="mt-6 inline-flex items-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(15,23,42,0.18)] transition hover:bg-slate-800"
      >
        Retry fleet setup
      </button>
    </SurfaceCard>
  );
}

export function FleetSetupPanel({
  fleetSetupName,
  setFleetSetupName,
  onSubmit,
  isSettingUpFleet,
}) {
  return (
    <SurfaceCard className="p-5 sm:p-8">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] lg:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-orange-500">First-Time Setup</p>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">Name your fleet and unlock your owner workspace.</h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">
            Add a fleet name once and we will keep your invite code ready for every new driver you connect.
          </p>
        </div>

        <div className="rounded-[28px] border border-sky-100 bg-white p-6 shadow-[0_18px_45px_rgba(15,42,94,0.08)]">
          <label className="block text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">
            Fleet Name
          </label>
          <input
            value={fleetSetupName}
            onChange={(event) => setFleetSetupName(event.target.value)}
            placeholder="For example: Tarun City Fleet"
            className="mt-4 w-full rounded-2xl border border-sky-100 bg-sky-50/60 px-4 py-3 text-base font-medium text-slate-900 outline-none transition focus:border-orange-200 focus:bg-white"
          />
          <button
            onClick={onSubmit}
            disabled={isSettingUpFleet}
            className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(15,23,42,0.18)] transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSettingUpFleet ? 'Saving fleet...' : 'Save fleet and continue'}
          </button>
        </div>
      </div>
    </SurfaceCard>
  );
}

export function useOwnerWorkspaceData() {
  const { user, isLoaded } = useUser();
  const [fleet, setFleet] = useState(DEFAULT_FLEET);
  const [inviteCode, setInviteCode] = useState(null);
  const [resolvedFleetId, setResolvedFleetId] = useState(null);
  const [hasLoadedStoredFleetId, setHasLoadedStoredFleetId] = useState(false);
  const [drivers, setDrivers] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [driversLoading, setDriversLoading] = useState(true);
  const [fleetSetupName, setFleetSetupName] = useState('');
  const [isSettingUpFleet, setIsSettingUpFleet] = useState(false);
  const [hasEnsuredFleet, setHasEnsuredFleet] = useState(false);
  const [fleetEnsureError, setFleetEnsureError] = useState('');
  const [toast, setToast] = useState(null);
  const previousDriversRef = useRef([]);
  const previousAlertsRef = useRef([]);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const derivedFleetId = useMemo(() => (user?.id ? createFleetIdFromOwnerId(user.id) : null), [user?.id]);
  const ownerEmail = user?.primaryEmailAddress?.emailAddress || null;
  const activeFleetId = resolvedFleetId || derivedFleetId;

  const persistResolvedFleetId = useCallback((nextFleetId) => {
    if (!nextFleetId) return;

    setResolvedFleetId(nextFleetId);

    if (typeof window !== 'undefined' && user?.id) {
      window.localStorage.setItem(`${OWNER_FLEET_STORAGE_KEY}:${user.id}`, nextFleetId);
    }
  }, [user?.id]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!user?.id) {
      setResolvedFleetId(null);
      setHasLoadedStoredFleetId(true);
      return;
    }

    const storedFleetId = window.localStorage.getItem(`${OWNER_FLEET_STORAGE_KEY}:${user.id}`);
    setResolvedFleetId(storedFleetId || null);
    setHasLoadedStoredFleetId(true);
  }, [user?.id]);

  const isFleetSetupPending = hasEnsuredFleet && Boolean(activeFleetId) && fleet.id === activeFleetId && (!fleet.name || fleet.name === 'My Fleet');

  const ensureFleetExists = useCallback(async () => {
    if (!derivedFleetId || !hasLoadedStoredFleetId) return;
    setHasEnsuredFleet(false);
    setFleetEnsureError('');

    try {
      const response = await fetch('/api/fleet-dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fleetId: activeFleetId,
          ensureExists: true,
          ownerUserId: user?.id || null,
          ownerEmail,
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        setFleetEnsureError(result?.error || 'Could not prepare your fleet workspace.');
        return;
      }
      persistResolvedFleetId(result?.data?.fleet?.id || activeFleetId);
      setHasEnsuredFleet(true);
    } catch (error) {
      setFleetEnsureError(error?.message || 'Could not prepare your fleet workspace.');
    }
  }, [activeFleetId, derivedFleetId, hasLoadedStoredFleetId, ownerEmail, persistResolvedFleetId, user?.id]);

  const fetchDashboardData = useCallback(async ({ silent = false } = {}) => {
    if (!activeFleetId) return;
    if (!silent) setDriversLoading(true);

    try {
      const params = new URLSearchParams({
        fleetId: activeFleetId,
        alertLimit: '100',
      });

      if (user?.id) params.set('ownerUserId', user.id);
      if (ownerEmail) params.set('ownerEmail', ownerEmail);

      const response = await fetch(`/api/fleet-dashboard?${params.toString()}`, { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Fleet data could not be loaded.');

      persistResolvedFleetId(result.data.fleet.id);
      setFleet({ id: result.data.fleet.id, name: result.data.fleet.name || 'My Fleet' });
      setInviteCode(result.data.fleet.inviteCode || null);

      const incomingDrivers = result.data.drivers || [];
      const incomingAlerts = result.data.alerts || [];

      if (silent && previousDriversRef.current.length) {
        const previousMap = new Map(previousDriversRef.current.map((driver) => [driver.id, driver]));
        for (const driver of incomingDrivers) {
          const previousDriver = previousMap.get(driver.id);
          if (!previousDriver) {
            showToast(`New driver joined: ${driver.name || driver.phone}`, 'success');
            continue;
          }
          if (previousDriver.is_online && !driver.is_online) showToast(`Tracking stopped: ${driver.name || driver.phone} is now offline.`, 'error');
          if (!previousDriver.is_online && driver.is_online) showToast(`Tracking resumed: ${driver.name || driver.phone} is live again.`, 'success');
        }
      }

      if (silent && previousAlertsRef.current.length) {
        const previousAlertIds = new Set(previousAlertsRef.current.map((alert) => alert.id));
        for (const alert of incomingAlerts) {
          if (!previousAlertIds.has(alert.id)) {
            showToast(alert.message, alert.severity === 'high' ? 'error' : 'info');
            break;
          }
        }
      }

      previousDriversRef.current = incomingDrivers;
      previousAlertsRef.current = incomingAlerts;
      setDrivers(incomingDrivers);
      setAlerts(incomingAlerts);
    } catch (error) {
      if (!silent) showToast(error.message || 'Fleet data could not be loaded.', 'error');
    } finally {
      if (!silent) setDriversLoading(false);
    }
  }, [activeFleetId, ownerEmail, persistResolvedFleetId, showToast, user?.id]);

  useEffect(() => {
    ensureFleetExists();
  }, [ensureFleetExists]);

  useEffect(() => {
    if (!activeFleetId || !hasEnsuredFleet) return;
    fetchDashboardData();
  }, [activeFleetId, fetchDashboardData, hasEnsuredFleet]);

  useEffect(() => {
    if (!activeFleetId || !hasEnsuredFleet) return;
    const intervalId = setInterval(() => fetchDashboardData({ silent: true }), 10000);
    return () => clearInterval(intervalId);
  }, [activeFleetId, fetchDashboardData, hasEnsuredFleet]);

  const handleCompleteFleetSetup = useCallback(async () => {
    const trimmedFleetName = fleetSetupName.trim();
    if (!activeFleetId) return showToast('Owner account is still loading. Please wait a moment.', 'error');
    if (!trimmedFleetName) return showToast('Please enter a fleet name before continuing.', 'error');

    setIsSettingUpFleet(true);
    try {
      const updateResponse = await fetch('/api/fleet-dashboard', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fleetId: activeFleetId,
          ownerName: trimmedFleetName,
          ownerUserId: user?.id || null,
          ownerEmail,
        }),
      });
      const updateResult = await updateResponse.json();
      if (!updateResponse.ok || !updateResult.success) throw new Error(updateResult.error || 'Could not save fleet name.');

      const codeResponse = await fetch('/api/generate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fleetId: activeFleetId, ownerId: user?.id || null }),
      });
      const codeResult = await codeResponse.json();
      if (!codeResponse.ok || !codeResult.success) throw new Error(codeResult.error || 'Could not generate invite code.');

      setFleetSetupName('');
      showToast('Fleet setup complete. Your invite code is ready.', 'success');
      await fetchDashboardData();
    } catch (error) {
      showToast(error.message || 'Could not complete fleet setup.', 'error');
    } finally {
      setIsSettingUpFleet(false);
    }
  }, [activeFleetId, fetchDashboardData, fleetSetupName, ownerEmail, showToast, user?.id]);

  return {
    user,
    isLoaded,
    fleet,
    inviteCode,
    drivers,
    alerts,
    driversLoading,
    fleetSetupName,
    setFleetSetupName,
    isSettingUpFleet,
    hasEnsuredFleet,
    fleetEnsureError,
    ensureFleetExists,
    fetchDashboardData,
    handleCompleteFleetSetup,
    isFleetSetupPending,
    toast,
  };
}

export function OwnerShell({ section, fleet, user, children, toast }) {
  const pathname = usePathname();
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const syncStandalone = () => {
      setIsStandalone(window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true);
    };

    syncStandalone();
    window.addEventListener('focus', syncStandalone);
    window.addEventListener('safar-installed', syncStandalone);

    return () => {
      window.removeEventListener('focus', syncStandalone);
      window.removeEventListener('safar-installed', syncStandalone);
    };
  }, []);

  const canGoBack = pathname !== '/owner';

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_52%,#fff8f1_100%)] text-slate-900">
      <header className="sticky top-0 z-30 border-b border-sky-100 bg-white/92 backdrop-blur-xl app-safe-top">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <Link href="/" className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-600 shadow-[0_12px_24px_rgba(14,165,233,0.24)]">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <div className="min-w-0">
                <span className="block text-2xl font-extrabold tracking-tighter text-navy">SAFAR</span>
                <p className="mt-0.5 text-xs font-medium text-slate-500 sm:text-sm">Control your fleet</p>
              </div>
            </Link>

            <div className="flex min-w-0 items-center gap-3">
              {isStandalone && canGoBack ? (
                <button
                  onClick={() => window.history.back()}
                  className="inline-flex shrink-0 items-center gap-2 rounded-full border border-sky-100 bg-white px-3 py-2 text-sm font-semibold text-slate-600 shadow-[0_10px_24px_rgba(15,42,94,0.08)] transition hover:border-orange-200 hover:bg-orange-50 hover:text-slate-900 lg:hidden"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
                  </svg>
                  Back
                </button>
              ) : null}

              <nav className={`-mx-1 min-w-0 flex-1 items-center gap-1 overflow-x-auto px-1 py-1 sm:flex-wrap sm:overflow-visible sm:px-0 ${isStandalone ? 'hidden lg:flex' : 'flex'}`}>
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex shrink-0 items-center rounded-full px-3 py-2 text-sm font-semibold transition sm:px-4 ${
                      item.key === section
                        ? 'bg-slate-950 text-white shadow-[0_10px_24px_rgba(15,23,42,0.18)]'
                        : 'bg-transparent text-slate-600 hover:bg-orange-50 hover:text-slate-900'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              <UserButton
                appearance={{
                  elements: {
                    avatarBox: 'h-9 w-9 ring-1 ring-sky-100 shadow-[0_10px_20px_rgba(15,42,94,0.08)]',
                  },
                }}
                afterSignOutUrl="/"
              />
            </div>
          </div>
        </div>
      </header>

      <main className={`mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 ${isStandalone ? 'pb-32' : 'pb-12'}`}>
        <PwaInstallBanner />
        <PushNotificationBanner fleetId={fleet?.id} userId={user?.id} />
        {children}
      </main>

      {isStandalone ? <StandaloneBottomNav section={section} /> : null}

      <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${toast ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-2 opacity-0'}`}>
        {toast ? (
          <div className={`max-w-[calc(100vw-3rem)] rounded-2xl border px-4 py-3 text-sm font-medium shadow-lg ${
            toast.type === 'success'
              ? 'border-emerald-200 bg-white text-emerald-700'
              : toast.type === 'error'
                ? 'border-red-200 bg-white text-red-600'
                : 'border-stone-200 bg-white text-stone-700'
          }`}>
            <span className="break-words">{toast.message}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

