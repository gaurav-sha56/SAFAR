'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import {
  OwnerShell,
  WorkspaceLoading,
  WorkspaceError,
  FleetSetupPanel,
  useOwnerWorkspaceData,
} from '../../../_components/owner-shared';
import { getDummyDriverDetail } from '../../report-dummy-data';

/* ── Helpers ── */

function scoreBand(score) {
  if (score >= 85) return { label: 'Excellent', bg: 'bg-emerald-500', text: 'text-emerald-600', border: 'border-emerald-200', light: 'bg-emerald-50' };
  if (score >= 70) return { label: 'Good', bg: 'bg-sky-500', text: 'text-sky-600', border: 'border-sky-200', light: 'bg-sky-50' };
  if (score >= 50) return { label: 'Average', bg: 'bg-amber-500', text: 'text-amber-600', border: 'border-amber-200', light: 'bg-amber-50' };
  return { label: 'High Risk', bg: 'bg-red-500', text: 'text-red-600', border: 'border-red-200', light: 'bg-red-50' };
}

function trendArrow(trend) {
  if (trend > 0) return { icon: '↑', color: 'text-emerald-600', label: `+${trend}` };
  if (trend < 0) return { icon: '↓', color: 'text-red-600', label: `${trend}` };
  return { icon: '→', color: 'text-stone-400', label: '0' };
}

/* ── Score Trend Chart (SVG) ── */

