"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { AuthProvider } from "@/lib/AuthContext";
import { AdminGate } from "@/lib/AdminGate";
import Sidebar from "./Sidebar";
import TopNav from "./TopNav";

export default function ClientShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const pathname = usePathname();

  if (pathname === "/") {
    return <AuthProvider>{children}</AuthProvider>;
  }

  return (
    <AuthProvider>
      <AdminGate>
        <div className="flex min-h-screen bg-background">
          <Sidebar
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
          <div className="flex-1 flex flex-col min-h-screen min-w-0">
            <TopNav
              onMenuToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            />
            <main className="flex-1 px-6 py-8 overflow-auto">
              <div className="max-w-[1280px] mx-auto">{children}</div>
            </main>
          </div>
        </div>
      </AdminGate>
    </AuthProvider>
  );
}
