import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { formatDriverAlertIdentity, insertSafetyAlert } from '@/lib/safety';
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

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      driverId,
      fleetId,
      isTracking,
      dutyStatus,
      trackingExpected,
      reason,
      sessionId,
      changedAt,
    } = body;

    if (!driverId || !fleetId || typeof isTracking !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'driverId, fleetId, and isTracking are required.' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();
    const timestamp = typeof changedAt === 'string' && changedAt.trim()
      ? changedAt
      : new Date().toISOString();
    const updates = {
      fleet_id: fleetId,
      is_online: isTracking,
      last_seen: timestamp,
    };

    if ('dutyStatus' in body) {
      updates.duty_status = normalizeDutyStatus(dutyStatus);
      updates.duty_status_changed_at = timestamp;
    }

    if (typeof trackingExpected === 'boolean') {
      updates.tracking_expected = trackingExpected;
    }

    if ('reason' in body) {
      updates.last_tracking_reason = typeof reason === 'string' && reason.trim() ? reason.trim().toLowerCase() : null;
    }

    if ('sessionId' in body) {
      updates.duty_session_id = typeof sessionId === 'string' && sessionId.trim() ? sessionId.trim() : null;
    }

    let { data: updatedDriver, error } = await supabase
      .from('drivers')
      .update(updates)
      .eq('id', driverId)
      .eq('fleet_id', fleetId)
      .select(DRIVER_DUTY_SELECT)
      .single();

    if (error && isDriverDutyColumnError(error)) {
      const fallback = await supabase
        .from('drivers')
        .update(stripDriverDutyFields(updates))
        .eq('id', driverId)
        .eq('fleet_id', fleetId)
        .select(DRIVER_BASE_SELECT)
        .single();

      updatedDriver = fallback.data;
      error = fallback.error;
    }

    if (error || !updatedDriver) {
      console.error('Driver tracking status update error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update driver tracking status.' },
        { status: 404 }
      );
    }

    const normalizedDriver = withDriverDutyDefaults(updatedDriver);

    if (!isTracking && !shouldSuppressTrackingAlerts(normalizedDriver)) {
      const driverIdentity = formatDriverAlertIdentity(normalizedDriver);
      const alertInsert = await insertSafetyAlert(supabase, {
        fleet_id: fleetId,
        driver_id: normalizedDriver.id,
        driver_name: driverIdentity,
        driver_phone: normalizedDriver.phone,
        type: normalizedDriver.duty_status === 'on_duty' ? 'duty_tracking_interrupted' : 'tracking_stopped',
        severity: normalizedDriver.duty_status === 'on_duty' ? 'high' : 'medium',
        message: normalizedDriver.duty_status === 'on_duty'
          ? `${driverIdentity} stopped live tracking during active duty.`
          : `${driverIdentity} stopped live tracking.`,
        meta: {
          lastSeen: normalizedDriver.last_seen,
          dutyStatus: normalizedDriver.duty_status,
          trackingExpected: normalizedDriver.tracking_expected,
          reason: normalizedDriver.last_tracking_reason,
          sessionId: normalizedDriver.duty_session_id,
          vehicleModel: normalizedDriver.vehicle_model || null,
          vehiclePlate: normalizedDriver.vehicle_plate || null,
        },
      });

      if (alertInsert.inserted && alertInsert.alert) {
        await notifyFleetAlert(alertInsert.alert);
      }
    }

    return NextResponse.json({
      success: true,
      message: isTracking ? 'Tracking resumed.' : 'Tracking stopped.',
      data: {
        driver: {
          id: normalizedDriver.id,
          name: normalizedDriver.name,
          phone: normalizedDriver.phone,
          vehicleModel: normalizedDriver.vehicle_model,
          vehiclePlate: normalizedDriver.vehicle_plate,
          fleetId: normalizedDriver.fleet_id,
          isOnline: normalizedDriver.is_online,
          lastSeen: normalizedDriver.last_seen,
          lastLat: normalizedDriver.last_lat,
          lastLng: normalizedDriver.last_lng,
          dutyStatus: normalizedDriver.duty_status,
          trackingExpected: normalizedDriver.tracking_expected,
          lastTrackingReason: normalizedDriver.last_tracking_reason,
          sessionId: normalizedDriver.duty_session_id,
          dutyStatusChangedAt: normalizedDriver.duty_status_changed_at,
        },
      },
    });
  } catch (error) {
    console.error('Unhandled error in /api/driver-tracking-status:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
