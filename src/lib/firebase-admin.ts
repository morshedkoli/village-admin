import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { firebaseProject } from "./firebase-config";

let adminApp: App;
const EXPECTED_PROJECT_ID = firebaseProject.projectId;

function getAdminApp(): App {
  if (getApps().length > 0) return getApps()[0];

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (serviceAccountJson) {
    const serviceAccount = JSON.parse(serviceAccountJson);
    if (
      serviceAccount.project_id &&
      serviceAccount.project_id !== EXPECTED_PROJECT_ID
    ) {
      throw new Error(
        `FIREBASE_SERVICE_ACCOUNT_KEY project_id is "${serviceAccount.project_id}", but this app uses "${EXPECTED_PROJECT_ID}".`
      );
    }
    adminApp = initializeApp({ credential: cert(serviceAccount) });
  } else {
    // Falls back to Application Default Credentials (works on Firebase/GCP hosting)
    adminApp = initializeApp();
  }
  return adminApp;
}

export function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}

export function getAdminDb(): Firestore {
  return getFirestore(getAdminApp());
}
