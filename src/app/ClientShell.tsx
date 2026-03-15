"use client";

import { useState } from "react";
import { AuthProvider } from "@/lib/AuthContext";
import { AdminGate } from "@/lib/AdminGate";
import Sidebar from "./Sidebar";
import TopNav from "./TopNav";

export default function ClientShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <AuthProvider>
      <AdminGate>
        <div className="flex min-h-screen bg-background">
          <Sidebar
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
          <div className="flex-1 flex flex-col min-h-screen">
            <TopNav
              onMenuToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            />
            <main className="flex-1 p-6 overflow-auto">
              <div className="max-w-[1400px] mx-auto">{children}</div>
            </main>
          </div>
        </div>
      </AdminGate>
    </AuthProvider>
  );
}
