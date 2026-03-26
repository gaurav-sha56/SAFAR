import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { randomInt } from 'node:crypto';

// Generates a cryptographically safe 5-digit code (00000–99999)
function generateInviteCode() {
  return randomInt(0, 100000).toString().padStart(5, '0');
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { fleetId, ownerId } = body;

    if (!fleetId) {
      return NextResponse.json(
        { success: false, error: 'fleetId is required.' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    let fleetQuery = supabase
      .from('fleets')
      .select('id, owner_name')
      .eq('id', fleetId);

    // Owner checks can be wired back in once the database stores an owner identifier.

    const { data: fleet, error: fetchError } = await fleetQuery.single();

    if (fetchError || !fleet) {
      return NextResponse.json(
        { success: false, error: ownerId ? 'Fleet not found or access denied.' : 'Fleet not found.' },
        { status: ownerId ? 403 : 404 }
      );
    }

    const { count: driverCount, error: driverCountError } = await supabase
      .from('drivers')
      .select('id', { count: 'exact', head: true })
      .eq('fleet_id', fleetId);

    if (driverCountError) {
      console.error('Driver count check error:', driverCountError);
      return NextResponse.json(
        { success: false, error: 'Could not verify linked drivers for this fleet.' },
        { status: 500 }
      );
    }

    if ((driverCount ?? 0) > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invite code is locked because at least one driver has already joined this fleet.',
        },
        { status: 409 }
      );
    }

    // Generate a unique code and avoid clashes with any other fleet.
    let newCode;
    let attempts = 0;
    let isUnique = false;

    while (attempts < 25) {
      newCode = generateInviteCode();
      const { data: existing } = await supabase
        .from('fleets')
        .select('id')
        .eq('invite_code', newCode)
        .neq('id', fleetId)
        .maybeSingle();

      if (!existing) {
        isUnique = true;
        break;
      }

      attempts++;
    }

    if (!isUnique) {
      return NextResponse.json(
        { success: false, error: 'Could not generate a unique invite code. Please try again.' },
        { status: 409 }
      );
    }

    // Update the fleet's invite code
    const { data: updated, error: updateError } = await supabase
      .from('fleets')
      .update({
        invite_code: newCode,
      })
      .eq('id', fleetId)
      .select('id, owner_name, invite_code')
      .single();

    if (updateError) {
      console.error('Code update error:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to generate code.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        fleetId: updated.id,
        fleetName: updated.owner_name,
        inviteCode: updated.invite_code,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('Unhandled error in /api/generate-code:', err);
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
