"use client";

import { Bell, Search, Menu } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useNotifications, useVillageOverview } from "@/lib/hooks";

export default function TopNav({ onMenuToggle }: { onMenuToggle: () => void }) {
  const { user } = useAuth();
  const { data: notifications } = useNotifications();
  const { data: overview } = useVillageOverview();
  const unreadCount = notifications.length;

  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-border h-16 flex items-center px-6 gap-4">
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-2 rounded-xl hover:bg-surface-hover transition-colors"
      >
        <Menu className="w-5 h-5 text-text-secondary" />
      </button>

      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-2 bg-background rounded-xl border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {overview && (
          <span className="hidden md:block text-xs font-medium text-text-secondary bg-primary-light text-primary px-3 py-1.5 rounded-lg">
            {overview.name}
          </span>
        )}

        <button className="relative p-2 rounded-xl hover:bg-surface-hover transition-colors">
          <Bell className="w-5 h-5 text-text-secondary" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {user && (
          <div className="flex items-center gap-2.5 pl-3 border-l border-border">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt=""
                className="w-8 h-8 rounded-full ring-2 ring-primary/10"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-semibold">
                {user.displayName?.charAt(0) || "A"}
              </div>
            )}
            <div className="hidden md:block">
              <p className="text-sm font-medium text-text-primary leading-tight">
                {user.displayName}
              </p>
              <p className="text-xs text-text-muted leading-tight">Admin</p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
