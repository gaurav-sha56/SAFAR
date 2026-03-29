import { createServerClient } from '@/lib/supabase';
import { getFirebaseAdminMessaging } from '@/lib/firebase-admin';

function buildAlertNotificationPayload(alert) {
  const severity = alert.severity || 'medium';
  const isCritical = severity === 'high' || alert.type === 'sos';
  const title = isCritical
    ? `Urgent: ${alert.driver_name || 'Driver'} alert`
    : `Fleet alert: ${alert.driver_name || 'Driver'}`;
  const url = isCritical ? '/owner/sos' : '/owner/alerts';

  return {
    title,
    body: alert.message,
    url,
    severity,
    tag: `fleet-alert-${alert.id}`,
  };
}

export async function notifyFleetAlert(alert) {
  if (!alert?.fleet_id || !alert?.message) {
    return { delivered: false, reason: 'invalid_alert' };
  }

  const messaging = getFirebaseAdminMessaging();
  if (!messaging) {
    return { delivered: false, reason: 'firebase_config_missing' };
  }

  try {
    const supabase = createServerClient();
    const { data: subscriptions, error } = await supabase
      .from('owner_push_tokens')
      .select('id, token')
      .eq('fleet_id', alert.fleet_id);

    if (error) {
      console.warn('Push subscription fetch failed:', error.message);
      return { delivered: false, reason: 'subscription_fetch_failed' };
    }

    const tokens = (subscriptions || []).map((entry) => entry.token).filter(Boolean);
    if (!tokens.length) {
      return { delivered: false, reason: 'no_tokens' };
    }

    const payload = buildAlertNotificationPayload(alert);
    const response = await messaging.sendEachForMulticast({
      tokens,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: {
        alertId: String(alert.id),
        fleetId: String(alert.fleet_id),
        driverId: alert.driver_id ? String(alert.driver_id) : '',
        type: alert.type || '',
        severity: payload.severity,
        title: payload.title,
        body: payload.body,
        url: payload.url,
        tag: payload.tag,
      },
      android: {
        priority: 'high',
      },
      webpush: {
        headers: {
          Urgency: payload.severity === 'high' ? 'high' : 'normal',
        },
        notification: {
          title: payload.title,
          body: payload.body,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-192x192.png',
          tag: payload.tag,
          requireInteraction: payload.severity === 'high',
          renotify: true,
          data: {
            url: payload.url,
          },
        },
        fcmOptions: {
          link: payload.url,
        },
      },
    });

    const invalidTokens = [];
    response.responses.forEach((result, index) => {
      if (!result.success) {
        const code = result.error?.code || '';
        if (
          code.includes('registration-token-not-registered') ||
          code.includes('invalid-argument')
        ) {
          invalidTokens.push(tokens[index]);
        }
        console.warn('FCM send failed:', result.error?.message || code);
      }
    });

    if (invalidTokens.length) {
      await supabase.from('owner_push_tokens').delete().in('token', invalidTokens);
    }

    return {
      delivered: response.successCount > 0,
      successCount: response.successCount,
      failureCount: response.failureCount,
    };
  } catch (error) {
    console.warn('FCM notification failed:', error);
    return { delivered: false, reason: 'send_failed' };
  }
}
