'use client';

import {
  AlertBadge,
  EmptyState,
  FleetSetupPanel,
  OwnerShell,
  SurfaceCard,
  WorkspaceError,
  WorkspaceLoading,
  formatDriverDisplayName,
  formatVehicleIdentity,
  useOwnerWorkspaceData,
} from '../_components/owner-shared';

export default function OwnerAlertsPage() {
  const workspace = useOwnerWorkspaceData();

  return (
    <OwnerShell section="alerts" fleet={workspace.fleet} user={workspace.user} toast={workspace.toast}>
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
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-orange-500">Alerts Center</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Review every fleet alert in one timeline.</h1>
            <p className="mt-3 max-w-2xl text-base leading-8 text-slate-600">
              Scan the latest warnings, identify high-severity incidents, and stay ahead of offline or risky driver events.
            </p>
          </div>

          {!workspace.alerts.length ? (
            <EmptyState title="No alerts in this fleet" description="Fresh alerts will appear here as drivers move, disconnect, or trigger safety events." />
          ) : (
            <div className="space-y-4 px-4 py-4 sm:px-6 sm:py-6">
              {workspace.alerts.map((alert) => (
                <div key={alert.id} className="rounded-[24px] border border-sky-100 bg-white p-5 shadow-[0_14px_34px_rgba(15,42,94,0.05)]">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-semibold text-slate-950">
                          {formatDriverDisplayName({
                            name: alert.driverName,
                            vehiclePlate: alert.vehiclePlate,
                            vehicleModel: alert.vehicleModel,
                          }) || 'Fleet alert'}
                        </p>
                        <AlertBadge severity={alert.severity} />
                        {alert.type ? (
                          <span className="rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                            {alert.type}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">{alert.message}</p>
                      {alert.driverPhone ? <p className="mt-3 text-sm font-medium text-slate-500">{alert.driverPhone}</p> : null}
                      {formatVehicleIdentity({ vehiclePlate: alert.vehiclePlate, vehicleModel: alert.vehicleModel }) ? (
                        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-orange-500">
                          {formatVehicleIdentity({ vehiclePlate: alert.vehiclePlate, vehicleModel: alert.vehicleModel })}
                        </p>
                      ) : null}
                    </div>
                    <p className="text-xs font-medium text-slate-400">
                      {alert.createdAt ? new Date(alert.createdAt).toLocaleString('en-IN') : 'Just now'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SurfaceCard>
      )}
    </OwnerShell>
  );
}
