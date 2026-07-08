"use client";

import React, { useMemo, useEffect } from "react";
import {
  useVillageOverview,
  useDonations,
  useProjects,
  useProblems,
  useUsers,
  useNotifications,
} from "@/lib/hooks";
import { syncCitizenCount } from "@/lib/firestore-service";
import { availableBalance } from "@/lib/models";
import { formatBDT, relativeTime } from "@/lib/utils";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { DashboardCard } from "@/components/DashboardCard";
import { ChartCard } from "@/components/ChartCard";
import { StatusBadge } from "@/components/StatusBadge";
import {
  Wallet,
  TrendingDown,
  Scale,
  FolderKanban,
  AlertTriangle,
  Users,
  ArrowUpRight,
  Smartphone,
  Download,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// Project status palette — muted, accessible.
const PIE_COLORS = ["#94a3b8", "#3b82f6", "#16a34a"];

const tooltipStyle = {
  borderRadius: "8px",
  border: "1px solid #e4e4e7",
  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
  fontSize: "12px",
  padding: "8px 12px",
};

export default function Dashboard() {
  const { data: overview, loading: l1 } = useVillageOverview();
  const { data: projects, loading: l2 } = useProjects();
  const { data: problems, loading: l3 } = useProblems();
  const { data: notifications, loading: l4 } = useNotifications();
  const { data: donations, loading: l5 } = useDonations();
  const { data: users, loading: l6 } = useUsers();

  // Keep totalCitizens in sync with actual user count.
  useEffect(() => {
    if (!l6) syncCitizenCount().catch(() => {});
  }, [l6, users.length]);

  const monthlyDonations = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of donations.filter((d) => d.status === "Approved")) {
      const key = `${d.createdAt.getFullYear()}-${String(
        d.createdAt.getMonth() + 1
      ).padStart(2, "0")}`;
      map.set(key, (map.get(key) ?? 0) + d.amount);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, amount]) => ({
        month: new Date(month + "-01").toLocaleDateString("en-US", {
          month: "short",
        }),
        amount,
      }));
  }, [donations]);

  const projectStatusData = useMemo(() => {
    const counts: Record<string, number> = {
      Planning: 0,
      "In Progress": 0,
      Completed: 0,
    };
    for (const p of projects) counts[p.status] = (counts[p.status] ?? 0) + 1;
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value }));
  }, [projects]);

  if (l1 || l2 || l3 || l4 || l5 || l6) return <LoadingSkeleton />;

  const activeProjects = projects.filter(
    (p) => p.status !== "Completed"
  ).length;
  const pendingProblems = problems.filter((p) => p.status === "Pending").length;
  const recentDonations = donations
    .filter((d) => d.status === "Approved")
    .slice(0, 6);
  const pendingDonationCount = donations.filter(
    (d) => d.status === "Pending"
  ).length;
  const recentNotifications = notifications.slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[26px] font-semibold text-text-primary tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Overview of your village operations
          </p>
        </div>
        <a
          href="/apps/al_islah_v2.apk"
          download
          className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-primary text-white hover:bg-primary-dark text-xs font-semibold rounded-xl transition-all shadow-sm shadow-primary/10 hover:shadow-md"
        >
          <Download className="w-4 h-4" />
          Download Android App (APK)
        </a>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <DashboardCard
          title="Total Fund"
          value={formatBDT(overview?.totalFundCollected ?? 0)}
          icon={Wallet}
          iconBg="bg-primary-light"
          iconColor="text-primary"
          className="animate-fade-in stagger-1"
        />
        <DashboardCard
          title="Total Expenses"
          value={formatBDT(overview?.totalSpent ?? 0)}
          icon={TrendingDown}
          iconBg="bg-danger-light"
          iconColor="text-danger"
          className="animate-fade-in stagger-2"
        />
        <DashboardCard
          title="Available Balance"
          value={overview ? formatBDT(availableBalance(overview)) : "৳0"}
          icon={Scale}
          iconBg="bg-success-light"
          iconColor="text-success"
          className="animate-fade-in stagger-3"
        />
        <DashboardCard
          title="Active Projects"
          value={activeProjects.toString()}
          icon={FolderKanban}
          iconBg="bg-secondary-light"
          iconColor="text-secondary"
          className="animate-fade-in stagger-4"
        />
        <DashboardCard
          title="Reported Problems"
          value={pendingProblems.toString()}
          icon={AlertTriangle}
          iconBg="bg-warning-light"
          iconColor="text-warning"
          className="animate-fade-in stagger-5"
        />
        <DashboardCard
          title="Total Citizens"
          value={(users?.length ?? overview?.totalCitizens ?? 0).toString()}
          icon={Users}
          iconBg="bg-info-light"
          iconColor="text-info"
          className="animate-fade-in stagger-6"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard
          title="Monthly Donations"
          description="Approved donation trend over recent months"
          className="animate-fade-in"
        >
          {monthlyDonations.length === 0 ? (
            <div className="h-[240px] flex items-center justify-center text-sm text-text-muted">
              No donation data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthlyDonations} barCategoryGap={20}>
                <CartesianGrid
                  strokeDasharray="2 4"
                  stroke="#f4f4f5"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  fontSize={11}
                  tick={{ fill: "#a1a1aa" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  fontSize={11}
                  tick={{ fill: "#a1a1aa" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value) => [formatBDT(Number(value)), "Amount"]}
                  cursor={{ fill: "#f4f4f5" }}
                  contentStyle={tooltipStyle}
                />
                <Bar dataKey="amount" fill="#15803d" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard
          title="Project Status"
          description="Distribution by stage"
          className="animate-fade-in"
        >
          {projectStatusData.length === 0 ? (
            <div className="h-[240px] flex items-center justify-center text-sm text-text-muted">
              No project data yet
            </div>
          ) : (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="55%" height={240}>
                <PieChart>
                  <Pie
                    data={projectStatusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}
                    strokeWidth={0}
                  >
                    {projectStatusData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2.5">
                {projectStatusData.map((item, i) => (
                  <div key={item.name} className="flex items-center gap-3">
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{
                        backgroundColor: PIE_COLORS[i % PIE_COLORS.length],
                      }}
                    />
                    <span className="text-[13px] text-text-secondary flex-1">
                      {item.name}
                    </span>
                    <span className="text-sm font-semibold text-text-primary tabular-nums">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ChartCard>
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-border p-6 animate-fade-in">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-[15px] font-semibold text-text-primary tracking-tight">
              Recent Donations
              {pendingDonationCount > 0 && (
                <span className="ml-2 inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-warning-light text-warning">
                  {pendingDonationCount} pending
                </span>
              )}
            </h3>
            <a
              href="/donations"
              className="text-xs font-medium text-primary hover:text-primary-dark transition-colors flex items-center gap-1"
            >
              View all <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>
          {recentDonations.length === 0 ? (
            <p className="text-sm text-text-muted py-8 text-center">
              No donations yet
            </p>
          ) : (
            <div className="divide-y divide-border-light">
              {recentDonations.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {d.donorName}
                    </p>
                    <p className="text-xs text-text-muted">
                      {d.paymentMethod} &middot; {relativeTime(d.createdAt)}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-success tabular-nums shrink-0 ml-3">
                    +{formatBDT(d.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-border p-6 animate-fade-in">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-[15px] font-semibold text-text-primary tracking-tight">
              Recent Activity
            </h3>
            <a
              href="/notifications"
              className="text-xs font-medium text-primary hover:text-primary-dark transition-colors flex items-center gap-1"
            >
              View all <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>
          {recentNotifications.length === 0 ? (
            <p className="text-sm text-text-muted py-8 text-center">
              No recent activity
            </p>
          ) : (
            <div className="divide-y divide-border-light">
              {recentNotifications.map((n) => (
                <div
                  key={n.id}
                  className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0"
                >
                  <StatusBadge status={n.type} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {n.title}
                    </p>
                    <p className="text-xs text-text-muted truncate">{n.body}</p>
                  </div>
                  <span className="text-[11px] text-text-muted whitespace-nowrap shrink-0">
                    {relativeTime(n.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
