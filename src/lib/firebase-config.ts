export const firebaseProject = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ??
    "AIzaSyD9hsXP943y2cMG3ss2gUkCtXs4IXhR8Bo",
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ??
    "village-1a6d9.firebaseapp.com",
  projectId:
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "village-1a6d9",
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ??
    "village-1a6d9.firebasestorage.app",
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "1064035305311",
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ??
    "1:1064035305311:web:94b23aa6da6be03a63d8ea",
};
