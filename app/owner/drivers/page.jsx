'use client';

import Link from 'next/link';
import {
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
} from '../_components/owner-shared';

export default function OwnerDriversPage() {
  const workspace = useOwnerWorkspaceData();

  return (
    <OwnerShell section="drivers" fleet={workspace.fleet} user={workspace.user} toast={workspace.toast}>
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
        <SurfaceCard className="overflow-hidden">
          <div className="border-b border-sky-100 px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-orange-500">Drivers Directory</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Every connected driver, status, phone, and live route access.</h1>
            <p className="mt-3 max-w-2xl text-base leading-8 text-slate-600">
              Use this page to scan your whole fleet, call drivers, and jump straight into their current route when location is available.
            </p>
          </div>

          {!workspace.drivers.length ? (
            <EmptyState title="No drivers in this fleet yet" description="As soon as drivers join with your invite code, they will appear here with status and map access." />
          ) : (
            <div className="space-y-3 px-4 py-4 sm:px-6 sm:py-6">
              {workspace.drivers.map((driver) => {
                const coords = getDriverCoords(driver);
                const hasLocation = hasValidLocation(coords);
                return (
                  <div key={driver.id} className="rounded-[24px] border border-sky-100 bg-white p-5 shadow-[0_14px_34px_rgba(15,42,94,0.05)]">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-base font-bold text-sky-700">
                          {(driver.name || driver.phone || 'D').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-base font-semibold text-slate-950">{driver.name || 'Driver'}</p>
                            <StatusBadge status={driver.is_online ? 'active' : 'offline'} />
                          </div>
                          <p className="mt-2 text-sm text-slate-500">{driver.phone}</p>
                          <p className="mt-1 text-xs text-slate-400">
                            Last seen {driver.last_seen ? new Date(driver.last_seen).toLocaleString('en-IN') : 'Not available'}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <a
                          href={`tel:${driver.phone}`}
                          className="inline-flex items-center justify-center rounded-full border border-sky-100 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-slate-900"
                        >
                          Call driver
                        </a>
                        {hasLocation ? (
                          <Link
                            href={getDriverMapHref(coords)}
                            target="_blank"
                            className="inline-flex items-center justify-center rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(15,23,42,0.18)] transition hover:bg-slate-800"
                          >
                            Open live map
                          </Link>
                        ) : (
                          <span className="inline-flex items-center justify-center rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-sm font-semibold text-stone-400">
                            Waiting for location
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SurfaceCard>
      )}
    </OwnerShell>
  );
}
