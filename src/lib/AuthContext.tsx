"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  User,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged,
  signOut as fbSignOut,
} from "firebase/auth";
import { auth } from "./firebase";
import {
  normalizeAdminEmail,
  isBootstrapAdminEmail,
} from "./admin-access";

interface AuthState {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  adminEmail: string;
  adminReason: string;
  authError: string;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  isAdmin: false,
  loading: true,
  adminEmail: "",
  adminReason: "",
  authError: "",
  signIn: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminReason, setAdminReason] = useState("");
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    // Handle redirect result (for when signInWithPopup fails and falls back to redirect)
    getRedirectResult(auth).catch((error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Google sign-in failed";
      setAuthError(message);
    });

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setAuthError("");

      if (firebaseUser) {
        try {
          await firebaseUser.reload();
          const refreshedUser = auth.currentUser ?? firebaseUser;
          const token = await refreshedUser.getIdToken(true);
          const tokenResult = await refreshedUser.getIdTokenResult();

          setUser(refreshedUser);

          const hasAdminClaim = tokenResult.claims.admin === true;
          const normalizedEmail = normalizeAdminEmail(
            typeof tokenResult.claims.email === "string"
              ? tokenResult.claims.email
              : refreshedUser.email ??
                  refreshedUser.providerData.find((entry) => entry.email)?.email
          );
          const isBootstrapAdmin = isBootstrapAdminEmail(normalizedEmail);

          setAdminEmail(normalizedEmail);

          let isListedAdmin = false;
          let apiReason = "";
          if (normalizedEmail && !hasAdminClaim && !isBootstrapAdmin) {
            try {
              const res = await fetch("/api/admins", {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });
              isListedAdmin = res.ok;
              if (!res.ok) {
                const data = (await res.json().catch(() => ({}))) as {
                  error?: string;
                };
                apiReason = data.error ?? "User is not in admin list";
              }
            } catch (error: unknown) {
              apiReason =
                error instanceof Error
                  ? error.message
                  : "Failed to verify admin access";
            }
          }

          const nextIsAdmin = hasAdminClaim || isBootstrapAdmin || isListedAdmin;
          setIsAdmin(nextIsAdmin);

          if (hasAdminClaim) {
            setAdminReason("Admin access granted by Firebase custom claim.");
          } else if (isBootstrapAdmin) {
            setAdminReason(
              `Admin access granted for bootstrap admin email: ${normalizedEmail}.`
            );
          } else if (isListedAdmin) {
            setAdminReason(
              `Admin access granted from Firestore admin list for ${normalizedEmail}.`
            );
          } else if (!normalizedEmail) {
            setAdminReason("Google sign-in succeeded, but no email was returned for this account.");
          } else {
            setAdminReason(apiReason || `Signed in as ${normalizedEmail}, but this account is not an admin.`);
          }
        } catch (error: unknown) {
          setUser(firebaseUser);
          setIsAdmin(false);
          setAdminEmail(normalizeAdminEmail(firebaseUser.email));
          setAdminReason("Failed to refresh Google sign-in session.");
          setAuthError(
            error instanceof Error ? error.message : "Failed to load auth state"
          );
        }
      } else {
        setUser(null);
        setIsAdmin(false);
        setAdminEmail("");
        setAdminReason("");
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signIn = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    try {
      await signInWithPopup(auth, provider);
    } catch (error: unknown) {
      const code = (error as { code?: string }).code;
      // If popup fails (blocked, closed, cross-origin issues), fall back to redirect
      if (
        code === "auth/popup-blocked" ||
        code === "auth/popup-closed-by-user" ||
        code === "auth/cancelled-popup-request" ||
        code === "auth/internal-error" ||
        code === "auth/web-storage-unsupported"
      ) {
        await signInWithRedirect(auth, provider);
        return;
      }

      setAuthError(
        error instanceof Error ? error.message : "Google sign-in failed"
      );
    }
  };

  const signOutFn = async () => {
    await fbSignOut(auth);
    setAdminEmail("");
    setAdminReason("");
    setAuthError("");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        loading,
        adminEmail,
        adminReason,
        authError,
        signIn,
        signOut: signOutFn,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
