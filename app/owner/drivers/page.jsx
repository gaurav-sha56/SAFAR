'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  DutyBadge,
  EmptyState,
  FleetSetupPanel,
  OwnerShell,
  SafetyScoreBadge,
  StatusBadge,
  SurfaceCard,
  WorkspaceError,
  WorkspaceLoading,
  formatDriverDisplayName,
  formatVehicleIdentity,
  getDriverCoords,
  getDriverMapHref,
  hasValidLocation,
  useOwnerWorkspaceData,
} from '../_components/owner-shared';

export default function OwnerDriversPage() {
  const workspace = useOwnerWorkspaceData();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dutyFilter, setDutyFilter] = useState('all');
  const [scoreFilter, setScoreFilter] = useState('all');

  const filteredDrivers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return workspace.drivers.filter((driver) => {
      const matchesQuery = !query || [
        driver.name,
        driver.phone,
        driver.vehicle_plate,
        driver.vehicle_model,
      ].filter(Boolean).some((value) => String(value).toLowerCase().includes(query));

      const matchesStatus = statusFilter === 'all'
        || (statusFilter === 'active' ? driver.is_online : !driver.is_online);
      const matchesDuty = dutyFilter === 'all' || driver.dutyStatus === dutyFilter;
      const matchesScore = scoreFilter === 'all'
        || (scoreFilter === 'strong' && driver.safetyScore >= 85)
        || (scoreFilter === 'watch' && driver.safetyScore >= 65 && driver.safetyScore < 85)
        || (scoreFilter === 'risk' && driver.safetyScore < 65);

      return matchesQuery && matchesStatus && matchesDuty && matchesScore;
    });
  }, [workspace.drivers, search, statusFilter, dutyFilter, scoreFilter]);

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
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Every connected driver, status, score, and live route access.</h1>
            <p className="mt-3 max-w-2xl text-base leading-8 text-slate-600">
              Search by driver, vehicle, or phone, then filter the fleet by live status, duty state, or safety score band.
            </p>

            <div className="mt-6 grid gap-3 lg:grid-cols-[minmax(220px,1.4fr)_repeat(3,minmax(0,0.6fr))]">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search driver, phone, or vehicle"
                className="rounded-2xl border border-sky-100 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-orange-200"
              />
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-2xl border border-sky-100 bg-white px-4 py-3 text-sm text-slate-700 outline-none">
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="offline">Offline</option>
              </select>
              <select value={dutyFilter} onChange={(event) => setDutyFilter(event.target.value)} className="rounded-2xl border border-sky-100 bg-white px-4 py-3 text-sm text-slate-700 outline-none">
                <option value="all">All Duty States</option>
                <option value="on_duty">On Duty</option>
                <option value="break">Break</option>
                <option value="shift_ended">Shift Ended</option>
                <option value="off_duty">Off Duty</option>
              </select>
              <select value={scoreFilter} onChange={(event) => setScoreFilter(event.target.value)} className="rounded-2xl border border-sky-100 bg-white px-4 py-3 text-sm text-slate-700 outline-none">
                <option value="all">All Scores</option>
                <option value="strong">Strong</option>
                <option value="watch">Watch</option>
                <option value="risk">Risk</option>
              </select>
            </div>
          </div>

          {!filteredDrivers.length ? (
            <EmptyState title="No drivers match these filters" description="Try another search or clear one of the active filters." />
          ) : (
            <div className="space-y-3 px-4 py-4 sm:px-6 sm:py-6">
              {filteredDrivers.map((driver) => {
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
                            <p className="truncate text-base font-semibold text-slate-950">{formatDriverDisplayName(driver)}</p>
                            <StatusBadge status={driver.is_online ? 'active' : 'offline'} />
                            <DutyBadge dutyStatus={driver.dutyStatus} trackingExpected={driver.trackingExpected} />
                            <SafetyScoreBadge score={driver.safetyScore} />
                          </div>
                          <p className="mt-2 text-sm text-slate-500">{driver.phone}</p>
                          {formatVehicleIdentity({ vehiclePlate: driver.vehicle_plate, vehicleModel: driver.vehicle_model }) ? (
                            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-orange-500">
                              {formatVehicleIdentity({ vehiclePlate: driver.vehicle_plate, vehicleModel: driver.vehicle_model })}
                            </p>
                          ) : null}
                          <p className="mt-1 text-xs text-slate-400">
                            Last seen {driver.last_seen ? new Date(driver.last_seen).toLocaleString('en-IN') : 'Not available'}
                          </p>
                          {driver.lastTrackingReason ? (
                            <p className="mt-1 text-xs font-medium text-slate-500">
                              Last reason: {driver.lastTrackingReason.replace(/_/g, ' ')}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <Link
                          href={`/owner/drivers/${driver.id}`}
                          className="inline-flex items-center justify-center rounded-full border border-sky-100 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-slate-900"
                        >
                          View detail
                        </Link>
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
