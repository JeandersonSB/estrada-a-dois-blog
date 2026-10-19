import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
const config = {
  apiKey: process.env.NEXT_PUBLIC_BIKER_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_BIKER_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_BIKER_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_BIKER_FIREBASE_APP_ID,
};
export function services() {
  if (!config.apiKey || !config.authDomain || !config.projectId || !config.appId) return null;
  const app = getApps().length ? getApp() : initializeApp(config);
  return { auth: getAuth(app), db: getFirestore(app) };
}
