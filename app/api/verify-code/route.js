import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function POST(request) {
  try {
    const body = await request.json();
    const { inviteCode, driverPhone, driverName } = body;

    // --- Input Validation ---
    if (!inviteCode || !driverPhone || !driverName) {
      return NextResponse.json(
        { success: false, error: 'inviteCode, driverPhone, and driverName are required.' },
        { status: 400 }
      );
    }

    const codeStr = String(inviteCode).trim();
    if (!/^\d{5}$/.test(codeStr)) {
      return NextResponse.json(
        { success: false, error: 'inviteCode must be exactly 5 digits.' },
        { status: 400 }
      );
    }

    const phoneStr = String(driverPhone).trim();
    if (!/^\+?[0-9]{10,15}$/.test(phoneStr)) {
      return NextResponse.json(
        { success: false, error: 'driverPhone must be a valid phone number.' },
        { status: 400 }
      );
    }

    const nameStr = String(driverName).trim();
    if (!nameStr) {
      return NextResponse.json(
        { success: false, error: 'driverName is required.' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // --- Step 1: Look up the fleet by invite code ---
    const { data: fleet, error: fleetError } = await supabase
      .from('fleets')
      .select('id, owner_name, invite_code')
      .eq('invite_code', codeStr)
      .single();

    if (fleetError || !fleet) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired invite code.' },
        { status: 404 }
      );
    }

    // --- Step 2: Upsert the driver record and link to fleet ---
    // Uses phone as unique key — if driver re-scans, it updates their fleet link.
    const { data: driver, error: driverError } = await supabase
      .from('drivers')
      .upsert(
        {
          name: nameStr,
          phone: phoneStr,
          fleet_id: fleet.id,
          is_online: false,
        },
        {
          onConflict: 'phone',
          ignoreDuplicates: false,
        }
      )
      .select('id, name, phone, fleet_id, last_lat, last_lng, last_seen, is_online')
      .single();

    if (driverError) {
      console.error('Driver upsert error:', driverError);
      return NextResponse.json(
        { success: false, error: 'Failed to register driver. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully joined fleet "${fleet.owner_name}".`,
      data: {
        driver: {
          id: driver.id,
          name: driver.name,
          phone: driver.phone,
          fleetId: driver.fleet_id,
          isOnline: driver.is_online,
          joinedAt: driver.last_seen,
        },
        fleet: {
          id: fleet.id,
          name: fleet.owner_name,
          inviteCode: fleet.invite_code,
        },
        tracking: {
          driverId: driver.id,
          fleetId: fleet.id,
          saveDriverId: true,
        },
      },
    });
  } catch (err) {
    console.error('Unhandled error in /api/verify-code:', err);
    const isConfigError =
      err instanceof Error && err.message.includes('Supabase server environment variables are missing or invalid');

    return NextResponse.json(
      {
        success: false,
        error: isConfigError
          ? 'Server config is incomplete. Add SUPABASE_SERVICE_ROLE_KEY to .env.local and restart the dev server.'
          : 'Internal server error.',
      },
      { status: isConfigError ? 503 : 500 }
    );
  }
}
