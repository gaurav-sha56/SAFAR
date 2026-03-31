import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

function normalizePrivateKey(value) {
  if (!value) return '';

  let normalized = String(value).trim();

  if (
    (normalized.startsWith('"') && normalized.endsWith('"')) ||
    (normalized.startsWith("'") && normalized.endsWith("'"))
  ) {
    normalized = normalized.slice(1, -1);
  }

  return normalized
    .replace(/\r\n/g, '\n')
    .replace(/\\n/g, '\n');
}

function getFirebaseAdminConfig() {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '';
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || '';
  const privateKey = normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY || '');

  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }

  return { projectId, clientEmail, privateKey };
}

export function getFirebaseAdminMessaging() {
  const config = getFirebaseAdminConfig();
  if (!config) return null;

  const app = getApps()[0] ?? initializeApp({
    credential: cert(config),
    projectId: config.projectId,
  });

  return getMessaging(app);
}
