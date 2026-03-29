import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function POST(request) {
  try {
    const body = await request.json();
    const { fleetId, userId, token, notificationPermission } = body;

    if (!fleetId || !userId || !token) {
      return NextResponse.json(
        { success: false, error: 'fleetId, userId, and token are required.' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();
    const { error } = await supabase
      .from('owner_push_tokens')
      .upsert({
        fleet_id: fleetId,
        user_id: userId,
        token,
        notification_permission: notificationPermission || 'granted',
        user_agent: request.headers.get('user-agent') || null,
        last_seen_at: new Date().toISOString(),
      }, { onConflict: 'token' });

    if (error) {
      console.error('Push token upsert failed:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to save push subscription.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unhandled push subscription error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const token = body?.token;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'token is required.' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();
    const { error } = await supabase
      .from('owner_push_tokens')
      .delete()
      .eq('token', token);

    if (error) {
      console.error('Push token delete failed:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete push subscription.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unhandled push subscription delete error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
