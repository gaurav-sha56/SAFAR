import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function PATCH(request, { params }) {
  try {
    const { alertId } = await params;
    const body = await request.json();
    const {
      resolutionStatus = 'resolved',
      resolutionNote = null,
      resolvedBy = null,
    } = body;

    if (!alertId) {
      return NextResponse.json(
        { success: false, error: 'alertId is required.' },
        { status: 400 }
      );
    }

    const normalizedStatus = typeof resolutionStatus === 'string'
      ? resolutionStatus.trim().toLowerCase()
      : 'resolved';

    if (!['resolved', 'false_alarm', 'reviewed', 'open'].includes(normalizedStatus)) {
      return NextResponse.json(
        { success: false, error: 'Invalid resolutionStatus.' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();
    const updates = {
      resolution_status: normalizedStatus,
      resolution_note: typeof resolutionNote === 'string' && resolutionNote.trim() ? resolutionNote.trim() : null,
      resolved_by: typeof resolvedBy === 'string' && resolvedBy.trim() ? resolvedBy.trim() : null,
      resolved_at: normalizedStatus === 'open' ? null : new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('fleet_alerts')
      .update(updates)
      .eq('id', alertId)
      .select('id, resolution_status, resolution_note, resolved_by, resolved_at')
      .single();

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: 'Failed to update alert resolution.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Unhandled error in /api/fleet-alerts/[alertId]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
