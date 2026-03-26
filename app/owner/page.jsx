'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { UserButton, useUser } from '@clerk/nextjs';

const SAFAR_FLEET_ID = 'c5ffdf6b-11f0-4ef2-8f3b-bef40bd31467';
const DEFAULT_FLEET = {
  id: SAFAR_FLEET_ID,
  name: 'Safar Demo Fleet',
};

function hasValidLocation(coords) {
  return (
    coords &&
    typeof coords.lat === 'number' &&
    Number.isFinite(coords.lat) &&
    typeof coords.lng === 'number' &&
    Number.isFinite(coords.lng)
  );
}

function getDriverMapHref(coords) {
  return `https://www.openstreetmap.org/?mlat=${coords.lat}&mlon=${coords.lng}#map=16/${coords.lat}/${coords.lng}`;
}

function QuickStat({ label, value, accent = false }) {
  return (
    <div
      className={`min-h-[142px] rounded-[28px] border px-5 py-5 shadow-[0_18px_55px_rgba(15,42,94,0.08)] transition-all duration-200 hover:-translate-y-1 ${
        accent
          ? 'border-orange-200 bg-[linear-gradient(135deg,#fff7ed_0%,#ffffff_100%)]'
          : 'border-sky-100 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)]'
      }`}
    >
      <p className={`text-[11px] font-semibold uppercase tracking-[0.24em] ${accent ? 'text-orange-700' : 'text-sky-700'}`}>
        {label}
      </p>
      <p className="mt-3 text-3xl font-black tracking-tight text-slate-950">{value}</p>
    </div>
  );
}

function AlertBadge({ severity }) {
  const styles = {
    high: 'border-red-200 bg-red-50 text-red-700',
    medium: 'border-amber-200 bg-amber-50 text-amber-700',
    low: 'border-sky-200 bg-sky-50 text-sky-700',
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${styles[severity] || styles.medium}`}>
      {severity || 'Alert'}
    </span>
  );
}

function SafetyAlerts({ alerts }) {
  if (!alerts.length) {
    return (
      <div className="rounded-[32px] border border-sky-100 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-5 shadow-[0_18px_60px_rgba(15,42,94,0.08)] sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xs font-semibold tracking-widest text-sky-700 uppercase">Safety Alerts</h2>
            <p className="mt-1 text-sm text-stone-500">No active risk events right now. Fleet looks stable.</p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            All clear
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[32px] border border-sky-100 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-5 shadow-[0_18px_60px_rgba(15,42,94,0.08)] sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xs font-semibold tracking-widest text-sky-700 uppercase">Safety Alerts</h2>
          <p className="mt-1 text-sm text-stone-600">Industry-style warning feed for speed, braking, and device connectivity.</p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700">
          <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          {alerts.length} active
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {alerts.slice(0, 6).map((alert) => (
          <div key={alert.id} className="rounded-[24px] border border-sky-100 bg-white p-4 shadow-[0_10px_30px_rgba(15,42,94,0.05)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-stone-800">{alert.driverName || 'Driver Alert'}</p>
                  <AlertBadge severity={alert.severity} />
                </div>
                <p className="mt-2 text-sm leading-6 text-stone-600">{alert.message}</p>
                {alert.driverPhone ? (
                  <p className="mt-2 text-xs text-stone-400">{alert.driverPhone}</p>
                ) : null}
              </div>
              <p className="text-xs text-stone-400">
                {alert.createdAt ? new Date(alert.createdAt).toLocaleString('en-IN') : 'Just now'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CodeDisplay({ code }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!code) {
      return;
    }

    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const digits = code ? String(code).padStart(5, '0').split('') : ['-', '-', '-', '-', '-'];

  return (
    <div className="rounded-[32px] border border-sky-100 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-5 shadow-[0_18px_60px_rgba(15,42,94,0.08)] sm:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xs font-semibold tracking-widest text-sky-700 uppercase">
            Fleet Invite Code
          </h2>
          <p className="text-stone-500 text-sm mt-1">Share this fixed code with every driver in your fleet</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          Stable code
        </div>
      </div>

      <div className="mb-6 grid grid-cols-5 gap-2 sm:gap-3">
        {digits.map((digit, i) => (
          <div
            key={i}
            className="flex aspect-square items-center justify-center rounded-2xl border-2 border-orange-200 bg-[linear-gradient(180deg,#fffaf5_0%,#ffffff_100%)] text-2xl font-black tracking-[0.14em] text-slate-950 transition-all duration-300 min-[420px]:text-3xl sm:text-5xl"
          >
            {digit}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-xs leading-5 text-stone-400">
          {code ? 'This fleet uses one stable invite code for all linked drivers' : 'No invite code found for this fleet'}
        </span>
        <button
          onClick={handleCopy}
          disabled={!code}
          className="flex items-center gap-1.5 self-start text-sm text-stone-500 transition-colors duration-150 hover:text-sky-700 disabled:opacity-30 sm:self-auto"
        >
          {copied ? (
            <>
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-green-500 font-medium">Copied</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy code
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    active: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', label: 'Active' },
    idle: { color: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-400', label: 'Idle' },
    offline: { color: 'bg-stone-100 text-stone-500 border-stone-200', dot: 'bg-stone-400', label: 'Offline' },
  };
  const s = map[status] || map.offline;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${s.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot} ${status === 'active' ? 'animate-pulse' : ''}`} />
      {s.label}
    </span>
  );
}

