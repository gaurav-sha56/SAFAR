import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { insertSafetyAlert, OVERSPEED_THRESHOLD_KMH } from '@/lib/safety';

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
    } = body;

    if (!driverId || !fleetId || !isFiniteNumber(lat) || !isFiniteNumber(lng)) {
      return NextResponse.json(
        { success: false, error: 'driverId, fleetId, lat, and lng are required.' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();
    const locationPayload = {
      lat,
      lng,
      heading: isFiniteNumber(heading) ? heading : null,
      speed: isFiniteNumber(speed) ? speed : null,
      updatedAt: new Date().toISOString(),
    };

    const { data: updatedDriver, error: updateError } = await supabase
      .from('drivers')
      .update({
        fleet_id: fleetId,
        last_lat: lat,
        last_lng: lng,
        last_seen: new Date().toISOString(),
        is_online: true,
      })
      .eq('id', driverId)
      .eq('fleet_id', fleetId)
      .select('id, name, phone, fleet_id, is_online, last_lat, last_lng, last_seen')
      .single();

    if (updateError || !updatedDriver) {
      console.error('Driver location update error:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update driver location.' },
        { status: 404 }
      );
    }

    const normalizedEvents = Array.isArray(safetyEvents) ? safetyEvents : [];

    if (isFiniteNumber(speedKmh) && speedKmh >= OVERSPEED_THRESHOLD_KMH) {
      normalizedEvents.push({
        type: 'overspeed',
        severity: 'high',
        message: `${updatedDriver.name || updatedDriver.phone} is overspeeding at ${Math.round(speedKmh)} km/h.`,
        meta: {
          speedKmh,
          thresholdKmh: OVERSPEED_THRESHOLD_KMH,
          lat,
          lng,
        },
      });
    }

    for (const event of normalizedEvents) {
      if (!event?.type || !event?.message) {
        continue;
      }

      await insertSafetyAlert(supabase, {
        fleet_id: fleetId,
        driver_id: updatedDriver.id,
        driver_name: updatedDriver.name,
        driver_phone: updatedDriver.phone,
        type: event.type,
        severity: event.severity || 'medium',
        message: event.message,
        meta: event.meta || {},
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Driver location updated.',
      data: {
        driverId: updatedDriver.id,
        fleetId: updatedDriver.fleet_id,
        isOnline: updatedDriver.is_online,
        lastLocation: {
          lat: updatedDriver.last_lat,
          lng: updatedDriver.last_lng,
          lastSeen: updatedDriver.last_seen,
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
