import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { formatSupabaseError, resolveFleet } from '@/app/api/fleet-dashboard/route-shared';

const VALID_PERIODS = new Set(['daily', 'weekly', 'monthly']);
const VALID_DELIVERY_MODES = new Set(['manual', 'email', 'download_only']);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const fleetId = searchParams.get('fleetId');
    const ownerUserId = searchParams.get('ownerUserId');
    const ownerEmail = searchParams.get('ownerEmail');

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
        { success: false, error: formatSupabaseError(fleetResolveError, 'Could not resolve fleet for report schedules.') },
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

    const { data, error } = await supabase
      .from('fleet_report_schedules')
      .select('id, fleet_id, owner_user_id, period, delivery_mode, enabled, recipient_email, last_generated_at, created_at, updated_at')
      .eq('fleet_id', fleet.id)
      .order('period', { ascending: true });

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to load report schedules.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    console.error('Unhandled error in /api/fleet-report-schedules GET:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error.' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      fleetId,
      ownerUserId,
      ownerEmail,
      period,
      deliveryMode = 'manual',
      enabled = true,
      recipientEmail = null,
    } = body;

    if (!fleetId && !ownerUserId && !ownerEmail) {
      return NextResponse.json(
        { success: false, error: 'fleetId or owner identity is required.' },
        { status: 400 }
      );
    }

    const normalizedPeriod = typeof period === 'string' ? period.trim().toLowerCase() : '';
    if (!VALID_PERIODS.has(normalizedPeriod)) {
      return NextResponse.json(
        { success: false, error: 'Valid period is required.' },
        { status: 400 }
      );
    }

    const normalizedDeliveryMode = typeof deliveryMode === 'string' ? deliveryMode.trim().toLowerCase() : 'manual';
    if (!VALID_DELIVERY_MODES.has(normalizedDeliveryMode)) {
      return NextResponse.json(
        { success: false, error: 'Invalid delivery mode.' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();
    const { fleet, error: fleetResolveError, ambiguous } = await resolveFleet(supabase, { fleetId, ownerUserId, ownerEmail });

    if (fleetResolveError) {
      return NextResponse.json(
        { success: false, error: formatSupabaseError(fleetResolveError, 'Could not resolve fleet for report schedules.') },
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

    const { data, error } = await supabase
      .from('fleet_report_schedules')
      .upsert({
        fleet_id: fleet.id,
        owner_user_id: ownerUserId || null,
        period: normalizedPeriod,
        delivery_mode: normalizedDeliveryMode,
        enabled: Boolean(enabled),
        recipient_email: typeof recipientEmail === 'string' && recipientEmail.trim() ? recipientEmail.trim().toLowerCase() : null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'fleet_id,period' })
      .select('id, fleet_id, owner_user_id, period, delivery_mode, enabled, recipient_email, last_generated_at, created_at, updated_at')
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to save report schedule.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Unhandled error in /api/fleet-report-schedules POST:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
