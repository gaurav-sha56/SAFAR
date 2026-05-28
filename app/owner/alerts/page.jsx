'use client';

import { useMemo, useState } from 'react';
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
  useOwnerWorkspaceData,
} from '../_components/owner-shared';

const RESOLUTION_OPTIONS = [
  { value: 'resolved', label: 'Resolved' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'false_alarm', label: 'False Alarm' },
];

export default function OwnerAlertsPage() {
  const workspace = useOwnerWorkspaceData();
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [busyAlertId, setBusyAlertId] = useState(null);

  const availableTypes = useMemo(() => {
    return Array.from(new Set(workspace.alerts.map((alert) => alert.type).filter(Boolean)));
  }, [workspace.alerts]);

  const filteredAlerts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return workspace.alerts.filter((alert) => {
      const resolutionStatus = alert.resolutionStatus || (alert.resolvedAt ? 'resolved' : 'open');
      const matchesQuery = !query || [
        alert.driverName,
        alert.driverPhone,
        alert.message,
        alert.type,
        alert.vehiclePlate,
        alert.vehicleModel,
      ].filter(Boolean).some((value) => String(value).toLowerCase().includes(query));

      const matchesSeverity = severityFilter === 'all' || alert.severity === severityFilter;
      const matchesStatus = statusFilter === 'all' || resolutionStatus === statusFilter;
      const matchesType = typeFilter === 'all' || alert.type === typeFilter;

      return matchesQuery && matchesSeverity && matchesStatus && matchesType;
    });
  }, [workspace.alerts, search, severityFilter, statusFilter, typeFilter]);

  const handleResolve = async (alert, resolutionStatus) => {
    if (!alert?.id) return;

    const note = typeof window !== 'undefined'
      ? window.prompt(`Add note for marking this alert as ${resolutionStatus.replace(/_/g, ' ')} (optional):`, '')
      : '';

    setBusyAlertId(alert.id);
    try {
      const response = await fetch(`/api/fleet-alerts/${alert.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resolutionStatus,
          resolutionNote: note || null,
          resolvedBy: workspace.user?.primaryEmailAddress?.emailAddress || workspace.user?.id || 'owner',
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || 'Could not update alert.');
      }

      workspace.fetchDashboardData();
    } catch (error) {
      if (typeof window !== 'undefined') {
        window.alert(error.message || 'Could not update alert.');
      }
    } finally {
      setBusyAlertId(null);
    }
  };

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
        <div className="bg-white overflow-hidden border border-slate-200 rounded-2xl">
          <div className="border-b border-sky-100 px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-orange-500">Alerts Center</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Review every fleet alert in one timeline.</h1>
            <p className="mt-3 max-w-2xl text-base leading-8 text-slate-600">
              Search alerts, filter by severity or status, and resolve incidents once the team has reviewed them.
            </p>

            <div className="mt-6 grid gap-3 lg:grid-cols-[minmax(220px,1.4fr)_repeat(3,minmax(0,0.6fr))]">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search driver, phone, vehicle, or message"
                className="rounded-2xl border border-sky-100 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-orange-200"
              />
              <select value={severityFilter} onChange={(event) => setSeverityFilter(event.target.value)} className="rounded-2xl border border-sky-100 bg-white px-4 py-3 text-sm text-slate-700 outline-none">
                <option value="all">All Severities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-2xl border border-sky-100 bg-white px-4 py-3 text-sm text-slate-700 outline-none">
                <option value="all">All Statuses</option>
                <option value="open">Open</option>
                <option value="resolved">Resolved</option>
                <option value="reviewed">Reviewed</option>
                <option value="false_alarm">False Alarm</option>
              </select>
              <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="rounded-2xl border border-sky-100 bg-white px-4 py-3 text-sm text-slate-700 outline-none">
                <option value="all">All Types</option>
                {availableTypes.map((type) => (
                  <option key={type} value={type}>{formatAlertTypeLabel(type)}</option>
                ))}
              </select>
            </div>
          </div>

          {!filteredAlerts.length ? (
            <EmptyState title="No alerts match these filters" description="Try another search or wait for fresh safety events to arrive." />
          ) : (
            <div className="space-y-4 px-4 py-4 sm:px-6 sm:py-6">
              {filteredAlerts.map((alert) => {
                const resolutionStatus = alert.resolutionStatus || (alert.resolvedAt ? 'resolved' : 'open');

                return (
                  <div key={alert.id} className="rounded-[24px] border border-sky-100 bg-white p-5 shadow-[0_14px_34px_rgba(15,42,94,0.05)]">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
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
                              {formatAlertTypeLabel(alert.type)}
                            </span>
                          ) : null}
                          <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                            resolutionStatus === 'open'
                              ? 'border-amber-200 bg-amber-50 text-amber-700'
                              : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          }`}>
                            {resolutionStatus.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">{alert.message}</p>
                        {alert.driverPhone ? <p className="mt-3 text-sm font-medium text-slate-500">{alert.driverPhone}</p> : null}
                        {formatVehicleIdentity({ vehiclePlate: alert.vehiclePlate, vehicleModel: alert.vehicleModel }) ? (
                          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-orange-500">
                            {formatVehicleIdentity({ vehiclePlate: alert.vehiclePlate, vehicleModel: alert.vehicleModel })}
                          </p>
                        ) : null}
                        {alert.resolutionNote ? (
                          <p className="mt-2 text-sm text-slate-500">Resolution note: {alert.resolutionNote}</p>
                        ) : null}
                      </div>

                      <div className="flex flex-col items-start gap-3 lg:items-end">
                        <p className="text-xs font-medium text-slate-400">
                          {alert.createdAt ? new Date(alert.createdAt).toLocaleString('en-IN') : 'Just now'}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {RESOLUTION_OPTIONS.map((option) => (
                            <button
                              key={option.value}
                              onClick={() => handleResolve(alert, option.value)}
                              disabled={busyAlertId === alert.id}
                              className="rounded-full border border-sky-100 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {busyAlertId === alert.id ? 'Saving...' : option.label}
                            </button>
                          ))}
                        </div>
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