function DriverRow({ driver, index }) {
  const coords =
    typeof driver.last_lat === 'number' && typeof driver.last_lng === 'number'
      ? { lat: driver.last_lat, lng: driver.last_lng }
      : null;
  const hasLocation = hasValidLocation(coords);
  const mapHref = hasLocation ? getDriverMapHref(coords) : null;
  const rowClasses = `group flex w-full flex-col gap-4 rounded-[24px] border p-4 text-left transition-colors duration-150 sm:flex-row sm:items-center ${
    hasLocation
      ? 'border-sky-100 hover:border-orange-200 hover:bg-orange-50/40 cursor-pointer'
      : 'border-transparent hover:border-sky-100 hover:bg-sky-50/40'
  }`;

  return (
    <a
      href={mapHref || undefined}
      target={hasLocation ? '_blank' : undefined}
      rel={hasLocation ? 'noopener noreferrer' : undefined}
      className={rowClasses}
      style={{ animationDelay: `${index * 60}ms` }}
      aria-disabled={!hasLocation}
    >
      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-sky-100">
        <span className="text-sm font-bold text-sky-700">
          {driver.name ? driver.name.charAt(0).toUpperCase() : driver.phone.slice(-2)}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-stone-800 truncate">{driver.name || 'Driver'}</p>
          <StatusBadge status={driver.is_online ? 'active' : 'offline'} />
        </div>
        <p className="text-xs text-stone-400 mt-0.5">{driver.phone}</p>
      </div>

      <div className="w-full flex-shrink-0 text-left sm:w-auto sm:text-right">
        {hasLocation ? (
          <>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-sky-700">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Open live map
            </span>
            <p className="text-xs text-stone-400 mt-0.5">
              {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
            </p>
          </>
        ) : (
          <span className="text-xs text-stone-300">Waiting for location from app</span>
        )}
        <p className="text-xs text-stone-300 mt-0.5">
          Last seen {driver.last_seen ? new Date(driver.last_seen).toLocaleString('en-IN') : 'Not available'}
        </p>
      </div>

      <div className="flex h-9 w-9 items-center justify-center self-end rounded-full bg-sky-50 text-stone-400 transition-colors group-hover:bg-white group-hover:text-sky-700 sm:self-auto">
        {hasLocation ? (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
      </div>
    </a>
  );
}

function DriverList({ drivers, loading }) {
  if (loading) {
    return (
      <div className="space-y-2 py-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-4 rounded-xl p-4 animate-pulse">
            <div className="w-10 h-10 bg-stone-200 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-stone-200 rounded w-1/3" />
              <div className="h-3 bg-stone-100 rounded w-1/5" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!drivers.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-14 h-14 bg-stone-100 rounded-2xl flex items-center justify-center mb-4">
          <svg className="w-7 h-7 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-stone-400">No drivers yet</p>
        <p className="text-xs text-stone-300 mt-1">Share the invite code above to get started</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-sky-50">
      {drivers.map((driver, i) => (
        <DriverRow key={driver.id} driver={driver} index={i} />
      ))}
    </div>
  );
}

export default function OwnerDashboard() {
  const { user } = useUser();
  const [fleet, setFleet] = useState(DEFAULT_FLEET);
  const [inviteCode, setInviteCode] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [driversLoading, setDriversLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const previousDriversRef = useRef([]);
  const previousAlertsRef = useRef([]);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const fetchDashboardData = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) {
        setDriversLoading(true);
      }

      try {
        const response = await fetch(
          `/api/fleet-dashboard?fleetId=${encodeURIComponent(SAFAR_FLEET_ID)}`,
          { cache: 'no-store' }
        );
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Fleet data could not be loaded.');
        }

        setFleet({
          id: result.data.fleet.id,
          name: result.data.fleet.name,
        });
        setInviteCode(result.data.fleet.inviteCode || null);
        const incomingDrivers = result.data.drivers || [];

        if (silent && previousDriversRef.current.length) {
          const previousMap = new Map(previousDriversRef.current.map((driver) => [driver.id, driver]));

          for (const driver of incomingDrivers) {
            const previousDriver = previousMap.get(driver.id);

            if (!previousDriver) {
              showToast(`New driver joined: ${driver.name || driver.phone}`, 'success');
              continue;
            }

            if (previousDriver.is_online && !driver.is_online) {
              showToast(`Tracking stopped: ${driver.name || driver.phone} is now offline.`, 'error');
            }

            if (!previousDriver.is_online && driver.is_online) {
              showToast(`Tracking resumed: ${driver.name || driver.phone} is live again.`, 'success');
            }
          }
        }

        previousDriversRef.current = incomingDrivers;
        setDrivers(incomingDrivers);
        const incomingAlerts = result.data.alerts || [];

        if (silent && previousAlertsRef.current.length) {
          const previousAlertIds = new Set(previousAlertsRef.current.map((alert) => alert.id));

          for (const alert of incomingAlerts) {
            if (!previousAlertIds.has(alert.id)) {
              showToast(alert.message, alert.severity === 'high' ? 'error' : 'info');
              break;
            }
          }
        }

        previousAlertsRef.current = incomingAlerts;
        setAlerts(incomingAlerts);
      } catch (error) {
        if (!silent) {
          showToast(error.message || 'Fleet data could not be loaded.', 'error');
        }
      } finally {
        if (!silent) {
          setDriversLoading(false);
        }
      }
    },
    [showToast]
  );

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchDashboardData({ silent: true });
    }, 10000);

    return () => clearInterval(intervalId);
  }, [fetchDashboardData]);

  const activeCount = drivers.filter((d) => d.is_online).length;

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_48%,#fff8f1_100%)] font-sans text-slate-900">
      <header className="relative overflow-hidden border-b border-sky-100 bg-white/95 backdrop-blur-sm">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.16),transparent_24%),radial-gradient(circle_at_left,rgba(249,115,22,0.12),transparent_24%)]" />
        <div className="relative mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-600 shadow-[0_14px_30px_rgba(14,165,233,0.28)]">
                <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-3xl font-extrabold tracking-tighter text-navy sm:text-4xl">SAFAR</span>
                  <span className="rounded-full border border-sky-100 bg-sky-50 px-2.5 py-1 text-[10px] font-semibold tracking-[0.22em] text-sky-700 uppercase">
                    Fleet Safety
                  </span>
                </div>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                  Live fleet overview, fixed invite code access, and fast driver tracking for day-to-day cab operations.
                </p>
              </div>
            </div>

            <div className="flex w-full items-center justify-between gap-3 rounded-[28px] border border-sky-100 bg-white px-4 py-3 shadow-[0_18px_45px_rgba(15,42,94,0.08)] sm:w-auto sm:min-w-[320px]">
              <div className="min-w-0 flex-1 text-left sm:text-right">
                <p className="text-sm font-semibold text-slate-900">{fleet.name}</p>
                <p className="truncate text-xs text-slate-500">{user?.primaryEmailAddress?.emailAddress || 'Fleet Owner'}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-700">
                  {fleet.name.charAt(0)}
                </div>
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: 'h-9 w-9',
                    },
                  }}
                  afterSignOutUrl="/"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-4 py-6 pb-10 sm:px-6 lg:px-8">
        <section className="rounded-[34px] border border-sky-100 bg-[linear-gradient(135deg,#ffffff_0%,#f8fbff_62%,#fff7ed_100%)] p-5 shadow-[0_24px_70px_rgba(15,42,94,0.10)] sm:p-6 lg:p-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.95fr)] lg:items-center">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-orange-500">Owner Dashboard</p>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
                Manage your fleet with a cleaner live overview.
              </h1>
              <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
                Review active drivers, monitor safety alerts, and keep invite access ready from one professional workspace.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <QuickStat label="Total Drivers" value={drivers.length} />
              <QuickStat label="Active Now" value={activeCount} accent />
              <QuickStat label="Fleet ID" value={fleet.id.slice(-8).toUpperCase()} />
              <div className="rounded-[28px] border border-emerald-200 bg-[linear-gradient(135deg,#ecfdf5_0%,#ffffff_100%)] px-5 py-5 shadow-[0_18px_55px_rgba(15,42,94,0.08)] transition-all duration-200 hover:-translate-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-700">Status</p>
                <div className="mt-3 flex items-center gap-2 text-xl font-black text-emerald-800">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.1fr)]">
          <div className="xl:sticky xl:top-6 xl:self-start">
            <CodeDisplay code={inviteCode} />
          </div>

          <div className="overflow-hidden rounded-[32px] border border-sky-100 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] shadow-[0_18px_60px_rgba(15,42,94,0.08)]">
            <div className="flex flex-col gap-4 border-b border-sky-100 px-5 py-5 sm:px-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <h2 className="text-xs font-semibold tracking-widest text-sky-700 uppercase">
                  Linked Drivers
                </h2>
                <p className="text-stone-600 text-sm mt-1">
                  {drivers.length} driver{drivers.length !== 1 ? 's' : ''} in this fleet
                </p>
                <p className="text-xs text-stone-400 mt-1">
                  Smooth live tracking with OpenStreetMap links and quick status refresh.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                <div className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-white px-3 py-1.5 text-xs font-medium text-slate-500">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Sync every 10s
                </div>
                <button
                  onClick={() => fetchDashboardData()}
                  className="inline-flex items-center justify-center gap-1 rounded-full border border-sky-100 bg-white px-4 py-2 text-xs font-medium text-slate-500 transition-colors hover:border-orange-200 hover:text-sky-700"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
              </div>
            </div>

            <div className="px-2 py-2 sm:px-3 sm:py-3">
              <DriverList drivers={drivers} loading={driversLoading} />
            </div>
          </div>
        </section>

        <section className="mt-6">
          <SafetyAlerts alerts={alerts} />
        </section>
      </main>

      <div
        className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${toast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}
      >
        {toast && (
          <div
            className={`max-w-[calc(100vw-3rem)] rounded-xl border px-4 py-3 text-sm font-medium shadow-lg ${
              toast.type === 'success'
                ? 'bg-white border-emerald-200 text-emerald-700'
                : toast.type === 'error'
                  ? 'bg-white border-red-200 text-red-600'
                  : 'bg-white border-stone-200 text-stone-700'
            }`}
          >
            <div className="flex items-start gap-3">
              {toast.type === 'success' ? (
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <span className="break-words">{toast.message}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
