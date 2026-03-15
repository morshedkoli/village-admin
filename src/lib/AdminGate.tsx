"use client";

import { useAuth } from "./AuthContext";
import { Loader2, ShieldAlert } from "lucide-react";

export function AdminGate({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading, signIn, signOut } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center animate-fade-in">
          <img src="/favicon.svg" alt="" className="w-12 h-12 rounded-xl mx-auto mb-4 animate-pulse" />
          <p className="text-text-secondary text-sm font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-scale-in bg-white rounded-2xl shadow-xl shadow-black/5 border border-border p-10 max-w-md w-full mx-4 text-center">
          <img src="/logo.svg" alt="Village Admin" className="w-16 h-16 rounded-2xl mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            Village Admin
          </h1>
          <p className="text-text-secondary text-sm mb-8 leading-relaxed">
            Sign in with your admin account to manage the village development platform.
          </p>
          <button
            onClick={signIn}
            className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-text-primary hover:bg-text-primary/90 text-white font-medium rounded-xl transition-all duration-200 shadow-lg shadow-black/10 hover:shadow-xl hover:shadow-black/15"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-scale-in bg-white rounded-2xl shadow-xl shadow-black/5 border border-border p-10 max-w-md w-full mx-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-danger-light flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="w-7 h-7 text-danger" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            Access Denied
          </h1>
          <p className="text-text-secondary text-sm mb-2 leading-relaxed">
            Your account does not have admin access.
          </p>
          <p className="text-xs text-text-muted mb-8 bg-background rounded-lg py-2 px-3 inline-block">
            {user.email}
          </p>
          <div>
            <button
              onClick={signOut}
              className="px-6 py-2.5 bg-background hover:bg-surface-hover text-text-primary font-medium rounded-xl border border-border transition-colors text-sm"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
