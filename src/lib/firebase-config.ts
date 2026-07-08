export const firebaseProject = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "mock-api-key-for-build",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "mock-auth-domain-for-build",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "village-1a6d9",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "mock-storage-bucket-for-build",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "mock-messaging-sender-id-for-build",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "mock-app-id-for-build",
};
