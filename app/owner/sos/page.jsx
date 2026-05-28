'use client';

import Link from 'next/link';
import {
  AlertBadge,
  EmptyState,
  FleetSetupPanel,
  OwnerShell,
  SurfaceCard,
  WorkspaceError,
  WorkspaceLoading,
  formatAlertTypeLabel,
  formatDriverDisplayName,
  formatVehicleIdentity,
  getDriverCoords,
  getDriverMapHref,
  hasValidLocation,
  useOwnerWorkspaceData,
} from '../_components/owner-shared';

export default function OwnerSosPage() {
  const workspace = useOwnerWorkspaceData();
  const sosAlerts = workspace.alerts.filter((alert) => alert.severity === 'high');

  return (
    <OwnerShell section="sos" fleet={workspace.fleet} user={workspace.user} toast={workspace.toast}>
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
        <div className="bg-white overflow-hidden border border-slate-200 rounded-2xl">
          <div className="border-b border-sky-100 px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-red-500">SOS Command</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">React fast to high-severity fleet incidents.</h1>
            <p className="mt-3 max-w-2xl text-base leading-8 text-slate-600">
              This page focuses on the most urgent alerts so owners can call the driver, open the live location, and react quickly to SOS, overspeed, or harsh-braking incidents.
            </p>
          </div>

          {!sosAlerts.length ? (
            <EmptyState title="No SOS-level incidents right now" description="High-severity alerts will be highlighted here with call and map actions as soon as they appear." />
          ) : (
            <div className="space-y-4 px-4 py-4 sm:px-6 sm:py-6">
              {sosAlerts.map((alert) => {
                const driver = workspace.drivers.find((entry) => entry.id === alert.driverId) || null;
                const coords = getDriverCoords(driver);
                const hasLocation = hasValidLocation(coords);

                return (
                  <div key={alert.id} className="rounded-[24px] border border-red-200 bg-[linear-gradient(180deg,#fff8f8_0%,#ffffff_100%)] p-5 shadow-[0_14px_34px_rgba(239,68,68,0.08)]">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-base font-semibold text-slate-950">
                            {formatDriverDisplayName({
                              name: alert.driverName,
                              vehiclePlate: alert.vehiclePlate,
                              vehicleModel: alert.vehicleModel,
                            }) || 'Driver alert'}
                          </p>
                          <AlertBadge severity={alert.severity} />
                          <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-red-600">
                            {formatAlertTypeLabel(alert.type)}
                          </span>
                        </div>
                        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">{alert.message}</p>
                        {alert.driverPhone ? <p className="mt-3 text-sm font-medium text-slate-500">{alert.driverPhone}</p> : null}
                        {formatVehicleIdentity({ vehiclePlate: alert.vehiclePlate, vehicleModel: alert.vehicleModel }) ? (
                          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-orange-500">
                            {formatVehicleIdentity({ vehiclePlate: alert.vehiclePlate, vehicleModel: alert.vehicleModel })}
                          </p>
                        ) : null}
                        <p className="mt-2 text-xs text-slate-400">
                          {alert.createdAt ? new Date(alert.createdAt).toLocaleString('en-IN') : 'Just now'}
                        </p>
                      </div>

                      <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                        {alert.driverPhone ? (
                          <a
                            href={`tel:${alert.driverPhone}`}
                            className="inline-flex items-center justify-center rounded-full bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(220,38,38,0.22)] transition hover:bg-red-500"
                          >
                            Call driver
                          </a>
                        ) : null}

                        {hasLocation ? (
                          <Link
                            href={getDriverMapHref(coords)}
                            target="_blank"
                            className="inline-flex items-center justify-center rounded-full border border-sky-100 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-slate-900"
                          >
                            Open location
                          </Link>
                        ) : (
                          <span className="inline-flex items-center justify-center rounded-full border border-stone-200 bg-stone-50 px-5 py-3 text-sm font-semibold text-stone-400">
                            No location yet
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </OwnerShell>
  );
}
