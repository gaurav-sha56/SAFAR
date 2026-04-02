'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  AlertBadge,
  DutyBadge,
  EmptyState,
  FleetSetupPanel,
  OwnerShell,
  SafetyScoreBadge,
  StatusBadge,
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
} from '../../_components/owner-shared';

export default function OwnerDriverDetailPage() {
  const { driverId } = useParams();
  const workspace = useOwnerWorkspaceData();
  const driver = workspace.drivers.find((entry) => entry.id === driverId) || null;
  const driverAlerts = workspace.alerts.filter((alert) => alert.driverId === driverId);
  const coords = getDriverCoords(driver);
  const hasLocation = hasValidLocation(coords);

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
      ) : !driver ? (
        <WorkspaceError message="Driver not found in this fleet." onRetry={workspace.fetchDashboardData} />
      ) : (
        <div className="space-y-6">
          <SurfaceCard className="p-6 sm:p-8">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-orange-500">Driver Detail</p>
                <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{formatDriverDisplayName(driver)}</h1>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <StatusBadge status={driver.is_online ? 'active' : 'offline'} />
                  <DutyBadge dutyStatus={driver.dutyStatus} trackingExpected={driver.trackingExpected} />
                  <SafetyScoreBadge score={driver.safetyScore} />
                </div>
                <p className="mt-4 text-sm text-slate-500">{driver.phone}</p>
                {formatVehicleIdentity({ vehiclePlate: driver.vehicle_plate, vehicleModel: driver.vehicle_model }) ? (
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-orange-500">
                    {formatVehicleIdentity({ vehiclePlate: driver.vehicle_plate, vehicleModel: driver.vehicle_model })}
                  </p>
                ) : null}
                <p className="mt-2 text-sm text-slate-500">
                  Last seen {driver.last_seen ? new Date(driver.last_seen).toLocaleString('en-IN') : 'Not available'}
                </p>
                {driver.lastTrackingReason ? (
                  <p className="mt-1 text-sm text-slate-500">Last reason: {driver.lastTrackingReason.replace(/_/g, ' ')}</p>
                ) : null}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row xl:flex-col">
                <Link href="/owner/drivers" className="inline-flex items-center justify-center rounded-full border border-sky-100 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-slate-900">
                  Back to drivers
                </Link>
                <a href={`tel:${driver.phone}`} className="inline-flex items-center justify-center rounded-full border border-sky-100 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-slate-900">
                  Call driver
                </a>
                {hasLocation ? (
                  <Link href={getDriverMapHref(coords)} target="_blank" className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(15,23,42,0.18)] transition hover:bg-slate-800">
                    Open live map
                  </Link>
                ) : null}
              </div>
            </div>
          </SurfaceCard>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
            <SurfaceCard className="overflow-hidden">
              <div className="border-b border-sky-100 px-6 py-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">Recent Alerts</p>
                <p className="mt-2 text-sm text-slate-500">Latest safety events and interruptions linked to this driver.</p>
              </div>
              {!driverAlerts.length ? (
                <EmptyState title="No alerts for this driver" description="When incidents happen, this timeline will show them here." />
              ) : (
                <div className="space-y-3 px-4 py-4">
                  {driverAlerts.slice(0, 10).map((alert) => (
                    <div key={alert.id} className="rounded-[20px] border border-sky-100 bg-white px-4 py-4 shadow-[0_12px_30px_rgba(15,42,94,0.04)]">
                      <div className="flex flex-wrap items-center gap-2">
                        <AlertBadge severity={alert.severity} />
                        <span className="rounded-full border border-sky-100 bg-sky-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-700">
                          {formatAlertTypeLabel(alert.type)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{alert.message}</p>
                      <p className="mt-2 text-xs text-slate-400">{alert.createdAt ? new Date(alert.createdAt).toLocaleString('en-IN') : 'Just now'}</p>
                    </div>
                  ))}
                </div>
              )}
            </SurfaceCard>

            <SurfaceCard className="overflow-hidden">
              <div className="border-b border-sky-100 px-6 py-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">Driver Snapshot</p>
                <p className="mt-2 text-sm text-slate-500">Quick context for follow-up and review.</p>
              </div>
              <div className="space-y-3 px-4 py-4">
                <div className="rounded-[20px] border border-sky-100 bg-white px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Safety Score</p>
                  <p className="mt-2 text-3xl font-black text-slate-950">{driver.safetyScore}</p>
                </div>
                <div className="rounded-[20px] border border-sky-100 bg-white px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Tracking Expected</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{driver.trackingExpected ? 'Yes' : 'No'}</p>
                </div>
                <div className="rounded-[20px] border border-sky-100 bg-white px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Session ID</p>
                  <p className="mt-2 break-all text-sm text-slate-600">{driver.sessionId || 'Not available'}</p>
                </div>
                <div className="rounded-[20px] border border-sky-100 bg-white px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Duty Changed</p>
                  <p className="mt-2 text-sm text-slate-600">
                    {driver.dutyStatusChangedAt ? new Date(driver.dutyStatusChangedAt).toLocaleString('en-IN') : 'Not available'}
                  </p>
                </div>
              </div>
            </SurfaceCard>
          </div>
        </div>
      )}
    </OwnerShell>
  );
}
