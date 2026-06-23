import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// USE THIS EXACT CONFIGURATION AS REQUESTED
const firebaseConfig = {
  apiKey: "AIzaSyDUdnBQdbaOSnfNPiuaFzWoLndlaq5VLx4",
  authDomain: "restaurant22-d6f98.firebaseapp.com",
  projectId: "restaurant22-d6f98",
  storageBucket: "restaurant22-d6f98.firebasestorage.app",
  messagingSenderId: "79383524147",
  appId: "1:79383524147:web:2f765a6e280ba39d89c446",
  measurementId: "G-DYVT19CSF1"
};

// Initialize Firebase app once
export const app = initializeApp(firebaseConfig);

// Initialize analytics safely
let analyticsInstance = null;
if (typeof window !== "undefined") {
  try {
    analyticsInstance = getAnalytics(app);
  } catch (e) {
    console.warn("Analytics initialization failed or is blocked in this environment:", e);
  }
}
export const analytics = analyticsInstance;

// Auth and Firestore instances derived from the same app instance
export const auth = getAuth(app);
export const db = getFirestore(app);

// MANDATORY FIRESTORE ERROR HANDLING PROTOCOL
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
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
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
  console.error('Firestore Error Details: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
