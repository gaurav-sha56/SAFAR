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

  const registration = await navigator.serviceWorker.ready;
  const messaging = getMessaging(app);

  return getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration: registration,
  });
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
