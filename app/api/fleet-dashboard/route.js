import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { buildOfflineAlerts } from '@/lib/safety';
import { DRIVER_BASE_SELECT, DRIVER_DUTY_SELECT, isDriverDutyColumnError, withDriverDutyDefaults } from '@/lib/driver-duty';
import { randomInt } from 'node:crypto';
import {
  FLEET_BASE_SELECT,
  FLEET_OWNER_SELECT,
  formatSupabaseError,
  normalizeOwnerEmail,
  resolveFleet,
} from './route-shared';

function generateInviteCode() {
  return randomInt(0, 100000).toString().padStart(5, '0');
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const fleetId = searchParams.get('fleetId');
    const ownerUserId = searchParams.get('ownerUserId');
    const ownerEmail = searchParams.get('ownerEmail');
    const alertLimitParam = Number.parseInt(searchParams.get('alertLimit') || '12', 10);
    const alertLimit = Number.isFinite(alertLimitParam)
      ? Math.min(Math.max(alertLimitParam, 1), 200)
      : 12;

    if (!fleetId && !ownerUserId && !ownerEmail) {
      return NextResponse.json(
        { success: false, error: 'fleetId or owner identity is required.' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();
    const { fleet, error: fleetResolveError, ambiguous } = await resolveFleet(supabase, { fleetId, ownerUserId, ownerEmail });

    if (fleetResolveError) {
      console.error('Fleet resolution error:', fleetResolveError);
      return NextResponse.json(
        { success: false, error: formatSupabaseError(fleetResolveError, 'Could not resolve fleet.') },
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

    const [
      driversResult,
      { data: alerts, error: alertsError },
    ] = await Promise.all([
      supabase
        .from('drivers')
        .select(DRIVER_DUTY_SELECT)
        .eq('fleet_id', fleet.id)
        .order('last_seen', { ascending: false }),
      supabase
        .from('fleet_alerts')
        .select('id, driver_id, driver_name, driver_phone, type, severity, message, meta, created_at')
        .eq('fleet_id', fleet.id)
        .order('created_at', { ascending: false })
        .limit(alertLimit),
    ]);

    let drivers = driversResult.data;
    let driversError = driversResult.error;

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
      vehicleModel: alert.meta?.vehicleModel || null,
      vehiclePlate: alert.meta?.vehiclePlate || null,
      type: alert.type,
      severity: alert.severity,
      message: alert.message,
      meta: alert.meta || {},
      createdAt: alert.created_at,
    }));

    const offlineAlerts = buildOfflineAlerts(drivers ?? [], normalizedAlerts);

    const normalizedDrivers = (drivers ?? []).map((driver) => {
      const entry = withDriverDutyDefaults(driver);
      return {
        ...entry,
        dutyStatus: entry.duty_status,
        trackingExpected: entry.tracking_expected,
        lastTrackingReason: entry.last_tracking_reason,
        sessionId: entry.duty_session_id,
        dutyStatusChangedAt: entry.duty_status_changed_at,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        fleet: {
          id: fleet.id,
          name: fleet.owner_name || 'My Fleet',
          inviteCode: fleet.invite_code,
        },
        drivers: normalizedDrivers,
        alerts: [...normalizedAlerts, ...offlineAlerts]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, alertLimit),
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
    const { fleetId, ensureExists, ownerEmail, ownerUserId } = body;

    if (!fleetId && !ownerUserId && !ownerEmail) {
      return NextResponse.json(
        { success: false, error: 'fleetId or owner identity is required.' },
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
    const normalizedOwnerEmail = normalizeOwnerEmail(ownerEmail);
    const { fleet: existingFleet, error: resolveError, ambiguous } = await resolveFleet(supabase, { fleetId, ownerUserId, ownerEmail });

    if (resolveError) {
      console.error('Fleet existence check error:', resolveError);
      return NextResponse.json(
        { success: false, error: formatSupabaseError(resolveError, 'Failed to check fleet existence.') },
        { status: 500 }
      );
    }

    if (ambiguous) {
      return NextResponse.json(
        { success: false, error: 'More than one fleet matches this owner. Please reconnect the owner mapping.' },
        { status: 409 }
      );
    }

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
          owner_user_id: ownerUserId || null,
          owner_email: normalizedOwnerEmail,
        }, { onConflict: 'id' })
        .select(FLEET_OWNER_SELECT)
        .single();

      let createdFleet = newFleet;
      let finalCreateError = createError;

      if (createError && isOwnerIdentityColumnError(createError)) {
        const fallbackCreate = await supabase
          .from('fleets')
          .upsert({
            id: fleetId,
            owner_name: 'My Fleet',
            invite_code: initialInviteCode,
          }, { onConflict: 'id' })
          .select(FLEET_BASE_SELECT)
          .single();

        createdFleet = fallbackCreate.data;
        finalCreateError = fallbackCreate.error;
      }

      if (finalCreateError) {
        console.error('Fleet creation error:', finalCreateError);
        return NextResponse.json(
          { success: false, error: formatSupabaseError(finalCreateError, 'Failed to create fleet.') },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Fleet created successfully.',
        data: {
          fleet: {
            id: createdFleet.id,
            name: createdFleet.owner_name,
            inviteCode: createdFleet.invite_code,
          },
        },
      });
    }

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
    const { fleetId, ownerName, ownerUserId, ownerEmail } = body;

    if (!fleetId && !ownerUserId && !ownerEmail) {
      return NextResponse.json(
        { success: false, error: 'fleetId or owner identity is required.' },
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
    const { fleet, error: fleetResolveError, ambiguous } = await resolveFleet(supabase, { fleetId, ownerUserId, ownerEmail });

    if (fleetResolveError) {
      console.error('Fleet update resolution error:', fleetResolveError);
      return NextResponse.json(
        { success: false, error: formatSupabaseError(fleetResolveError, 'Failed to resolve fleet before updating.') },
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

    let { data: updatedFleet, error: updateError } = await supabase
      .from('fleets')
      .update({
        owner_name: String(ownerName).trim(),
        owner_user_id: ownerUserId || fleet.owner_user_id || null,
        owner_email: normalizeOwnerEmail(ownerEmail) || fleet.owner_email || null,
      })
      .eq('id', fleet.id)
      .select(FLEET_BASE_SELECT)
      .single();

    if (updateError && isOwnerIdentityColumnError(updateError)) {
      const fallbackUpdate = await supabase
        .from('fleets')
        .update({
          owner_name: String(ownerName).trim(),
        })
        .eq('id', fleet.id)
        .select(FLEET_BASE_SELECT)
        .single();

      updatedFleet = fallbackUpdate.data;
      updateError = fallbackUpdate.error;
    }

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
