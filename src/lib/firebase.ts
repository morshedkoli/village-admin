import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAyFEl4iwLL9m7eBcKsRIuH-eEQT93Mn6s",
  authDomain: "village-1727b.firebaseapp.com",
  projectId: "village-1727b",
  storageBucket: "village-1727b.firebasestorage.app",
  messagingSenderId: "672769898353",
  appId: "1:672769898353:web:985e756ddcdd65c05b28d0",
};

const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
