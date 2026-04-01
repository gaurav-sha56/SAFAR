import { shouldSuppressTrackingAlerts, withDriverDutyDefaults } from '@/lib/driver-duty';

export const OVERSPEED_THRESHOLD_KMH = 80;
export const HARSH_BRAKE_THRESHOLD_MS2 = 4.5;
export const OFFLINE_ALERT_THRESHOLD_MS = 2 * 60 * 1000;
export const ALERT_DEDUP_WINDOW_MS = 2 * 60 * 1000;
export const SAFETY_DEBUG_ENABLED = process.env.SAFAR_DEBUG_ALERTS === '1';

export function formatDriverVehicleLabel(driver) {
  const vehiclePlate = typeof driver?.vehicle_plate === 'string' ? driver.vehicle_plate.trim() : '';
  const vehicleModel = typeof driver?.vehicle_model === 'string' ? driver.vehicle_model.trim() : '';

  if (vehiclePlate && vehicleModel) {
    return `${vehiclePlate} • ${vehicleModel}`;
  }

  return vehiclePlate || vehicleModel || '';
}

export function formatDriverAlertIdentity(driver) {
  const vehicleLabel = formatDriverVehicleLabel(driver);
  if (vehicleLabel) {
    return vehicleLabel;
  }

  return driver?.name || driver?.phone || 'Driver';
}

export function toKmh(speedMps) {
  if (typeof speedMps !== 'number' || !Number.isFinite(speedMps) || speedMps < 0) {
    return null;
  }

  return Number((speedMps * 3.6).toFixed(1));
}

export function formatAlertTypeLabel(type) {
  if (typeof type !== 'string') {
    return 'Alert';
  }

  const normalized = type.trim().toLowerCase();
  const knownLabels = {
    overspeed: 'Overspeed',
    harsh_braking: 'Harsh Braking',
    tracking_stopped: 'Tracking Stopped',
    duty_tracking_interrupted: 'Duty Tracking Interrupted',
    device_offline: 'Device Offline',
    sos: 'SOS',
  };

  if (knownLabels[normalized]) {
    return knownLabels[normalized];
  }

  return normalized
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ') || 'Alert';
}

export function normalizeIncomingSafetyEvent(event, driver, fallbackCoords = null) {
  if (!event?.type) {
    return null;
  }

  const type = String(event.type).trim().toLowerCase();
  if (!type) {
    return null;
  }

  const speedKmh = toKmh(event?.meta?.speedMps);
  const fallbackMessageByType = {
    harsh_braking: `${formatDriverAlertIdentity(driver)} applied harsh braking.`,
    overspeed: speedKmh
      ? `${formatDriverAlertIdentity(driver)} is overspeeding at ${Math.round(speedKmh)} km/h.`
      : `${formatDriverAlertIdentity(driver)} triggered an overspeed warning.`,
    tracking_stopped: `${formatDriverAlertIdentity(driver)} stopped live tracking.`,
    device_offline: `${formatDriverAlertIdentity(driver)} has stopped sending location updates.`,
    sos: `${formatDriverAlertIdentity(driver)} triggered an SOS alert.`,
  };

  return {
    type,
    severity: event.severity || (type === 'sos' || type === 'harsh_braking' || type === 'overspeed' ? 'high' : 'medium'),
    message: event.message || fallbackMessageByType[type] || `${formatDriverAlertIdentity(driver)} triggered a ${formatAlertTypeLabel(type).toLowerCase()} alert.`,
    meta: {
      ...(event.meta || {}),
      lat: event?.meta?.lat ?? fallbackCoords?.lat ?? null,
      lng: event?.meta?.lng ?? fallbackCoords?.lng ?? null,
      vehicleModel: event?.meta?.vehicleModel || driver?.vehicle_model || null,
      vehiclePlate: event?.meta?.vehiclePlate || driver?.vehicle_plate || null,
    },
  };
}

export async function insertSafetyAlert(supabase, alert) {
  try {
    const dedupSince = new Date(Date.now() - ALERT_DEDUP_WINDOW_MS).toISOString();

    const { data: recentAlert, error: recentError } = await supabase
      .from('fleet_alerts')
      .select('id, created_at')
      .eq('fleet_id', alert.fleet_id)
      .eq('driver_id', alert.driver_id)
      .eq('type', alert.type)
      .gte('created_at', dedupSince)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!recentError && recentAlert) {
      return { inserted: false, reason: 'deduped' };
    }

    const { data, error } = await supabase.from('fleet_alerts').insert({
      fleet_id: alert.fleet_id,
      driver_id: alert.driver_id,
      driver_name: alert.driver_name || null,
      driver_phone: alert.driver_phone || null,
      type: alert.type,
      severity: alert.severity,
      message: alert.message,
      meta: alert.meta || {},
    }).select('id, fleet_id, driver_id, driver_name, driver_phone, type, severity, message, meta, created_at').single();

    if (error) {
      console.warn('Safety alert insert skipped:', error.message);
      return { inserted: false, reason: 'insert_failed' };
    }

    return { inserted: true, alert: data };
  } catch (error) {
    console.warn('Safety alert insert failed:', error);
    return { inserted: false, reason: 'exception' };
  }
}

export function buildOfflineAlerts(drivers, persistedAlerts = []) {
  const now = Date.now();
  const persistedKeys = new Set(
    persistedAlerts.map((alert) => `${alert.driverId || 'unknown'}:${alert.type}`)
  );

  return drivers
    .map((driver) => withDriverDutyDefaults(driver))
    .filter((driver) => {
      if (shouldSuppressTrackingAlerts(driver)) {
        return false;
      }

      if (!driver.last_seen) {
        return false;
      }

      const ageMs = now - new Date(driver.last_seen).getTime();
      return !driver.is_online || ageMs >= OFFLINE_ALERT_THRESHOLD_MS;
    })
    .map((driver) => {
      const ageMs = now - new Date(driver.last_seen).getTime();
      const type = driver.is_online ? 'device_offline' : 'tracking_stopped';
      const key = `${driver.id}:${type}`;

      if (persistedKeys.has(key)) {
        return null;
      }

      return {
        id: `computed-${key}`,
        driverId: driver.id,
        driverName: formatDriverAlertIdentity(driver),
        driverPhone: driver.phone,
        vehicleModel: driver.vehicle_model || null,
        vehiclePlate: driver.vehicle_plate || null,
        type,
        severity: type === 'device_offline' ? 'high' : 'medium',
        message:
          type === 'device_offline'
            ? `${formatDriverAlertIdentity(driver)} has not sent location updates for ${Math.max(2, Math.round(ageMs / 60000))} min.`
            : `${formatDriverAlertIdentity(driver)} is offline or has stopped tracking.`,
        createdAt: driver.last_seen,
        meta: {
          lastSeen: driver.last_seen,
          dutyStatus: driver.duty_status,
          trackingExpected: driver.tracking_expected,
          sessionId: driver.duty_session_id,
          vehicleModel: driver.vehicle_model || null,
          vehiclePlate: driver.vehicle_plate || null,
        },
      };
    })
    .filter(Boolean);
}
