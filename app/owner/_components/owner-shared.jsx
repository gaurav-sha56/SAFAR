'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { UserButton, useUser } from '@clerk/nextjs';

const DEFAULT_FLEET = { id: '', name: '' };

export const NAV_ITEMS = [
  { href: '/owner', label: 'Dashboard', key: 'dashboard' },
  { href: '/owner/drivers', label: 'Drivers', key: 'drivers' },
  { href: '/owner/alerts', label: 'Alerts', key: 'alerts' },
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

export function SurfaceCard({ children, className = '' }) {
  return <section className={`rounded-[28px] border border-sky-100 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] shadow-[0_18px_55px_rgba(15,42,94,0.08)] ${className}`}>{children}</section>;
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

  const isFleetSetupPending = hasEnsuredFleet && Boolean(derivedFleetId) && fleet.id === derivedFleetId && (!fleet.name || fleet.name === 'My Fleet');

  const ensureFleetExists = useCallback(async () => {
    if (!derivedFleetId) return;
    setHasEnsuredFleet(false);
    setFleetEnsureError('');

    try {
      const response = await fetch('/api/fleet-dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fleetId: derivedFleetId, ensureExists: true, ownerEmail: user?.primaryEmailAddress?.emailAddress || null }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        setFleetEnsureError(result?.error || 'Could not prepare your fleet workspace.');
        return;
      }
      setHasEnsuredFleet(true);
    } catch (error) {
      setFleetEnsureError(error?.message || 'Could not prepare your fleet workspace.');
    }
  }, [derivedFleetId, user?.primaryEmailAddress?.emailAddress]);

  const fetchDashboardData = useCallback(async ({ silent = false } = {}) => {
    if (!derivedFleetId) return;
    if (!silent) setDriversLoading(true);

    try {
      const response = await fetch(`/api/fleet-dashboard?fleetId=${encodeURIComponent(derivedFleetId)}&alertLimit=100`, { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Fleet data could not be loaded.');

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
  }, [derivedFleetId, showToast]);

  useEffect(() => {
    ensureFleetExists();
  }, [ensureFleetExists]);

  useEffect(() => {
    if (!derivedFleetId || !hasEnsuredFleet) return;
    fetchDashboardData();
  }, [derivedFleetId, fetchDashboardData, hasEnsuredFleet]);

  useEffect(() => {
    if (!derivedFleetId || !hasEnsuredFleet) return;
    const intervalId = setInterval(() => fetchDashboardData({ silent: true }), 10000);
    return () => clearInterval(intervalId);
  }, [derivedFleetId, fetchDashboardData, hasEnsuredFleet]);

  const handleCompleteFleetSetup = useCallback(async () => {
    const trimmedFleetName = fleetSetupName.trim();
    if (!derivedFleetId) return showToast('Owner account is still loading. Please wait a moment.', 'error');
    if (!trimmedFleetName) return showToast('Please enter a fleet name before continuing.', 'error');

    setIsSettingUpFleet(true);
    try {
      const updateResponse = await fetch('/api/fleet-dashboard', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fleetId: derivedFleetId, ownerName: trimmedFleetName }),
      });
      const updateResult = await updateResponse.json();
      if (!updateResponse.ok || !updateResult.success) throw new Error(updateResult.error || 'Could not save fleet name.');

      const codeResponse = await fetch('/api/generate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fleetId: derivedFleetId, ownerId: user?.id || null }),
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
  }, [derivedFleetId, fetchDashboardData, fleetSetupName, showToast, user?.id]);

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
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_52%,#fff8f1_100%)] text-slate-900">
      <header className="sticky top-0 z-30 border-b border-sky-100 bg-white/92 backdrop-blur-xl">
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
              <nav className="-mx-1 flex min-w-0 flex-1 items-center gap-1 overflow-x-auto px-1 py-1 sm:flex-wrap sm:overflow-visible sm:px-0">
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

      <main className="mx-auto max-w-7xl px-4 py-6 pb-12 sm:px-6 lg:px-8">{children}</main>

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
