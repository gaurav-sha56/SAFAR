import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { buildOfflineAlerts } from '@/lib/safety';
import { randomInt } from 'node:crypto';

function formatSupabaseError(error, fallbackMessage) {
  if (!error) {
    return fallbackMessage;
  }

  const parts = [error.message, error.details, error.hint].filter(Boolean);
  return parts.length ? parts.join(' | ') : fallbackMessage;
}

function generateInviteCode() {
  return randomInt(0, 100000).toString().padStart(5, '0');
}

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
          name: fleet.owner_name || 'My Fleet',
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

export async function POST(request) {
  try {
    const body = await request.json();
    const { fleetId, ensureExists, ownerEmail } = body;

    if (!fleetId) {
      return NextResponse.json(
        { success: false, error: 'fleetId is required.' },
        { status: 400 }
      );
    }

    if (!ensureExists) {
      return NextResponse.json(
        { success: false, error: 'Invalid request.' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Check if fleet already exists
    const { data: existingFleet, error: checkError } = await supabase
      .from('fleets')
      .select('id, owner_name, invite_code')
      .eq('id', fleetId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Fleet existence check error:', checkError);
      return NextResponse.json(
        { success: false, error: formatSupabaseError(checkError, 'Failed to check fleet existence.') },
        { status: 500 }
      );
    }

    // If fleet doesn't exist, create it with default name
    if (!existingFleet) {
      let initialInviteCode = null;
      let attempts = 0;

      while (attempts < 25) {
        const candidateCode = generateInviteCode();
        const { data: conflictingFleet, error: codeCheckError } = await supabase
          .from('fleets')
          .select('id')
          .eq('invite_code', candidateCode)
          .maybeSingle();

        if (codeCheckError) {
          console.error('Invite code uniqueness check error:', codeCheckError);
          return NextResponse.json(
            { success: false, error: formatSupabaseError(codeCheckError, 'Could not prepare a unique invite code.') },
            { status: 500 }
          );
        }

        if (!conflictingFleet) {
          initialInviteCode = candidateCode;
          break;
        }

        attempts += 1;
      }

      if (!initialInviteCode) {
        return NextResponse.json(
          { success: false, error: 'Could not generate an initial invite code for this fleet.' },
          { status: 409 }
        );
      }

      const { data: newFleet, error: createError } = await supabase
        .from('fleets')
        .upsert({
          id: fleetId,
          owner_name: 'My Fleet',
          invite_code: initialInviteCode,
        }, { onConflict: 'id' })
        .select('id, owner_name, invite_code')
        .single();

      if (createError) {
        console.error('Fleet creation error:', createError);
        return NextResponse.json(
          { success: false, error: formatSupabaseError(createError, 'Failed to create fleet.') },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Fleet created successfully.',
        data: {
          fleet: {
            id: newFleet.id,
            name: newFleet.owner_name,
            inviteCode: newFleet.invite_code,
          },
        },
      });
    }

    // Fleet already exists
    return NextResponse.json({
      success: true,
      message: 'Fleet already exists.',
      data: {
        fleet: {
          id: existingFleet.id,
          name: existingFleet.owner_name,
          inviteCode: existingFleet.invite_code,
        },
      },
    });
  } catch (error) {
    console.error('Unhandled error in /api/fleet-dashboard POST:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const { fleetId, ownerName } = body;

    if (!fleetId) {
      return NextResponse.json(
        { success: false, error: 'fleetId is required.' },
        { status: 400 }
      );
    }

    if (!ownerName || !String(ownerName).trim()) {
      return NextResponse.json(
        { success: false, error: 'ownerName is required.' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    const { data: updatedFleet, error: updateError } = await supabase
      .from('fleets')
      .update({
        owner_name: String(ownerName).trim(),
      })
      .eq('id', fleetId)
      .select('id, owner_name, invite_code')
      .single();

    if (updateError || !updatedFleet) {
      console.error('Fleet update error:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update fleet name.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        fleet: {
          id: updatedFleet.id,
          name: updatedFleet.owner_name || 'My Fleet',
          inviteCode: updatedFleet.invite_code,
        },
      },
    });
  } catch (error) {
    console.error('Unhandled error in /api/fleet-dashboard PATCH:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
