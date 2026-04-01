export const DRIVER_BASE_SELECT = 'id, name, phone, fleet_id, vehicle_model, vehicle_plate, is_online, last_lat, last_lng, last_seen';
export const DRIVER_DUTY_SELECT = `${DRIVER_BASE_SELECT}, duty_status, tracking_expected, last_tracking_reason, duty_session_id, duty_status_changed_at`;

const DUTY_FIELD_NAMES = [
  'duty_status',
  'tracking_expected',
  'last_tracking_reason',
  'duty_session_id',
  'duty_status_changed_at',
];

export function normalizeDutyStatus(value) {
  if (typeof value !== 'string') {
    return 'off_duty';
  }

  const normalized = value.trim().toLowerCase();
  if (['on_duty', 'off_duty', 'break', 'shift_ended'].includes(normalized)) {
    return normalized;
  }

  return 'off_duty';
}

export function isDriverDutyColumnError(error) {
  if (!error) return false;

  const combined = `${error.message || ''} ${error.details || ''} ${error.hint || ''}`.toLowerCase();
  return DUTY_FIELD_NAMES.some((field) => combined.includes(field));
}

export function stripDriverDutyFields(updates = {}) {
  const next = { ...updates };
  for (const field of DUTY_FIELD_NAMES) {
    delete next[field];
  }
  return next;
}

export function withDriverDutyDefaults(driver) {
  if (!driver) return null;

  const dutyStatus = normalizeDutyStatus(driver.duty_status);
  const trackingExpected = typeof driver.tracking_expected === 'boolean'
    ? driver.tracking_expected
    : dutyStatus === 'on_duty';

  return {
    ...driver,
    duty_status: dutyStatus,
    tracking_expected: trackingExpected,
    last_tracking_reason: driver.last_tracking_reason || null,
    duty_session_id: driver.duty_session_id || null,
    duty_status_changed_at: driver.duty_status_changed_at || null,
  };
}

export function shouldSuppressTrackingAlerts(driver) {
  const normalized = withDriverDutyDefaults(driver);
  if (!normalized) return false;

  return (
    normalized.tracking_expected === false ||
    normalized.duty_status === 'off_duty' ||
    normalized.duty_status === 'break' ||
    normalized.duty_status === 'shift_ended'
  );
}

export function formatDutyStatusLabel(status) {
  const normalized = normalizeDutyStatus(status);
  const labels = {
    on_duty: 'On Duty',
    off_duty: 'Off Duty',
    break: 'Break',
    shift_ended: 'Shift Ended',
  };

  return labels[normalized] || 'Off Duty';
}
