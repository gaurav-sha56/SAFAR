import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { buildOfflineAlerts } from '@/lib/safety';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const fleetId = searchParams.get('fleetId');

    if (!fleetId) {
      return NextResponse.json(
        { success: false, error: 'fleetId is required.' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    const [
      { data: fleet, error: fleetError },
      { data: drivers, error: driversError },
      { data: alerts, error: alertsError },
    ] = await Promise.all([
      supabase
        .from('fleets')
        .select('id, owner_name, invite_code')
        .eq('id', fleetId)
        .single(),
      supabase
        .from('drivers')
        .select('id, name, phone, fleet_id, last_lat, last_lng, last_seen, is_online')
        .eq('fleet_id', fleetId)
        .order('last_seen', { ascending: false }),
      supabase
        .from('fleet_alerts')
        .select('id, driver_id, driver_name, driver_phone, type, severity, message, meta, created_at')
        .eq('fleet_id', fleetId)
        .order('created_at', { ascending: false })
        .limit(12),
    ]);

    if (fleetError || !fleet) {
      return NextResponse.json(
        { success: false, error: 'Fleet not found.' },
        { status: 404 }
      );
    }

    if (driversError) {
      console.error('Drivers fetch error:', driversError);
      return NextResponse.json(
        { success: false, error: 'Failed to load fleet drivers.' },
        { status: 500 }
      );
    }

    if (alertsError) {
      console.warn('Alerts fetch skipped:', alertsError.message);
    }

    const normalizedAlerts = (alerts ?? []).map((alert) => ({
      id: String(alert.id),
      driverId: alert.driver_id,
      driverName: alert.driver_name,
      driverPhone: alert.driver_phone,
      type: alert.type,
      severity: alert.severity,
      message: alert.message,
      meta: alert.meta || {},
      createdAt: alert.created_at,
    }));

    const offlineAlerts = buildOfflineAlerts(drivers ?? [], normalizedAlerts);

    return NextResponse.json({
      success: true,
      data: {
        fleet: {
          id: fleet.id,
          name: fleet.owner_name ? `${fleet.owner_name}'s Fleet` : 'Safar Cabs Fleet',
          inviteCode: fleet.invite_code,
        },
        drivers: drivers ?? [],
        alerts: [...normalizedAlerts, ...offlineAlerts]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 12),
      },
    });
  } catch (error) {
    console.error('Unhandled error in /api/fleet-dashboard:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
