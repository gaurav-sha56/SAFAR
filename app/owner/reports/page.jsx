'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertBadge,
  DutyBadge,
  EmptyState,
  FleetSetupPanel,
  OwnerShell,
  SurfaceCard,
  WorkspaceError,
  WorkspaceLoading,
  formatAlertTypeLabel,
  useOwnerWorkspaceData,
} from '../_components/owner-shared';

const REPORT_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

function MetricCard({ label, value, hint, tone = 'sky' }) {
  const styles = {
    sky: 'border-sky-100 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] text-sky-700',
    orange: 'border-orange-200 bg-[linear-gradient(135deg,#fff7ed_0%,#ffffff_100%)] text-orange-600',
    red: 'border-red-200 bg-[linear-gradient(135deg,#fff5f5_0%,#ffffff_100%)] text-red-600',
    emerald: 'border-emerald-200 bg-[linear-gradient(135deg,#ecfdf5_0%,#ffffff_100%)] text-emerald-700',
  };

  return (
    <div className={`rounded-[24px] border px-5 py-5 shadow-[0_16px_40px_rgba(15,42,94,0.06)] ${styles[tone] || styles.sky}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em]">{label}</p>
      <p className="mt-4 text-3xl font-black tracking-tight text-slate-950">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{hint}</p>
    </div>
  );
}

function formatDateRange(window) {
  if (!window?.startDate || !window?.endDate) return '';
  const start = new Date(window.startDate).toLocaleDateString('en-IN');
  const end = new Date(window.endDate).toLocaleDateString('en-IN');
  return `${start} to ${end}`;
}

export default function OwnerReportsPage() {
  const workspace = useOwnerWorkspaceData();
  const [period, setPeriod] = useState('weekly');
  const [report, setReport] = useState(null);
  const [reportError, setReportError] = useState('');
  const [isLoadingReport, setIsLoadingReport] = useState(false);

  useEffect(() => {
    if (!workspace.hasEnsuredFleet || !workspace.fleet?.id) return;

    let cancelled = false;

    const loadReport = async () => {
      setIsLoadingReport(true);
      setReportError('');

      try {
        const params = new URLSearchParams({
          fleetId: workspace.fleet.id,
          period,
        });

        if (workspace.user?.id) params.set('ownerUserId', workspace.user.id);
        if (workspace.user?.primaryEmailAddress?.emailAddress) {
          params.set('ownerEmail', workspace.user.primaryEmailAddress.emailAddress);
        }

        const response = await fetch(`/api/fleet-reports?${params.toString()}`, { cache: 'no-store' });
        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Could not load report.');
        }

        if (!cancelled) {
          setReport(result.data);
        }
      } catch (error) {
        if (!cancelled) {
          setReportError(error.message || 'Could not load report.');
          setReport(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingReport(false);
        }
      }
    };

    loadReport();
    return () => {
      cancelled = true;
    };
  }, [period, workspace.fleet?.id, workspace.hasEnsuredFleet, workspace.user?.id, workspace.user?.primaryEmailAddress?.emailAddress]);

  const reportTitle = useMemo(() => {
    const option = REPORT_OPTIONS.find((entry) => entry.value === period);
    return option ? `${option.label} Fleet Report` : 'Fleet Report';
  }, [period]);

  return (
    <OwnerShell section="reports" fleet={workspace.fleet} user={workspace.user} toast={workspace.toast}>
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
        <div className="space-y-6 print:space-y-4">
          <SurfaceCard className="p-6 sm:p-8 print:shadow-none print:border-slate-200">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-orange-500">Fleet Reports</p>
                <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{reportTitle}</h1>
                <p className="mt-3 max-w-3xl text-base leading-8 text-slate-600">
                  Review recent safety behavior, duty compliance, and operational risks for your fleet. Use Print and save as PDF for sharing.
                </p>
                {report?.window ? (
                  <p className="mt-3 text-sm font-medium text-slate-500">
                    Report Window: {formatDateRange(report.window)}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="inline-flex rounded-full border border-sky-100 bg-white p-1 shadow-[0_10px_24px_rgba(15,42,94,0.06)]">
                  {REPORT_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setPeriod(option.value)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        option.value === period
                          ? 'bg-slate-950 text-white'
                          : 'text-slate-600 hover:bg-orange-50 hover:text-slate-900'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(15,23,42,0.18)] transition hover:bg-slate-800 print:hidden"
                >
                  Print / Save PDF
                </button>
              </div>
            </div>
          </SurfaceCard>

          {isLoadingReport ? (
            <WorkspaceLoading message="Preparing report..." />
          ) : reportError ? (
            <WorkspaceError message={reportError} onRetry={() => setPeriod((value) => value)} />
          ) : !report ? (
            <EmptyState title="No report yet" description="Choose a report window once fleet data is ready." />
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard label="Total Alerts" value={report.summary.totalAlerts} hint="All incidents in this window." />
                <MetricCard label="High Alerts" value={report.summary.highAlerts} hint="Urgent issues needing quick action." tone="red" />
                <MetricCard label="On Duty" value={report.summary.onDutyDrivers} hint="Drivers currently expected to stay trackable." tone="emerald" />
                <MetricCard label="Tracking Interruptions" value={report.summary.dutyTrackingInterruptions} hint="Mid-duty tracking drop-offs." tone="orange" />
              </div>

              <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
                <SurfaceCard className="overflow-hidden print:shadow-none">
                  <div className="border-b border-sky-100 px-6 py-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">Risk Drivers</p>
                    <p className="mt-2 text-sm text-slate-500">Drivers ranked by recent alert pressure and duty-compliance risk.</p>
                  </div>
                  {!report.topRiskDrivers.length ? (
                    <EmptyState title="No risk spikes in this window" description="When new incidents happen, the highest-risk drivers will surface here." />
                  ) : (
                    <div className="space-y-3 px-4 py-4">
                      {report.topRiskDrivers.map((driver) => (
                        <div key={driver.id} className="rounded-[22px] border border-sky-100 bg-white p-4 shadow-[0_12px_30px_rgba(15,42,94,0.04)]">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-semibold text-slate-950">{driver.name}</p>
                                <DutyBadge dutyStatus={driver.dutyStatus} trackingExpected={driver.trackingExpected} />
                              </div>
                              <p className="mt-2 text-sm text-slate-500">
                                Alerts: {driver.totalAlerts} | High: {driver.highAlerts} | Overspeed: {driver.overspeedCount} | Harsh Braking: {driver.harshBrakingCount}
                              </p>
                              <p className="mt-1 text-xs text-slate-400">
                                Interruptions: {driver.interruptionCount} | Last seen {driver.lastSeen ? new Date(driver.lastSeen).toLocaleString('en-IN') : 'Not available'}
                              </p>
                            </div>
                            <div className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-center">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-600">Risk Score</p>
                              <p className="mt-2 text-2xl font-black text-slate-950">{driver.riskScore}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </SurfaceCard>

                <SurfaceCard className="overflow-hidden print:shadow-none">
                  <div className="border-b border-sky-100 px-6 py-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">Recommendations</p>
                    <p className="mt-2 text-sm text-slate-500">Use these action points in owner reviews or PDF handoffs.</p>
                  </div>
                  <div className="space-y-3 px-4 py-4">
                    {report.recommendations.map((item) => (
                      <div key={item} className="rounded-[22px] border border-sky-100 bg-white px-4 py-4 text-sm leading-7 text-slate-600 shadow-[0_12px_30px_rgba(15,42,94,0.04)]">
                        {item}
                      </div>
                    ))}
                  </div>
                </SurfaceCard>
              </div>

              <div className="grid gap-6 xl:grid-cols-2">
                <SurfaceCard className="overflow-hidden print:shadow-none">
                  <div className="border-b border-sky-100 px-6 py-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">Top Alert Types</p>
                    <p className="mt-2 text-sm text-slate-500">Most common alert patterns in the selected report window.</p>
                  </div>
                  {!report.topAlertTypes.length ? (
                    <EmptyState title="No alerts recorded" description="Alert distribution will appear here after new incidents are captured." />
                  ) : (
                    <div className="space-y-3 px-4 py-4">
                      {report.topAlertTypes.map((item) => (
                        <div key={item.type} className="flex items-center justify-between rounded-[20px] border border-sky-100 bg-white px-4 py-4 shadow-[0_12px_30px_rgba(15,42,94,0.04)]">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                            <p className="mt-1 text-xs text-slate-400">{item.type}</p>
                          </div>
                          <p className="text-2xl font-black text-slate-950">{item.count}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </SurfaceCard>

                <SurfaceCard className="overflow-hidden print:shadow-none">
                  <div className="border-b border-sky-100 px-6 py-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">Recent Report Alerts</p>
                    <p className="mt-2 text-sm text-slate-500">Latest incidents included in this report window.</p>
                  </div>
                  {!report.alerts.length ? (
                    <EmptyState title="No alerts in this report window" description="When incidents occur, they will be included here for export." />
                  ) : (
                    <div className="space-y-3 px-4 py-4">
                      {report.alerts.slice(0, 8).map((alert) => (
                        <div key={alert.id} className="rounded-[20px] border border-sky-100 bg-white px-4 py-4 shadow-[0_12px_30px_rgba(15,42,94,0.04)]">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-slate-950">{alert.driverName || 'Driver alert'}</p>
                            <AlertBadge severity={alert.severity} />
                            <span className="rounded-full border border-sky-100 bg-sky-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-700">
                              {formatAlertTypeLabel(alert.type)}
                            </span>
                          </div>
                          <p className="mt-2 text-sm leading-6 text-slate-600">{alert.message}</p>
                          <p className="mt-2 text-xs text-slate-400">{new Date(alert.createdAt).toLocaleString('en-IN')}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </SurfaceCard>
              </div>
            </>
          )}
        </div>
      )}
    </OwnerShell>
  );
}
