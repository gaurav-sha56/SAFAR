import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import {
  formatDriverAlertIdentity,
  insertSafetyAlert,
  normalizeIncomingSafetyEvent,
  OVERSPEED_THRESHOLD_KMH,
  SAFETY_DEBUG_ENABLED,
} from '@/lib/safety';
import {
  DRIVER_BASE_SELECT,
  DRIVER_DUTY_SELECT,
  isDriverDutyColumnError,
  normalizeDutyStatus,
  shouldSuppressTrackingAlerts,
  stripDriverDutyFields,
  withDriverDutyDefaults,
} from '@/lib/driver-duty';
import { notifyFleetAlert } from '@/lib/push-notifications';

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      driverId,
      fleetId,
      lat,
      lng,
      heading = null,
      speed = null,
      speedKmh = null,
      safetyEvents = [],
      dutyStatus,
      trackingExpected,
      sessionId,
      deviceTime,
    } = body;

    if (SAFETY_DEBUG_ENABLED) {
      console.log('[SafetyDebug] /api/driver-location payload', {
        driverId,
        fleetId,
        lat,
        lng,
        heading,
        speed,
        speedKmh,
        dutyStatus,
        trackingExpected,
        sessionId,
        deviceTime,
        safetyEventsCount: Array.isArray(safetyEvents) ? safetyEvents.length : 0,
        safetyEventTypes: Array.isArray(safetyEvents)
          ? safetyEvents.map((event) => event?.type).filter(Boolean)
          : [],
      });
    }

    if (!driverId || !fleetId || !isFiniteNumber(lat) || !isFiniteNumber(lng)) {
      return NextResponse.json(
        { success: false, error: 'driverId, fleetId, lat, and lng are required.' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();
    const statusTimestamp = typeof deviceTime === 'string' && deviceTime.trim()
      ? deviceTime
      : new Date().toISOString();
    const locationPayload = {
      lat,
      lng,
      heading: isFiniteNumber(heading) ? heading : null,
      speed: isFiniteNumber(speed) ? speed : null,
      updatedAt: statusTimestamp,
    };
    const driverUpdates = {
      fleet_id: fleetId,
      last_lat: lat,
      last_lng: lng,
      last_seen: statusTimestamp,
      is_online: true,
    };

    if ('dutyStatus' in body) {
      driverUpdates.duty_status = normalizeDutyStatus(dutyStatus);
      driverUpdates.duty_status_changed_at = statusTimestamp;
    }

    if (typeof trackingExpected === 'boolean') {
      driverUpdates.tracking_expected = trackingExpected;
    }

    if ('sessionId' in body) {
      driverUpdates.duty_session_id = typeof sessionId === 'string' && sessionId.trim() ? sessionId.trim() : null;
    }

    let { data: updatedDriver, error: updateError } = await supabase
      .from('drivers')
      .update(driverUpdates)
      .eq('id', driverId)
      .eq('fleet_id', fleetId)
      .select(DRIVER_DUTY_SELECT)
      .single();

    if (updateError && isDriverDutyColumnError(updateError)) {
      const fallback = await supabase
        .from('drivers')
        .update(stripDriverDutyFields(driverUpdates))
        .eq('id', driverId)
        .eq('fleet_id', fleetId)
        .select(DRIVER_BASE_SELECT)
        .single();

      updatedDriver = fallback.data;
      updateError = fallback.error;
    }

    if (updateError || !updatedDriver) {
      console.error('Driver location update error:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update driver location.' },
        { status: 404 }
      );
    }

    const normalizedDriver = withDriverDutyDefaults(updatedDriver);
    const normalizedEvents = Array.isArray(safetyEvents)
      ? safetyEvents
          .map((event) => normalizeIncomingSafetyEvent(event, normalizedDriver, { lat, lng }))
          .filter(Boolean)
      : [];
    const driverIdentity = formatDriverAlertIdentity(normalizedDriver);

    if (isFiniteNumber(speedKmh) && speedKmh >= OVERSPEED_THRESHOLD_KMH && !shouldSuppressTrackingAlerts(normalizedDriver)) {
      normalizedEvents.push({
        type: 'overspeed',
        severity: 'high',
        message: `${driverIdentity} is overspeeding at ${Math.round(speedKmh)} km/h.`,
        meta: {
          speedKmh,
          thresholdKmh: OVERSPEED_THRESHOLD_KMH,
          lat,
          lng,
          dutyStatus: normalizedDriver.duty_status,
          trackingExpected: normalizedDriver.tracking_expected,
          sessionId: normalizedDriver.duty_session_id,
          vehicleModel: normalizedDriver.vehicle_model || null,
          vehiclePlate: normalizedDriver.vehicle_plate || null,
        },
      });
    }

    for (const event of normalizedEvents) {
      if (!event?.type || !event?.message) {
        continue;
      }

      const alertInsert = await insertSafetyAlert(supabase, {
        fleet_id: fleetId,
        driver_id: normalizedDriver.id,
        driver_name: driverIdentity,
        driver_phone: normalizedDriver.phone,
        type: event.type,
        severity: event.severity || 'medium',
        message: event.message,
        meta: {
          ...(event.meta || {}),
          dutyStatus: event?.meta?.dutyStatus || normalizedDriver.duty_status,
          trackingExpected: event?.meta?.trackingExpected ?? normalizedDriver.tracking_expected,
          sessionId: event?.meta?.sessionId || normalizedDriver.duty_session_id,
          vehicleModel: event?.meta?.vehicleModel || normalizedDriver.vehicle_model || null,
          vehiclePlate: event?.meta?.vehiclePlate || normalizedDriver.vehicle_plate || null,
        },
      });

      if (alertInsert.inserted && alertInsert.alert) {
        if (SAFETY_DEBUG_ENABLED) {
          console.log('[SafetyDebug] alert inserted', {
            alertId: alertInsert.alert.id,
            type: alertInsert.alert.type,
            severity: alertInsert.alert.severity,
            driverId: normalizedDriver.id,
            fleetId,
          });
        }
        await notifyFleetAlert(alertInsert.alert);
      } else if (SAFETY_DEBUG_ENABLED) {
        console.log('[SafetyDebug] alert skipped', {
          type: event.type,
          reason: alertInsert.reason || 'unknown',
          driverId: normalizedDriver.id,
          fleetId,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Driver location updated.',
      data: {
        driverId: normalizedDriver.id,
        driverName: normalizedDriver.name,
        vehicleModel: normalizedDriver.vehicle_model,
        vehiclePlate: normalizedDriver.vehicle_plate,
        fleetId: normalizedDriver.fleet_id,
        isOnline: normalizedDriver.is_online,
        dutyStatus: normalizedDriver.duty_status,
        trackingExpected: normalizedDriver.tracking_expected,
        sessionId: normalizedDriver.duty_session_id,
        lastLocation: {
          lat: normalizedDriver.last_lat,
          lng: normalizedDriver.last_lng,
          lastSeen: normalizedDriver.last_seen,
          heading: locationPayload.heading,
          speed: locationPayload.speed,
          speedKmh: isFiniteNumber(speedKmh) ? speedKmh : null,
        },
      },
    });
  } catch (err) {
    console.error('Unhandled error in /api/driver-location:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
