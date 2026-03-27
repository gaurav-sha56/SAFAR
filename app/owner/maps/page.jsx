'use client';

import { useMemo, useState } from 'react';
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
  getEmbeddedMapHref,
  hasValidLocation,
  useOwnerWorkspaceData,
} from '../_components/owner-shared';

export default function OwnerMapsPage() {
  const workspace = useOwnerWorkspaceData();
  const driversWithLocation = useMemo(
    () => workspace.drivers.filter((driver) => hasValidLocation(getDriverCoords(driver))),
    [workspace.drivers]
  );
  const [selectedDriverId, setSelectedDriverId] = useState(null);
  const resolvedSelectedDriverId =
    selectedDriverId && driversWithLocation.some((driver) => driver.id === selectedDriverId)
      ? selectedDriverId
      : driversWithLocation[0]?.id || null;
  const selectedDriver = driversWithLocation.find((driver) => driver.id === resolvedSelectedDriverId) || null;
  const selectedCoords = getDriverCoords(selectedDriver);

  return (
    <OwnerShell section="maps" fleet={workspace.fleet} user={workspace.user} toast={workspace.toast}>
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
        <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
          <SurfaceCard className="overflow-hidden">
            <div className="border-b border-sky-100 px-6 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-orange-500">Fleet Map</p>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Browse all connected cars from one live map view.</h1>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Select any driver from the fleet and jump to their latest visible route instantly.
              </p>
            </div>

            {!workspace.drivers.length ? (
              <EmptyState title="No drivers joined yet" description="Drivers will appear here after they connect with your fleet invite code." />
            ) : (
              <div className="space-y-3 px-4 py-4">
                {workspace.drivers.map((driver) => {
                  const coords = getDriverCoords(driver);
                  const hasLocation = hasValidLocation(coords);

                  return (
                    <button
                      key={driver.id}
                      onClick={() => hasLocation && setSelectedDriverId(driver.id)}
                      className={`w-full rounded-[22px] border p-4 text-left transition ${
                        driver.id === resolvedSelectedDriverId
                          ? 'border-sky-300 bg-sky-50 shadow-[0_12px_28px_rgba(14,165,233,0.08)]'
                          : 'border-sky-100 bg-white hover:border-orange-200 hover:bg-orange-50/50'
                      } ${!hasLocation ? 'opacity-70' : ''}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-semibold text-slate-950">{driver.name || 'Driver'}</p>
                            <StatusBadge status={driver.is_online ? 'active' : 'offline'} />
                          </div>
                          <p className="mt-1 text-sm text-slate-500">{driver.phone}</p>
                        </div>
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 text-sm font-bold text-sky-700">
                          {(driver.name || driver.phone || 'D').charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <p className="mt-3 text-xs text-slate-400">
                        {hasLocation
                          ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`
                          : 'Waiting for a valid location update'}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </SurfaceCard>

          <SurfaceCard className="overflow-hidden">
            {!selectedDriver || !selectedCoords ? (
              <EmptyState
                title="No live map available yet"
                description="Once at least one connected driver shares a valid location, the owner map view will appear here."
              />
            ) : (
              <>
                <div className="flex flex-col gap-4 border-b border-sky-100 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">Selected Driver</p>
                    <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">{selectedDriver.name || 'Driver'}</h2>
                    <p className="mt-1 text-sm text-slate-500">{selectedDriver.phone}</p>
                  </div>
                  <a
                    href={getDriverMapHref(selectedCoords)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(15,23,42,0.18)] transition hover:bg-slate-800"
                  >
                    Open full map
                  </a>
                </div>

                <div className="p-4 sm:p-6">
                  <div className="overflow-hidden rounded-[24px] border border-sky-100 bg-sky-50">
                    <iframe
                      title={`${selectedDriver.name || 'Driver'} live map`}
                      src={getEmbeddedMapHref(selectedCoords)}
                      className="h-[540px] w-full border-0"
                      loading="lazy"
                    />
                  </div>
                </div>
              </>
            )}
          </SurfaceCard>
        </div>
      )}
    </OwnerShell>
  );
}
