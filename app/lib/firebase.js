import { getApp, getApps, initializeApp } from 'firebase/app';
import { getMessaging, getToken, isSupported, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function hasFirebaseClientConfig() {
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.messagingSenderId &&
    firebaseConfig.appId
  );
}

function getFirebaseApp() {
  if (!hasFirebaseClientConfig()) {
    return null;
  }

  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

function buildPushErrorMessage(error) {
  const code = error?.code || '';
  const message = error?.message || '';

  if (code.includes('unsupported-browser')) {
    return 'This browser does not support SAFAR push notifications yet.';
  }

  if (code.includes('permission-blocked')) {
    return 'Notification permission is blocked. Enable notifications from browser settings and try again.';
  }

  if (code.includes('failed-service-worker-registration')) {
    return 'The SAFAR service worker is not ready yet. Refresh once and try enabling notifications again.';
  }

  if (code.includes('token-subscribe-failed') || message.includes('push service error')) {
    return 'The browser could not create a push subscription. Reopen the installed app and try again.';
  }

  if (message.includes('no active Service Worker')) {
    return 'The SAFAR background worker is still starting. Wait a moment, refresh, and try again.';
  }

  return message || 'SAFAR could not finish push notification setup.';
}

export function getFirebaseMessagingDebugInfo() {
  return {
    hasWindow: typeof window !== 'undefined',
    hasNotificationApi: typeof window !== 'undefined' ? 'Notification' in window : false,
    permission: typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported',
    hasServiceWorker: typeof navigator !== 'undefined' ? 'serviceWorker' in navigator : false,
    config: {
      apiKey: Boolean(firebaseConfig.apiKey),
      authDomain: Boolean(firebaseConfig.authDomain),
      projectId: Boolean(firebaseConfig.projectId),
      storageBucket: Boolean(firebaseConfig.storageBucket),
      messagingSenderId: Boolean(firebaseConfig.messagingSenderId),
      appId: Boolean(firebaseConfig.appId),
      vapidKey: Boolean(process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY),
    },
  };
}

export async function isFirebaseMessagingSupported() {
  if (typeof window === 'undefined' || !hasFirebaseClientConfig()) {
    return false;
  }

  try {
    return await isSupported();
  } catch {
    return false;
  }
}

export async function requestFirebaseToken() {
  if (typeof window === 'undefined') {
    return null;
  }

  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  if (!vapidKey) {
    throw new Error('NEXT_PUBLIC_FIREBASE_VAPID_KEY is missing.');
  }

  const supported = await isFirebaseMessagingSupported();
  if (!supported) {
    return null;
  }

  const app = getFirebaseApp();
  if (!app) {
    throw new Error('Firebase messaging configuration is incomplete.');
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    if (!registration?.active) {
      throw new Error('The SAFAR service worker is not active yet.');
    }

    const messaging = getMessaging(app);
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });

    if (!token) {
      throw new Error('Firebase did not return a push token for this device.');
    }

    return token;
  } catch (error) {
    throw new Error(buildPushErrorMessage(error));
  }
}

export async function listenForForegroundMessages(handler) {
  const supported = await isFirebaseMessagingSupported();
  if (!supported) {
    return () => {};
  }

  const app = getFirebaseApp();
  if (!app) {
    return () => {};
  }

  const messaging = getMessaging(app);
  return onMessage(messaging, handler);
}
