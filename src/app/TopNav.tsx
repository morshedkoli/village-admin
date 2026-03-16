"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Search,
  Menu,
  HandCoins,
  AlertTriangle,
  Users,
  FolderKanban,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useUserNotifications, useVillageOverview } from "@/lib/hooks";
import { relativeTime } from "@/lib/utils";
import type { AppNotification } from "@/lib/models";

const typeConfig: Record<
  AppNotification["type"],
  { icon: typeof HandCoins; color: string; bg: string; route: string; label: string }
> = {
  donation: {
    icon: HandCoins,
    color: "text-success",
    bg: "bg-success-light",
    route: "/donations",
    label: "Donations",
  },
  problem: {
    icon: AlertTriangle,
    color: "text-warning",
    bg: "bg-warning-light",
    route: "/problems",
    label: "Problems",
  },
  citizen: {
    icon: Users,
    color: "text-info",
    bg: "bg-info-light",
    route: "/users",
    label: "Citizens",
  },
  project: {
    icon: FolderKanban,
    color: "text-secondary",
    bg: "bg-secondary-light",
    route: "/projects",
    label: "Projects",
  },
};

const READ_KEY = "notif_read_ids";

function getReadIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(READ_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function persistReadIds(ids: Set<string>) {
  localStorage.setItem(READ_KEY, JSON.stringify([...ids]));
}

export default function TopNav({ onMenuToggle }: { onMenuToggle: () => void }) {
  const { user } = useAuth();
  const { data: notifications } = useUserNotifications();
  const { data: overview } = useVillageOverview();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [readIds, setReadIds] = useState(getReadIds);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Only show unread notifications in the dropdown
  const unread = notifications.filter((n) => !readIds.has(n.id));
  const unreadCount = unread.length;

  // Clean up stale IDs that no longer exist
  useEffect(() => {
    const existingIds = new Set(notifications.map((n) => n.id));
    const cleaned = new Set([...readIds].filter((id) => existingIds.has(id)));
    if (cleaned.size !== readIds.size) {
      setReadIds(cleaned);
      persistReadIds(cleaned);
    }
  }, [notifications]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close panel on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        open &&
        panelRef.current &&
        buttonRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const markAsRead = (id: string) => {
    setReadIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      persistReadIds(next);
      return next;
    });
  };

  const handleNotificationClick = (n: AppNotification) => {
    markAsRead(n.id);
    const cfg = typeConfig[n.type];
    router.push(cfg.route);
    setOpen(false);
  };

  const handleDismiss = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    markAsRead(id);
  };

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

        {/* Notification Bell + Panel */}
        <div className="relative">
          <button
            ref={buttonRef}
            onClick={() => setOpen(!open)}
            className="relative p-2 rounded-xl hover:bg-surface-hover transition-colors"
          >
            <Bell className="w-5 h-5 text-text-secondary" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown Panel */}
          {open && (
            <div
              ref={panelRef}
              className="absolute right-0 top-full mt-2 w-[380px] max-h-[480px] bg-white rounded-2xl border border-border shadow-2xl flex flex-col animate-scale-in z-50"
            >
              {/* Header */}
              <div className="px-5 py-3.5 border-b border-border flex items-center justify-between shrink-0">
                <h3 className="text-sm font-semibold text-text-primary">
                  Notifications
                  {unreadCount > 0 && (
                    <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-danger-light text-danger">
                      {unreadCount}
                    </span>
                  )}
                </h3>
                <button
                  onClick={() => {
                    router.push("/notifications");
                    setOpen(false);
                  }}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  View All
                </button>
              </div>

              {/* List */}
              <div className="overflow-y-auto flex-1">
                {unread.length === 0 ? (
                  <div className="py-12 text-center">
                    <Bell className="w-8 h-8 text-text-muted mx-auto mb-2 opacity-40" />
                    <p className="text-sm text-text-muted">No new notifications</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border-light">
                    {unread.slice(0, 20).map((n) => {
                      const cfg = typeConfig[n.type] ?? typeConfig.donation;
                      const Icon = cfg.icon;
                      return (
                        <button
                          key={n.id}
                          onClick={() => handleNotificationClick(n)}
                          className="w-full flex items-start gap-3 px-5 py-3.5 hover:bg-surface-hover/60 transition-colors text-left group"
                        >
                          <div
                            className={`w-9 h-9 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0 mt-0.5`}
                          >
                            <Icon className={`w-4 h-4 ${cfg.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-text-primary truncate">
                                {n.title}
                              </p>
                              <ExternalLink className="w-3 h-3 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                            </div>
                            <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">
                              {n.body}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span
                                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.color}`}
                              >
                                {cfg.label}
                              </span>
                              <span className="text-[11px] text-text-muted">
                                {relativeTime(n.createdAt)}
                              </span>
                            </div>
                          </div>
                          <span
                            onClick={(e) => handleDismiss(e, n.id)}
                            className="text-base text-text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5 px-1 rounded hover:bg-danger-light cursor-pointer leading-none"
                            title="Dismiss"
                          >
                            &times;
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              {unread.length > 0 && (
                <div className="px-5 py-3 border-t border-border shrink-0">
                  <button
                    onClick={() => {
                      router.push("/notifications");
                      setOpen(false);
                    }}
                    className="w-full text-center text-xs font-medium text-primary hover:underline py-1"
                  >
                    Manage All Notifications
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

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
