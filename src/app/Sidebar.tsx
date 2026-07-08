"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Wallet,
  FolderKanban,
  AlertTriangle,
  Receipt,
  HandCoins,
  Users,
  Megaphone,
  FileBarChart,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  CreditCard,
} from "lucide-react";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Village Fund", href: "/fund", icon: Wallet },
  { name: "Projects", href: "/projects", icon: FolderKanban },
  { name: "Problems", href: "/problems", icon: AlertTriangle },
  { name: "Expenses", href: "/expenses", icon: Receipt },
  { name: "Donations", href: "/donations", icon: HandCoins },
  { name: "Donation Accounts", href: "/donation-accounts", icon: CreditCard },
  { name: "Citizens", href: "/users", icon: Users },
  { name: "Notifications", href: "/notifications", icon: Megaphone },
  { name: "Reports", href: "/reports", icon: FileBarChart },
  { name: "Settings", href: "/settings", icon: Settings },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  return (
    <>
      {/* Mobile overlay */}
      {!collapsed && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden"
          onClick={onToggle}
        />
      )}
      <aside
        className={cn(
          "fixed lg:sticky top-0 left-0 z-40 h-screen bg-white border-r border-border flex flex-col transition-all duration-200 ease-out",
          collapsed ? "w-[68px] -translate-x-full lg:translate-x-0" : "w-[244px] translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="h-14 flex items-center px-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <img src="/favicon.svg" alt="Village Admin" className="w-7 h-7 shrink-0" />
            {!collapsed && (
              <span className="text-[15px] font-semibold text-text-primary whitespace-nowrap tracking-tight">
                Village Admin
              </span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                title={collapsed ? item.name : undefined}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-[13px] font-medium transition-colors",
                  isActive
                    ? "bg-surface-hover text-text-primary"
                    : "text-text-secondary hover:bg-surface-hover/60 hover:text-text-primary"
                )}
              >
                <Icon
                  className={cn(
                    "w-[17px] h-[17px] shrink-0",
                    isActive ? "text-primary" : "text-text-muted"
                  )}
                />
                {!collapsed && <span className="truncate">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User profile & collapse toggle */}
        <div className="border-t border-border p-2 space-y-1 shrink-0">
          {user && !collapsed && (
            <div className="flex items-center gap-2.5 px-2 py-2">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt=""
                  className="w-7 h-7 rounded-full shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-surface-hover text-text-primary flex items-center justify-center text-xs font-semibold shrink-0">
                  {user.displayName?.charAt(0) || "A"}
                </div>
              )}
              <div className="truncate">
                <p className="text-[13px] font-medium text-text-primary truncate leading-tight">
                  {user.displayName}
                </p>
                <p className="text-[11px] text-text-muted truncate leading-tight">{user.email}</p>
              </div>
            </div>
          )}

          <button
            onClick={signOut}
            title="Sign Out"
            className={cn(
              "flex items-center gap-3 w-full px-3 py-2 rounded-md text-[13px] font-medium text-text-secondary hover:bg-danger-light hover:text-danger transition-colors",
              collapsed && "justify-center"
            )}
          >
            <LogOut className="w-[17px] h-[17px] shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>

          <button
            onClick={onToggle}
            className="hidden lg:flex items-center justify-center w-full py-1.5 rounded-md text-text-muted hover:bg-surface-hover hover:text-text-secondary transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