function DriverScoreTrendChart({ weeklyScores }) {
  const chartWidth = 360;
  const chartHeight = 180;
  const padX = 45;
  const padY = 25;
  const plotW = chartWidth - padX * 2;
  const plotH = chartHeight - padY * 2;

  const scores = weeklyScores.map((d) => d.score);
  const minScore = Math.max(0, Math.min(...scores) - 10);
  const maxScore = Math.min(100, Math.max(...scores) + 10);
  const scoreRange = maxScore - minScore || 1;

  const points = weeklyScores.map((d, i) => {
    const x = padX + (i / (weeklyScores.length - 1)) * plotW;
    const y = padY + plotH - ((d.score - minScore) / scoreRange) * plotH;
    return { x, y, ...d };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const improving = scores[scores.length - 1] >= scores[0];

  return (
    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full max-w-sm" role="img" aria-label="Driver score trend">
      {/* Grid */}
      {[0, 1, 2, 3].map((i) => {
        const y = padY + (i / 3) * plotH;
        const val = Math.round(maxScore - (i / 3) * scoreRange);
        return (
          <g key={i}>
            <line x1={padX} y1={y} x2={chartWidth - padX} y2={y} stroke="#e7e5e4" strokeWidth={1} />
            <text x={padX - 6} y={y + 4} textAnchor="end" fill="#a8a29e" fontSize="9">{val}</text>
          </g>
        );
      })}
      {/* Area */}
      <defs>
        <linearGradient id="driverGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={improving ? '#10b981' : '#ef4444'} stopOpacity="0.12" />
          <stop offset="100%" stopColor={improving ? '#10b981' : '#ef4444'} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${linePath} L ${points[points.length - 1].x} ${padY + plotH} L ${points[0].x} ${padY + plotH} Z`} fill="url(#driverGrad)" />
      {/* Line */}
      <path d={linePath} fill="none" stroke={improving ? '#10b981' : '#ef4444'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {/* Points */}
      {points.map((p) => (
        <g key={p.week}>
          <circle cx={p.x} cy={p.y} r={4} fill="white" stroke={improving ? '#10b981' : '#ef4444'} strokeWidth={2} />
          <text x={p.x} y={p.y - 10} textAnchor="middle" fill="#0b1f3a" fontSize="11" fontWeight="700">{p.score}</text>
          <text x={p.x} y={padY + plotH + 14} textAnchor="middle" fill="#78716c" fontSize="9">{p.week}</text>
        </g>
      ))}
    </svg>
  );
}

/* ── Event Breakdown Bars ── */

function EventBreakdown({ events }) {
  const items = [
    { label: 'Harsh Braking', count: events.harshBraking, color: 'bg-red-500', track: 'bg-red-100' },
    { label: 'Overspeeding', count: events.overspeeding, color: 'bg-red-500', track: 'bg-red-100' },
    { label: 'Swerving', count: events.swerving, color: 'bg-amber-500', track: 'bg-amber-100' },
    { label: 'Phone Usage', count: events.phoneUsage, color: 'bg-amber-500', track: 'bg-amber-100' },
    { label: 'Fatigue', count: events.fatigue, color: 'bg-stone-400', track: 'bg-stone-200' },
    { label: 'Harsh Acceleration', count: events.harshAcceleration, color: 'bg-amber-500', track: 'bg-amber-100' },
  ];

  const maxCount = Math.max(...items.map((i) => i.count), 1);

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const pct = (item.count / maxCount) * 100;
        return (
          <div key={item.label}>
            <div className="flex items-center justify-between">
              <p className="text-sm text-navy">{item.label}</p>
              <p className="text-sm font-bold text-navy">{item.count}</p>
            </div>
            <div className={`mt-1.5 h-2.5 w-full overflow-hidden rounded-full ${item.track}`}>
              <div className={`h-full rounded-full ${item.color} transition-all duration-500`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Main Page ── */

export default function DriverDetailPage() {
  const params = useParams();
  const driverId = params?.driverId;
  const workspace = useOwnerWorkspaceData();

  const driver = useMemo(() => getDummyDriverDetail(driverId), [driverId]);

  if (!workspace.isLoaded) {
    return (
      <OwnerShell section="reports" fleet={workspace.fleet} user={workspace.user} toast={workspace.toast}>
        <WorkspaceLoading />
      </OwnerShell>
    );
  }

  if (workspace.fleetEnsureError) {
    return (
      <OwnerShell section="reports" fleet={workspace.fleet} user={workspace.user} toast={workspace.toast}>
        <WorkspaceError message={workspace.fleetEnsureError} onRetry={workspace.ensureFleetExists} />
      </OwnerShell>
    );
  }

  if (workspace.isFleetSetupPending) {
    return (
      <OwnerShell section="reports" fleet={workspace.fleet} user={workspace.user} toast={workspace.toast}>
        <FleetSetupPanel
          fleetSetupName={workspace.fleetSetupName}
          setFleetSetupName={workspace.setFleetSetupName}
          onSubmit={workspace.handleCompleteFleetSetup}
          isSettingUpFleet={workspace.isSettingUpFleet}
        />
      </OwnerShell>
    );
  }

  if (!driver) {
    return (
      <OwnerShell section="reports" fleet={workspace.fleet} user={workspace.user} toast={workspace.toast}>
        <div className="rounded-xl border border-stone-200 bg-white p-8 text-center shadow-sm">
          <p className="text-lg font-semibold text-navy">Driver not found</p>
          <p className="mt-2 text-sm text-stone-500">This driver ID does not exist in the current report data.</p>
          <Link href="/owner/reports" className="btn-primary mt-4 inline-flex">Back to Reports</Link>
        </div>
      </OwnerShell>
    );
  }

  const band = scoreBand(driver.safetyScore);
  const trend = trendArrow(driver.scoreTrend);

  return (
    <OwnerShell section="reports" fleet={workspace.fleet} user={workspace.user} toast={workspace.toast}>
      <div className="space-y-6">
        {/* Back Link */}
        <Link href="/owner/reports" className="inline-flex items-center gap-2 text-sm font-semibold text-stone-500 transition hover:text-navy">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back to Fleet Report
        </Link>

        {/* ── Driver Header ── */}
        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${band.light} text-2xl font-bold ${band.text}`}>
                {driver.name.charAt(0)}
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold tracking-tight text-navy">{driver.name}</h1>
                <p className="mt-1 text-sm text-stone-500">{driver.vehiclePlate} · {driver.vehicleModel}</p>
                <p className="text-xs text-stone-400">{driver.phone}</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className={`font-display text-5xl font-bold ${band.text}`}>{driver.safetyScore}</p>
                <p className={`mt-1 text-sm font-semibold ${trend.color}`}>{trend.label} {trend.icon} this week</p>
                <span className={`mt-1 inline-block rounded-full border px-3 py-1 text-xs font-bold ${band.border} ${band.light} ${band.text}`}>
                  {band.label}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Score Trend + Event Breakdown ── */}
        <div className="grid gap-6 xl:grid-cols-2">
          {/* Score Trend */}
          <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
            <div className="border-b border-stone-200 px-6 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-navy">Score Trend — Last 4 Weeks</p>
            </div>
            <div className="flex items-center justify-center px-6 py-6">
              <DriverScoreTrendChart weeklyScores={driver.weeklyScores} />
            </div>
          </div>

          {/* Event Breakdown */}
          <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
            <div className="border-b border-stone-200 px-6 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-navy">Event Breakdown</p>
              <p className="mt-1 text-sm text-stone-500">Safety events recorded this period.</p>
            </div>
            <div className="px-6 py-5">
              <EventBreakdown events={driver.events} />
            </div>
          </div>
        </div>

        {/* ── Best & Worst Trip ── */}
        <div className="grid gap-6 sm:grid-cols-2">
          {driver.bestTrip && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-600">🏆 Best Trip</p>
              <p className="mt-2 text-sm text-navy">{driver.bestTrip.date} · {driver.bestTrip.startTime} — {driver.bestTrip.endTime}</p>
              <p className="text-sm text-stone-500">{driver.bestTrip.distance}</p>
              <p className="mt-2 text-2xl font-bold text-emerald-600">{driver.bestTrip.score}</p>
            </div>
          )}
          {driver.worstTrip && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-red-600">⚠️ Worst Trip</p>
              <p className="mt-2 text-sm text-navy">{driver.worstTrip.date} · {driver.worstTrip.startTime} — {driver.worstTrip.endTime}</p>
              <p className="text-sm text-stone-500">{driver.worstTrip.distance}</p>
              <p className="mt-2 text-2xl font-bold text-red-600">{driver.worstTrip.score}</p>
            </div>
          )}
        </div>

        {/* ── Trip History ── */}
        <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
          <div className="border-b border-stone-200 px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-navy">Trip History</p>
            <p className="mt-1 text-sm text-stone-500">Recent trips with date, time, distance, and score.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50">
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-stone-500">Date</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-stone-500">Start</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-stone-500">End</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-stone-500">Distance</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-stone-500">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {driver.trips.map((trip) => {
                  const tripBand = scoreBand(trip.score);
                  return (
                    <tr key={trip.id} className="transition hover:bg-stone-50/60">
                      <td className="px-4 py-3 text-sm text-navy">{trip.date}</td>
                      <td className="px-4 py-3 text-sm text-stone-500">{trip.startTime}</td>
                      <td className="px-4 py-3 text-sm text-stone-500">{trip.endTime}</td>
                      <td className="px-4 py-3 text-sm text-stone-500">{trip.distance}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-bold ${tripBand.border} ${tripBand.light} ${tripBand.text}`}>
                          {trip.score}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Improvement Suggestions ── */}
        <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
          <div className="border-b border-stone-200 px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-navy">Improvement Suggestions</p>
            <p className="mt-1 text-sm text-stone-500">Actionable tips to improve this driver's SAFAR Score.</p>
          </div>
          <div className="space-y-3 px-6 py-5">
            {driver.suggestions.map((suggestion, index) => (
              <div key={index} className="flex items-start gap-3 rounded-lg border border-stone-200 bg-stone-50 p-4">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange text-[10px] font-bold text-white">
                  {index + 1}
                </span>
                <p className="text-sm leading-relaxed text-stone-600">{suggestion}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </OwnerShell>
  );
}
