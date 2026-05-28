'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertBadge,
  DutyBadge,
  EmptyState,
  FleetSetupPanel,
  OwnerShell,
  SafetyScoreBadge,
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

function escapeCsvValue(value) {
  const normalized = value == null ? '' : String(value);
  if (/[",\n]/.test(normalized)) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }
  return normalized;
}

function buildReportCsv(report) {
  const rows = [
    ['Fleet Report', report.fleet?.name || 'My Fleet'],
    ['Period', report.window?.label || 'Weekly'],
    ['Window', formatDateRange(report.window)],
    [],
    ['Summary'],
    ['Metric', 'Value'],
    ['Total Drivers', report.summary.totalDrivers],
    ['Active Drivers', report.summary.activeDrivers],
    ['On Duty Drivers', report.summary.onDutyDrivers],
    ['Off Duty Drivers', report.summary.offDutyDrivers],
    ['Break Drivers', report.summary.breakDrivers],
    ['Total Alerts', report.summary.totalAlerts],
    ['High Alerts', report.summary.highAlerts],
    ['Medium Alerts', report.summary.mediumAlerts],
    ['Harsh Braking Alerts', report.summary.harshBrakingAlerts],
    ['Overspeed Alerts', report.summary.overspeedAlerts],
    ['Duty Tracking Interruptions', report.summary.dutyTrackingInterruptions],
    [],
    ['Driver Summary'],
    ['Driver', 'Duty Status', 'Tracking Expected', 'Total Alerts', 'High Alerts', 'Overspeed', 'Harsh Braking', 'Interruptions', 'Risk Score', 'Last Seen'],
    ...report.driverSummaries.map((driver) => ([
      driver.name,
      driver.dutyStatus,
      driver.trackingExpected ? 'Yes' : 'No',
      driver.totalAlerts,
      driver.highAlerts,
      driver.overspeedCount,
      driver.harshBrakingCount,
      driver.interruptionCount,
      driver.riskScore,
      driver.lastSeen ? new Date(driver.lastSeen).toLocaleString('en-IN') : '',
    ])),
    [],
    ['Recent Alerts'],
    ['Time', 'Driver', 'Type', 'Severity', 'Message'],
    ...report.alerts.map((alert) => ([
      alert.createdAt ? new Date(alert.createdAt).toLocaleString('en-IN') : '',
      alert.driverName || 'Driver',
      formatAlertTypeLabel(alert.type),
      alert.severity,
      alert.message,
    ])),
  ];

  return rows
    .map((row) => row.map((cell) => escapeCsvValue(cell)).join(','))
    .join('\n');
}

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

function getRiskBand(score) {
  if (score >= 18) {
    return {
      label: 'Critical',
      className: 'border-red-200 bg-red-50 text-red-700',
    };
  }
  if (score >= 10) {
    return {
      label: 'Watch',
      className: 'border-amber-200 bg-amber-50 text-amber-700',
    };
  }
  return {
    label: 'Stable',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  };
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
  const [schedules, setSchedules] = useState([]);
  const [scheduleBusy, setScheduleBusy] = useState('');

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

  useEffect(() => {
    if (!workspace.hasEnsuredFleet || !workspace.fleet?.id) return;

    let cancelled = false;
    const loadSchedules = async () => {
      try {
        const params = new URLSearchParams({
          fleetId: workspace.fleet.id,
        });
        if (workspace.user?.id) params.set('ownerUserId', workspace.user.id);
        if (workspace.user?.primaryEmailAddress?.emailAddress) {
          params.set('ownerEmail', workspace.user.primaryEmailAddress.emailAddress);
        }

        const response = await fetch(`/api/fleet-report-schedules?${params.toString()}`, { cache: 'no-store' });
        const result = await response.json();
        if (!response.ok || !result.success) return;
        if (!cancelled) setSchedules(result.data || []);
      } catch {
        if (!cancelled) setSchedules([]);
      }
    };

    loadSchedules();
    return () => {
      cancelled = true;
    };
  }, [workspace.fleet?.id, workspace.hasEnsuredFleet, workspace.user?.id, workspace.user?.primaryEmailAddress?.emailAddress]);

  const reportTitle = useMemo(() => {
    const option = REPORT_OPTIONS.find((entry) => entry.value === period);
    return option ? `${option.label} Fleet Report` : 'Fleet Report';
  }, [period]);

  const handleDownloadCsv = () => {
    if (!report || typeof window === 'undefined') return;

    const csv = buildReportCsv(report);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${(report.fleet?.name || 'fleet').replace(/\s+/g, '-').toLowerCase()}-${report.window?.period || 'weekly'}-report.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveSchedule = async (selectedPeriod, enabled) => {
    if (!workspace.fleet?.id) return;

    setScheduleBusy(selectedPeriod);
    try {
      const response = await fetch('/api/fleet-report-schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fleetId: workspace.fleet.id,
          ownerUserId: workspace.user?.id || null,
          ownerEmail: workspace.user?.primaryEmailAddress?.emailAddress || null,
          period: selectedPeriod,
          enabled,
          deliveryMode: 'download_only',
          recipientEmail: workspace.user?.primaryEmailAddress?.emailAddress || null,
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || 'Could not save report schedule.');
      }

      setSchedules((current) => {
        const next = current.filter((item) => item.period !== selectedPeriod);
        next.push(result.data);
        return next.sort((left, right) => left.period.localeCompare(right.period));
      });
    } catch (error) {
      if (typeof window !== 'undefined') {
        window.alert(error.message || 'Could not save report schedule.');
      }
    } finally {
      setScheduleBusy('');
    }
  };

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
          <div className="bg-white p-6 sm:p-8 print:shadow-none print:border-slate-200 border border-slate-200 rounded-2xl">
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
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    onClick={handleDownloadCsv}
                    disabled={!report}
                    className="inline-flex items-center justify-center rounded-full border border-sky-100 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50 print:hidden"
                  >
                    Download CSV
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(15,23,42,0.18)] transition hover:bg-slate-800 print:hidden"
                  >
                    Print / Save PDF
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden border border-slate-200 rounded-2xl">
            <div className="border-b border-sky-100 px-6 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">Report Schedule</p>
              <p className="mt-2 text-sm text-slate-500">Choose which report windows should stay enabled for recurring owner review and future automation.</p>
            </div>
            <div className="grid gap-3 px-4 py-4 sm:grid-cols-3">
              {REPORT_OPTIONS.map((option) => {
                const saved = schedules.find((entry) => entry.period === option.value);
                const enabled = saved?.enabled ?? false;

                return (
                  <div key={option.value} className="rounded-[22px] border border-sky-100 bg-white p-4 shadow-[0_12px_30px_rgba(15,42,94,0.04)]">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-950">{option.label}</p>
                        <p className="mt-1 text-xs text-slate-400">{enabled ? 'Enabled for future scheduling' : 'Currently not enabled'}</p>
                      </div>
                      <button
                        onClick={() => handleSaveSchedule(option.value, !enabled)}
                        disabled={scheduleBusy === option.value}
                        className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                          enabled
                            ? 'bg-slate-950 text-white'
                            : 'border border-sky-100 bg-white text-slate-600 hover:border-orange-200 hover:bg-orange-50 hover:text-slate-900'
                        }`}
                      >
                        {scheduleBusy === option.value ? 'Saving...' : enabled ? 'Enabled' : 'Enable'}
                      </button>
                    </div>
                    <p className="mt-4 text-xs leading-6 text-slate-500">
                      Delivery mode: {saved?.delivery_mode || 'download_only'}{saved?.recipient_email ? ` | ${saved.recipient_email}` : ''}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {isLoadingReport ? (
            <WorkspaceLoading message="Preparing report..." />
          ) : reportError ? (
            <WorkspaceError message={reportError} onRetry={() => setPeriod((value) => value)} />
          ) : !report ? (
            <EmptyState title="No report yet" description="Choose a report window once fleet data is ready." />
          ) : (
            <>
              <div className="bg-white overflow-hidden border-slate-200 print:shadow-none rounded-2xl">
                <div className="bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_52%,#f97316_100%)] px-6 py-6 text-white sm:px-8">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-100">Printable Fleet Report</p>
                      <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">{report.fleet?.name || 'My Fleet'}</h2>
                      <p className="mt-3 max-w-3xl text-sm leading-7 text-sky-50">
                        {report.window?.label} report for operational review, safety coaching, maintenance planning, and export-ready owner summaries.
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-[22px] bg-white/12 px-4 py-4 backdrop-blur">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-100">Window</p>
                        <p className="mt-2 text-sm font-semibold">{formatDateRange(report.window)}</p>
                      </div>
                      <div className="rounded-[22px] bg-white/12 px-4 py-4 backdrop-blur">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-100">Prepared On</p>
                        <p className="mt-2 text-sm font-semibold">{new Date().toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid gap-4 border-t border-white/10 bg-white px-6 py-5 sm:grid-cols-3 sm:px-8">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Safety Snapshot</p>
                    <p className="mt-2 text-sm text-slate-600">
                      High alerts: <span className="font-semibold text-slate-950">{report.summary.highAlerts}</span> | Harsh braking: <span className="font-semibold text-slate-950">{report.summary.harshBrakingAlerts}</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Duty Snapshot</p>
                    <p className="mt-2 text-sm text-slate-600">
                      On duty: <span className="font-semibold text-slate-950">{report.summary.onDutyDrivers}</span> | Interruptions: <span className="font-semibold text-slate-950">{report.summary.dutyTrackingInterruptions}</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Report Use</p>
                    <p className="mt-2 text-sm text-slate-600">
                      Suitable for owner review, operations check-ins, and print/PDF sharing.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard label="Total Alerts" value={report.summary.totalAlerts} hint="All incidents in this window." />
                <MetricCard label="High Alerts" value={report.summary.highAlerts} hint="Urgent issues needing quick action." tone="red" />
                <MetricCard label="On Duty" value={report.summary.onDutyDrivers} hint="Drivers currently expected to stay trackable." tone="emerald" />
                <MetricCard label="Tracking Interruptions" value={report.summary.dutyTrackingInterruptions} hint="Mid-duty tracking drop-offs." tone="orange" />
              </div>

              <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
                <div className="bg-white overflow-hidden print:shadow-none border border-slate-200 rounded-2xl">
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
                                <SafetyScoreBadge score={driver.safetyScore} />
                                <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${getRiskBand(driver.riskScore).className}`}>
                                  {getRiskBand(driver.riskScore).label}
                                </span>
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
                </div>

                <div className="bg-white overflow-hidden print:shadow-none border border-slate-200 rounded-2xl">
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
                </div>
              </div>

              <div className="grid gap-6 xl:grid-cols-2">
                <div className="bg-white overflow-hidden print:shadow-none border border-slate-200 rounded-2xl">
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
                </div>

                <div className="bg-white overflow-hidden print:shadow-none border border-slate-200 rounded-2xl">
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
                </div>
              </div>

              <div className="grid gap-6 xl:grid-cols-3">
                <div className="bg-white overflow-hidden print:shadow-none border border-slate-200 rounded-2xl">
                  <div className="border-b border-sky-100 px-6 py-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">Insurance Impact</p>
                    <p className="mt-2 text-sm text-slate-500">How current alert trends could affect claims, scrutiny, or risk posture.</p>
                  </div>
                  <div className="space-y-3 px-4 py-4">
                    {report.impacts.insurance.map((item) => (
                      <div key={item} className="rounded-[20px] border border-sky-100 bg-white px-4 py-4 text-sm leading-7 text-slate-600 shadow-[0_12px_30px_rgba(15,42,94,0.04)]">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white overflow-hidden print:shadow-none border border-slate-200 rounded-2xl">
                  <div className="border-b border-sky-100 px-6 py-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">Maintenance Impact</p>
                    <p className="mt-2 text-sm text-slate-500">Vehicle-health concerns suggested by recent safety behavior.</p>
                  </div>
                  <div className="space-y-3 px-4 py-4">
                    {report.impacts.maintenance.map((item) => (
                      <div key={item} className="rounded-[20px] border border-sky-100 bg-white px-4 py-4 text-sm leading-7 text-slate-600 shadow-[0_12px_30px_rgba(15,42,94,0.04)]">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white overflow-hidden print:shadow-none border border-slate-200 rounded-2xl">
                  <div className="border-b border-sky-100 px-6 py-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">Operational Impact</p>
                    <p className="mt-2 text-sm text-slate-500">Dispatch, visibility, and execution risks indicated by this report.</p>
                  </div>
                  <div className="space-y-3 px-4 py-4">
                    {report.impacts.operations.map((item) => (
                      <div key={item} className="rounded-[20px] border border-sky-100 bg-white px-4 py-4 text-sm leading-7 text-slate-600 shadow-[0_12px_30px_rgba(15,42,94,0.04)]">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden print:shadow-none border border-slate-200 rounded-2xl">
                <div className="border-b border-sky-100 px-6 py-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">Driver Scoreboard</p>
                  <p className="mt-2 text-sm text-slate-500">Printable driver-by-driver review with risk bands for coaching and escalation.</p>
                </div>
                {!report.driverSummaries.length ? (
                  <EmptyState title="No drivers in this report" description="Driver scoring will appear once fleet members are available." />
                ) : (
                  <div className="overflow-x-auto px-4 py-4">
                    <table className="min-w-full border-separate border-spacing-y-3 text-left">
                      <thead>
                        <tr className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                          <th className="px-3">Driver</th>
                          <th className="px-3">Duty</th>
                          <th className="px-3">Risk</th>
                          <th className="px-3">Alerts</th>
                          <th className="px-3">Overspeed</th>
                          <th className="px-3">Harsh Braking</th>
                          <th className="px-3">Interruptions</th>
                          <th className="px-3">Last Seen</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.driverSummaries.map((driver) => {
                          const band = getRiskBand(driver.riskScore);
                          return (
                            <tr key={driver.id} className="rounded-[18px] border border-sky-100 bg-white shadow-[0_10px_24px_rgba(15,42,94,0.04)]">
                              <td className="rounded-l-[18px] px-3 py-4 text-sm font-semibold text-slate-950">{driver.name}</td>
                              <td className="px-3 py-4 text-sm text-slate-600">{driver.dutyStatus.replace(/_/g, ' ')}</td>
                              <td className="px-3 py-4">
                                <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${band.className}`}>
                                  {band.label} · {driver.riskScore}
                                </span>
                              </td>
                              <td className="px-3 py-4 text-sm text-slate-600">{driver.totalAlerts}</td>
                              <td className="px-3 py-4 text-sm text-slate-600">{driver.overspeedCount}</td>
                              <td className="px-3 py-4 text-sm text-slate-600">{driver.harshBrakingCount}</td>
                              <td className="px-3 py-4 text-sm text-slate-600">{driver.interruptionCount}</td>
                              <td className="rounded-r-[18px] px-3 py-4 text-sm text-slate-500">
                                {driver.lastSeen ? new Date(driver.lastSeen).toLocaleString('en-IN') : 'Not available'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="bg-white overflow-hidden print:shadow-none border border-slate-200 rounded-2xl">
                <div className="border-b border-sky-100 px-6 py-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">Sign-Off</p>
                  <p className="mt-2 text-sm text-slate-500">Use this area when the report is printed for review, coaching, or audit handoff.</p>
                </div>
                <div className="grid gap-4 px-6 py-6 sm:grid-cols-2 lg:grid-cols-3">
                  {['Prepared By', 'Reviewed By', 'Operations Notes'].map((label) => (
                    <div key={label} className="rounded-[20px] border border-dashed border-slate-300 bg-slate-50 px-4 py-5">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</p>
                      <div className="mt-10 border-b border-slate-300" />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </OwnerShell>
  );
}
