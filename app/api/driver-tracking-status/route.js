import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { insertSafetyAlert } from '@/lib/safety';

export async function POST(request) {
  try {
    const body = await request.json();
    const { driverId, fleetId, isTracking } = body;

    if (!driverId || !fleetId || typeof isTracking !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'driverId, fleetId, and isTracking are required.' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();
    const timestamp = new Date().toISOString();

    const { data: updatedDriver, error } = await supabase
      .from('drivers')
      .update({
        fleet_id: fleetId,
        is_online: isTracking,
        last_seen: timestamp,
      })
      .eq('id', driverId)
      .eq('fleet_id', fleetId)
      .select('id, name, phone, fleet_id, is_online, last_seen, last_lat, last_lng')
      .single();

    if (error || !updatedDriver) {
      console.error('Driver tracking status update error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update driver tracking status.' },
        { status: 404 }
      );
    }

    if (!isTracking) {
      await insertSafetyAlert(supabase, {
        fleet_id: fleetId,
        driver_id: updatedDriver.id,
        driver_name: updatedDriver.name,
        driver_phone: updatedDriver.phone,
        type: 'tracking_stopped',
        severity: 'medium',
        message: `${updatedDriver.name || updatedDriver.phone} stopped live tracking.`,
        meta: {
          lastSeen: updatedDriver.last_seen,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: isTracking ? 'Tracking resumed.' : 'Tracking stopped.',
      data: {
        driver: {
          id: updatedDriver.id,
          name: updatedDriver.name,
          phone: updatedDriver.phone,
          fleetId: updatedDriver.fleet_id,
          isOnline: updatedDriver.is_online,
          lastSeen: updatedDriver.last_seen,
          lastLat: updatedDriver.last_lat,
          lastLng: updatedDriver.last_lng,
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
