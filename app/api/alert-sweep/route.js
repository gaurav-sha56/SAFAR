import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { formatDriverAlertIdentity, insertSafetyAlert, OFFLINE_ALERT_THRESHOLD_MS } from '@/lib/safety';
import { DRIVER_BASE_SELECT, DRIVER_DUTY_SELECT, isDriverDutyColumnError, shouldSuppressTrackingAlerts, withDriverDutyDefaults } from '@/lib/driver-duty';
import { notifyFleetAlert } from '@/lib/push-notifications';

function isAuthorized(request) {
  const secret = process.env.ALERT_SWEEP_SECRET;
  if (!secret) return true;

  const bearer = request.headers.get('authorization');
  const suppliedSecret = request.headers.get('x-alert-sweep-secret');

  if (suppliedSecret && suppliedSecret === secret) {
    return true;
  }

  if (bearer && bearer === `Bearer ${secret}`) {
    return true;
  }

  return false;
}

export async function GET(request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const supabase = createServerClient();
    const cutoff = new Date(Date.now() - OFFLINE_ALERT_THRESHOLD_MS).toISOString();

    let { data: drivers, error } = await supabase
      .from('drivers')
      .select(DRIVER_DUTY_SELECT)
      .not('fleet_id', 'is', null)
      .eq('is_online', true)
      .not('last_seen', 'is', null)
      .lte('last_seen', cutoff)
      .order('last_seen', { ascending: true })
      .limit(200);

    if (error && isDriverDutyColumnError(error)) {
      const fallback = await supabase
        .from('drivers')
        .select(DRIVER_BASE_SELECT)
        .not('fleet_id', 'is', null)
        .eq('is_online', true)
        .not('last_seen', 'is', null)
        .lte('last_seen', cutoff)
        .order('last_seen', { ascending: true })
        .limit(200);

      drivers = fallback.data;
      error = fallback.error;
    }

    if (error) {
      console.error('Alert sweep driver fetch failed:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to load drivers for alert sweep.' },
        { status: 500 }
      );
    }

    let insertedCount = 0;

    for (const entry of drivers || []) {
      const driver = withDriverDutyDefaults(entry);
      if (shouldSuppressTrackingAlerts(driver)) {
        continue;
      }

      const driverIdentity = formatDriverAlertIdentity(driver);
      const alertInsert = await insertSafetyAlert(supabase, {
        fleet_id: driver.fleet_id,
        driver_id: driver.id,
        driver_name: driverIdentity,
        driver_phone: driver.phone,
        type: 'device_offline',
        severity: 'high',
        message: `${driverIdentity} has not sent location updates for at least ${Math.max(2, Math.round(OFFLINE_ALERT_THRESHOLD_MS / 60000))} min.`,
        meta: {
          lastSeen: driver.last_seen,
          lastLat: driver.last_lat,
          lastLng: driver.last_lng,
          dutyStatus: driver.duty_status,
          trackingExpected: driver.tracking_expected,
          sessionId: driver.duty_session_id,
          vehicleModel: driver.vehicle_model || null,
          vehiclePlate: driver.vehicle_plate || null,
          source: 'alert_sweep',
        },
      });

      if (alertInsert.inserted && alertInsert.alert) {
        insertedCount += 1;
        await notifyFleetAlert(alertInsert.alert);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        scannedDrivers: (drivers || []).length,
        insertedAlerts: insertedCount,
      },
    });
  } catch (error) {
    console.error('Unhandled alert sweep error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
