import { formatAlertTypeLabel } from '@/lib/safety';

export const REPORT_PERIODS = {
  daily: { label: 'Daily', days: 1 },
  weekly: { label: 'Weekly', days: 7 },
  monthly: { label: 'Monthly', days: 30 },
};

export function resolveReportWindow(period) {
  const normalized = typeof period === 'string' ? period.trim().toLowerCase() : 'weekly';
  const selected = REPORT_PERIODS[normalized] || REPORT_PERIODS.weekly;
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - selected.days * 24 * 60 * 60 * 1000);

  return {
    period: Object.keys(REPORT_PERIODS).find((key) => REPORT_PERIODS[key] === selected) || 'weekly',
    label: selected.label,
    startDate,
    endDate,
  };
}

export function summarizeFleetReport({ fleet, drivers = [], alerts = [], window }) {
  const highAlerts = alerts.filter((alert) => alert.severity === 'high');
  const mediumAlerts = alerts.filter((alert) => alert.severity === 'medium');
  const activeDrivers = drivers.filter((driver) => driver.is_online);
  const dutyActiveDrivers = drivers.filter((driver) => driver.duty_status === 'on_duty');
  const offDutyDrivers = drivers.filter((driver) => driver.duty_status === 'off_duty' || driver.duty_status === 'shift_ended');
  const breakDrivers = drivers.filter((driver) => driver.duty_status === 'break');

  const alertTypeCounts = alerts.reduce((acc, alert) => {
    const key = alert.type || 'unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const driverSummaries = drivers.map((driver) => {
    const driverAlerts = alerts.filter((alert) => alert.driverId === driver.id);
    const highCount = driverAlerts.filter((alert) => alert.severity === 'high').length;
    const overspeedCount = driverAlerts.filter((alert) => alert.type === 'overspeed').length;
    const harshBrakingCount = driverAlerts.filter((alert) => alert.type === 'harsh_braking').length;
    const interruptionCount = driverAlerts.filter((alert) => alert.type === 'duty_tracking_interrupted').length;

    const riskScore = (highCount * 4) + (overspeedCount * 3) + (harshBrakingCount * 3) + (interruptionCount * 5) + Math.max(driverAlerts.length - highCount, 0);

    return {
      id: driver.id,
      name: driver.name || driver.phone || 'Driver',
      phone: driver.phone || null,
      dutyStatus: driver.duty_status,
      trackingExpected: driver.tracking_expected,
      totalAlerts: driverAlerts.length,
      highAlerts: highCount,
      overspeedCount,
      harshBrakingCount,
      interruptionCount,
      lastSeen: driver.last_seen || null,
      riskScore,
    };
  }).sort((left, right) => right.riskScore - left.riskScore || right.totalAlerts - left.totalAlerts);

  const topRiskDrivers = driverSummaries.filter((driver) => driver.totalAlerts > 0).slice(0, 5);
  const topAlertTypes = Object.entries(alertTypeCounts)
    .map(([type, count]) => ({ type, label: formatAlertTypeLabel(type), count }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 6);

  const recommendations = [];
  const insuranceRisks = [];
  const maintenanceRisks = [];
  const operationalRisks = [];

  if (alertTypeCounts.duty_tracking_interrupted) {
    recommendations.push('Review drivers who stopped tracking during active duty. These interruptions can hide route deviations and weaken accountability.');
    operationalRisks.push('Mid-duty tracking interruptions reduce live visibility and make dispatch follow-up slower during active jobs.');
  }
  if (alertTypeCounts.harsh_braking) {
    recommendations.push('Harsh braking events may point to aggressive driving, brake wear, tyre stress, and elevated claims risk if incidents repeat.');
    insuranceRisks.push('Repeated harsh braking may increase claim scrutiny after incidents because it suggests aggressive control inputs before an event.');
    maintenanceRisks.push('Harsh braking can accelerate brake pad wear, tyre flat spotting, and suspension stress if repeated across shifts.');
  }
  if (alertTypeCounts.overspeed) {
    recommendations.push('Overspeed alerts increase accident exposure and can affect insurance claim scrutiny, driver coaching needs, and vehicle wear.');
    insuranceRisks.push('Overspeed patterns can weaken the fleet’s safety profile and may become relevant during accident investigations or insurer reviews.');
    maintenanceRisks.push('Frequent overspeeding increases brake load, tyre wear, engine strain, and the chance of unscheduled maintenance.');
  }
  if ((alertTypeCounts.device_offline || 0) + (alertTypeCounts.tracking_stopped || 0) > 0) {
    recommendations.push('Frequent tracking gaps reduce route visibility. Check battery policy, network conditions, and whether shifts are being ended properly.');
    operationalRisks.push('Tracking gaps weaken ETA accuracy, route proof, and the ability to respond quickly to driver incidents.');
  }
  if (!recommendations.length) {
    recommendations.push('No major safety spikes were detected in this window. Keep monitoring duty compliance and alert frequency to maintain consistency.');
  }
  if (!insuranceRisks.length) {
    insuranceRisks.push('No major insurance-facing risk spike was detected in this window based on current alert patterns.');
  }
  if (!maintenanceRisks.length) {
    maintenanceRisks.push('No major maintenance risk spike was detected in this window based on current alert patterns.');
  }
  if (!operationalRisks.length) {
    operationalRisks.push('Operations remained comparatively stable in this window, with no major tracking or alert-driven disruption spike.');
  }

  return {
    fleet,
    window: {
      period: window.period,
      label: window.label,
      startDate: window.startDate.toISOString(),
      endDate: window.endDate.toISOString(),
    },
    summary: {
      totalDrivers: drivers.length,
      activeDrivers: activeDrivers.length,
      onDutyDrivers: dutyActiveDrivers.length,
      offDutyDrivers: offDutyDrivers.length,
      breakDrivers: breakDrivers.length,
      totalAlerts: alerts.length,
      highAlerts: highAlerts.length,
      mediumAlerts: mediumAlerts.length,
      harshBrakingAlerts: alertTypeCounts.harsh_braking || 0,
      overspeedAlerts: alertTypeCounts.overspeed || 0,
      dutyTrackingInterruptions: alertTypeCounts.duty_tracking_interrupted || 0,
    },
    topAlertTypes,
    topRiskDrivers,
    driverSummaries,
    alerts: alerts.slice().sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()),
    recommendations,
    impacts: {
      insurance: insuranceRisks,
      maintenance: maintenanceRisks,
      operations: operationalRisks,
    },
  };
}
