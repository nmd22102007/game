/**
 * Unified Firebase Authentication & Zero-Trust Firestore Module
 * Implements lazy client initialize-starts, connection validator probes,
 * and standard formatting-compliant Firestore error handlers.
 */

import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';
import firebaseConfig from '../../firebase-applet-config.json';

// Safe environment loading
const metaEnv = (import.meta as any).env || {};
const finalConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || 
          metaEnv.NEXT_PUBLIC_FIREBASE_API_KEY || 
          (typeof process !== 'undefined' ? process.env?.NEXT_PUBLIC_FIREBASE_API_KEY : '') || 
          firebaseConfig.apiKey,
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || 
              metaEnv.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 
              (typeof process !== 'undefined' ? process.env?.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN : '') || 
              firebaseConfig.authDomain,
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || 
             metaEnv.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 
             (typeof process !== 'undefined' ? process.env?.NEXT_PUBLIC_FIREBASE_PROJECT_ID : '') || 
             firebaseConfig.projectId,
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || 
                 metaEnv.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 
                 (typeof process !== 'undefined' ? process.env?.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET : '') || 
                 firebaseConfig.storageBucket,
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || 
                     metaEnv.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || 
                     (typeof process !== 'undefined' ? process.env?.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID : '') || 
                     firebaseConfig.messagingSenderId,
  appId: metaEnv.VITE_FIREBASE_APP_ID || 
         metaEnv.NEXT_PUBLIC_FIREBASE_APP_ID || 
         (typeof process !== 'undefined' ? process.env?.NEXT_PUBLIC_FIREBASE_APP_ID : '') || 
         firebaseConfig.appId,
  measurementId: metaEnv.VITE_FIREBASE_MEASUREMENT_ID || 
                 metaEnv.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || 
                 (typeof process !== 'undefined' ? process.env?.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID : '') || 
                 (firebaseConfig as any).measurementId || '',
};

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(finalConfig) : getApp();

// Resolve active Firestore database instance
const isSandbox = finalConfig.projectId === firebaseConfig.projectId;
const dbId = isSandbox 
  ? firebaseConfig.firestoreDatabaseId 
  : (metaEnv.VITE_FIREBASE_DATABASE_ID || 
     metaEnv.NEXT_PUBLIC_FIREBASE_DATABASE_ID || 
     (typeof process !== 'undefined' ? process.env?.NEXT_PUBLIC_FIREBASE_DATABASE_ID : '') || 
     '(default)');

export const db = getFirestore(app, dbId); /* CRITICAL: The app will break without this line */
export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

// Safe Analytics Initialization
export let analytics: any = null;
isSupported().then((supported) => {
  if (supported) {
    try {
      analytics = getAnalytics(app);
    } catch (e) {
      console.warn("Analytics initialization failed (likely sandbox domain restrictions):", e);
    }
  }
}).catch(() => {});

// Operational Types matching Firestore Spec
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

/**
 * Handle and convert errors conforming strictly to the FirestoreErrorInfo standard schema.
 */
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error Payload: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Validates connection to firestore on boot as required by rules
 */
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration: Client is offline.");
    }
  }
}

testConnection();
