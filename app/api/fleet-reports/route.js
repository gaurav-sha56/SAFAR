import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { DRIVER_BASE_SELECT, DRIVER_DUTY_SELECT, isDriverDutyColumnError, withDriverDutyDefaults } from '@/lib/driver-duty';
import { formatSupabaseError, resolveFleet } from '@/app/api/fleet-dashboard/route-shared';
import { resolveReportWindow, summarizeFleetReport } from '@/lib/reports';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const fleetId = searchParams.get('fleetId');
    const ownerUserId = searchParams.get('ownerUserId');
    const ownerEmail = searchParams.get('ownerEmail');
    const period = searchParams.get('period') || 'weekly';

    if (!fleetId && !ownerUserId && !ownerEmail) {
      return NextResponse.json(
        { success: false, error: 'fleetId or owner identity is required.' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();
    const { fleet, error: fleetResolveError, ambiguous } = await resolveFleet(supabase, { fleetId, ownerUserId, ownerEmail });

    if (fleetResolveError) {
      return NextResponse.json(
        { success: false, error: formatSupabaseError(fleetResolveError, 'Could not resolve fleet for report.') },
        { status: 500 }
      );
    }

    if (ambiguous) {
      return NextResponse.json(
        { success: false, error: 'More than one fleet matches this owner. Please reconnect the owner mapping.' },
        { status: 409 }
      );
    }

    if (!fleet) {
      return NextResponse.json(
        { success: false, error: 'Fleet not found.' },
        { status: 404 }
      );
    }

    const window = resolveReportWindow(period);

    let { data: drivers, error: driversError } = await supabase
      .from('drivers')
      .select(DRIVER_DUTY_SELECT)
      .eq('fleet_id', fleet.id)
      .order('last_seen', { ascending: false });

    if (driversError && isDriverDutyColumnError(driversError)) {
      const fallbackDrivers = await supabase
        .from('drivers')
        .select(DRIVER_BASE_SELECT)
        .eq('fleet_id', fleet.id)
        .order('last_seen', { ascending: false });
      drivers = fallbackDrivers.data;
      driversError = fallbackDrivers.error;
    }

    if (driversError) {
      return NextResponse.json(
        { success: false, error: 'Failed to load drivers for report.' },
        { status: 500 }
      );
    }

    const { data: alerts, error: alertsError } = await supabase
      .from('fleet_alerts')
      .select('id, driver_id, driver_name, driver_phone, type, severity, message, meta, created_at')
      .eq('fleet_id', fleet.id)
      .gte('created_at', window.startDate.toISOString())
      .lte('created_at', window.endDate.toISOString())
      .order('created_at', { ascending: false });

    if (alertsError) {
      return NextResponse.json(
        { success: false, error: 'Failed to load alerts for report.' },
        { status: 500 }
      );
    }

    const normalizedDrivers = (drivers || []).map((driver) => withDriverDutyDefaults(driver));
    const normalizedAlerts = (alerts || []).map((alert) => ({
      id: String(alert.id),
      driverId: alert.driver_id,
      driverName: alert.driver_name,
      driverPhone: alert.driver_phone,
      vehicleModel: alert.meta?.vehicleModel || null,
      vehiclePlate: alert.meta?.vehiclePlate || null,
      type: alert.type,
      severity: alert.severity,
      message: alert.message,
      meta: alert.meta || {},
      createdAt: alert.created_at,
    }));

    const report = summarizeFleetReport({
      fleet: {
        id: fleet.id,
        name: fleet.owner_name || 'My Fleet',
        inviteCode: fleet.invite_code,
      },
      drivers: normalizedDrivers,
      alerts: normalizedAlerts,
      window,
    });

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('Unhandled error in /api/fleet-reports:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
