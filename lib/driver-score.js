export function calculateDriverSafetyScore(driver, alerts = []) {
  const driverAlerts = alerts.filter((alert) => alert.driverId === driver.id);
  const overspeedCount = driverAlerts.filter((alert) => alert.type === 'overspeed').length;
  const harshBrakingCount = driverAlerts.filter((alert) => alert.type === 'harsh_braking').length;
  const interruptionCount = driverAlerts.filter((alert) => alert.type === 'duty_tracking_interrupted').length;
  const offlineCount = driverAlerts.filter((alert) => alert.type === 'device_offline' || alert.type === 'tracking_stopped').length;
  const highAlertCount = driverAlerts.filter((alert) => alert.severity === 'high').length;

  const deductions =
    (overspeedCount * 12) +
    (harshBrakingCount * 10) +
    (interruptionCount * 15) +
    (offlineCount * 6) +
    Math.max(0, highAlertCount - interruptionCount - overspeedCount - harshBrakingCount) * 4;

  return Math.max(0, 100 - deductions);
}

export function formatSafetyBand(score) {
  if (score >= 85) {
    return {
      label: 'Strong',
      className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    };
  }
  if (score >= 65) {
    return {
      label: 'Watch',
      className: 'border-amber-200 bg-amber-50 text-amber-700',
    };
  }
  return {
    label: 'Risk',
    className: 'border-red-200 bg-red-50 text-red-700',
  };
}
