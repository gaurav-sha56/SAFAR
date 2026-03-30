'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  AlertBadge,
  EmptyState,
  FleetSetupPanel,
  OwnerShell,
  StatusBadge,
  SurfaceCard,
  WorkspaceError,
  WorkspaceLoading,
  getDriverCoords,
  getDriverMapHref,
  hasValidLocation,
  useOwnerWorkspaceData,
} from './_components/owner-shared';

function QuickStat({ label, value, tone = 'sky' }) {
  const styles = {
    sky: 'border-sky-100 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] text-sky-700',
    orange: 'border-orange-200 bg-[linear-gradient(135deg,#fff7ed_0%,#ffffff_100%)] text-orange-600',
    emerald: 'border-emerald-200 bg-[linear-gradient(135deg,#ecfdf5_0%,#ffffff_100%)] text-emerald-700',
  };

  return (
    <div className={`rounded-[26px] border px-5 py-5 shadow-[0_18px_45px_rgba(15,42,94,0.06)] ${styles[tone] || styles.sky}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.26em]">{label}</p>
      <p className="mt-4 text-4xl font-black tracking-tight text-slate-950">{value}</p>
    </div>
  );
}

function InviteCodeCard({ code }) {
  const [copied, setCopied] = useState(false);
  const digits = code ? String(code).padStart(5, '0').split('') : ['-', '-', '-', '-', '-'];

  const handleCopy = async () => {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <SurfaceCard className="p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">Fleet Invite Code</p>
          <p className="mt-2 text-sm leading-6 text-slate-500">Share this stable code with every driver who needs to connect to your fleet.</p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Stable code
        </span>
      </div>

      <div className="mt-6 grid grid-cols-5 gap-2 sm:gap-3">
        {digits.map((digit, index) => (
          <div
            key={`${digit}-${index}`}
            className="flex aspect-square items-center justify-center rounded-2xl border-2 border-orange-200 bg-[linear-gradient(180deg,#fffaf5_0%,#ffffff_100%)] text-3xl font-black tracking-[0.14em] text-slate-950 shadow-[0_10px_24px_rgba(249,115,22,0.08)] sm:text-5xl"
          >
            {digit}
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-5 text-slate-400">
          {code ? 'This fleet uses one stable invite code for all linked drivers.' : 'No invite code is available yet.'}
        </p>
        <button
          onClick={handleCopy}
          disabled={!code}
          className="inline-flex items-center gap-2 self-start text-sm font-semibold text-slate-500 transition hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          {copied ? 'Copied' : 'Copy code'}
        </button>
      </div>
    </SurfaceCard>
  );
}

function RecentDriversCard({ drivers }) {
  const recentDrivers = drivers.slice(0, 5);

  return (
    <SurfaceCard className="overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-sky-100 px-6 py-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">Recent Drivers</p>
          <p className="mt-2 text-sm text-slate-500">Top linked drivers with quick status, phone, and map access.</p>
        </div>
        <Link href="/owner/drivers" className="inline-flex items-center rounded-full border border-sky-100 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-slate-900">
          View all drivers
        </Link>
      </div>

      {!recentDrivers.length ? (
        <EmptyState title="No drivers connected yet" description="Once drivers join with your invite code, their latest status and phone details will appear here." />
      ) : (
        <div className="divide-y divide-sky-50 px-3 py-3">
          {recentDrivers.map((driver) => {
            const coords = getDriverCoords(driver);
            const hasLocation = hasValidLocation(coords);
            return (
              <div key={driver.id} className="flex flex-col gap-4 rounded-[22px] px-3 py-4 transition hover:bg-sky-50/60 md:flex-row md:items-center md:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-sky-100 text-sm font-bold text-sky-700">
                    {(driver.name || driver.phone || 'D').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-slate-900">{driver.name || 'Driver'}</p>
                      <StatusBadge status={driver.is_online ? 'active' : 'offline'} />
                    </div>
                    <p className="mt-1 text-sm text-slate-500">{driver.phone}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 text-left md:items-end md:text-right">
                  {hasLocation ? (
                    <Link href={getDriverMapHref(coords)} target="_blank" className="text-sm font-semibold text-sky-700 transition hover:text-orange-600">
                      Open live map
                    </Link>
                  ) : (
                    <p className="text-sm font-medium text-slate-300">Waiting for location</p>
                  )}
                  <p className="text-xs text-slate-400">
                    Last seen {driver.last_seen ? new Date(driver.last_seen).toLocaleString('en-IN') : 'Not available'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </SurfaceCard>
  );
}

function RecentAlertsCard({ alerts }) {
  const recentAlerts = alerts.slice(0, 5);

  return (
    <SurfaceCard className="overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-sky-100 px-6 py-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">Recent Alerts</p>
          <p className="mt-2 text-sm text-slate-500">Latest alert feed for overspeed, SOS, offline activity, and fleet safety events.</p>
        </div>
        <Link href="/owner/alerts" className="inline-flex items-center rounded-full border border-sky-100 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-slate-900">
          View all alerts
        </Link>
      </div>

      {!recentAlerts.length ? (
        <EmptyState title="No active alerts right now" description="Your latest safety events will show up here so the owner can react quickly." />
      ) : (
        <div className="space-y-3 px-4 py-4">
          {recentAlerts.map((alert) => (
            <div key={alert.id} className="rounded-[22px] border border-sky-100 bg-white p-4 shadow-[0_12px_30px_rgba(15,42,94,0.04)]">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900">{alert.driverName || 'Fleet alert'}</p>
                    <AlertBadge severity={alert.severity} />
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{alert.message}</p>
                </div>
                <p className="text-xs text-slate-400">{alert.createdAt ? new Date(alert.createdAt).toLocaleString('en-IN') : 'Just now'}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </SurfaceCard>
  );
}

export default function OwnerDashboardPage() {
  const workspace = useOwnerWorkspaceData();
  const activeDrivers = workspace.drivers.filter((driver) => driver.is_online).length;
  const highAlerts = workspace.alerts.filter((alert) => alert.severity === 'high').length;

  return (
    <OwnerShell section="dashboard" fleet={workspace.fleet} user={workspace.user} toast={workspace.toast}>
      {!workspace.isLoaded ? (
        <WorkspaceLoading />
      ) : workspace.fleetEnsureError ? (
        <WorkspaceError message={workspace.fleetEnsureError} onRetry={workspace.ensureFleetExists} />
      ) : workspace.isFleetSetupPending ? (
        <FleetSetupPanel
          fleetSetupName={workspace.fleetSetupName}
          setFleetSetupName={workspace.setFleetSetupName}
          onSubmit={workspace.handleCompleteFleetSetup}
          isSettingUpFleet={workspace.isSettingUpFleet}
        />
      ) : (
        <div className="space-y-6">
          <SurfaceCard className="p-6 sm:p-8">
            <div className="grid gap-8 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.9fr)] xl:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-orange-500">Owner Dashboard</p>
                <h1 className="mt-4 max-w-3xl text-4xl font-brown tracking-tight text-slate-950 sm:text-5xl">
                  Keep your fleet, drivers, alerts, and live routes under one control center.
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">
                  Monitor recent driver activity, scan emergency alerts, and move straight into maps or SOS actions without losing context.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <QuickStat label="Total Drivers" value={workspace.drivers.length} />
                <QuickStat label="Active Now" value={activeDrivers} tone="orange" />
                <QuickStat label="High Alerts" value={highAlerts} />
                <QuickStat label="Status" value="Live" tone="emerald" />
              </div>
            </div>
          </SurfaceCard>

          <div className="grid gap-6 xl:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.1fr)]">
            <InviteCodeCard code={workspace.inviteCode} />
            <RecentDriversCard drivers={workspace.drivers} />
          </div>

          <RecentAlertsCard alerts={workspace.alerts} />
        </div>
      )}
    </OwnerShell>
  );
}
