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

const PIE_COLORS = ["#F39C12", "#4A90E2", "#2ECC71"];

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
    const counts: Record<string, number> = { Planning: 0, "In Progress": 0, Completed: 0 };
    for (const p of projects) counts[p.status] = (counts[p.status] ?? 0) + 1;
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value }));
  }, [projects]);

  if (l1 || l2 || l3 || l4 || l5 || l6) return <LoadingSkeleton />;

  const activeProjects = projects.filter((p) => p.status !== "Completed").length;
  const pendingProblems = problems.filter((p) => p.status === "Pending").length;
  const recentDonations = donations
    .filter((d) => d.status === "Approved")
    .slice(0, 6);
  const pendingDonationCount = donations.filter((d) => d.status === "Pending").length;
  const recentNotifications = notifications.slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-sm text-text-secondary mt-1">
          Overview of your village operations
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Monthly Donations"
          description="Donation trend over recent months"
          className="animate-fade-in"
        >
          {monthlyDonations.length === 0 ? (
            <div className="h-[250px] flex items-center justify-center text-sm text-text-muted">
              No donation data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyDonations}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" fontSize={12} tick={{ fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <YAxis fontSize={12} tick={{ fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(value) => [formatBDT(Number(value)), "Amount"]}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #E5E7EB",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
                    fontSize: "13px",
                  }}
                />
                <Bar dataKey="amount" fill="#1F7A5A" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard
          title="Project Status"
          description="Distribution of project statuses"
          className="animate-fade-in"
        >
          {projectStatusData.length === 0 ? (
            <div className="h-[250px] flex items-center justify-center text-sm text-text-muted">
              No project data yet
            </div>
          ) : (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="60%" height={250}>
                <PieChart>
                  <Pie
                    data={projectStatusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    strokeWidth={0}
                  >
                    {projectStatusData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #E5E7EB",
                      fontSize: "13px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-3">
                {projectStatusData.map((item, i) => (
                  <div key={item.name} className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                    />
                    <span className="text-sm text-text-secondary flex-1">{item.name}</span>
                    <span className="text-sm font-semibold text-text-primary">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ChartCard>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-border p-6 animate-fade-in">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-text-primary">
              Recent Donations
              {pendingDonationCount > 0 && (
                <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-warning-light text-warning">
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
            <p className="text-sm text-text-muted py-8 text-center">No donations yet</p>
          ) : (
            <div className="space-y-3">
              {recentDonations.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between py-2 border-b border-border-light last:border-none"
                >
                  <div>
                    <p className="text-sm font-medium text-text-primary">{d.donorName}</p>
                    <p className="text-xs text-text-muted">
                      {d.paymentMethod} &middot; {relativeTime(d.createdAt)}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-success">
                    +{formatBDT(d.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-border p-6 animate-fade-in">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-text-primary">Recent Activity</h3>
            <a
              href="/notifications"
              className="text-xs font-medium text-primary hover:text-primary-dark transition-colors flex items-center gap-1"
            >
              View all <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>
          {recentNotifications.length === 0 ? (
            <p className="text-sm text-text-muted py-8 text-center">No recent activity</p>
          ) : (
            <div className="space-y-3">
              {recentNotifications.map((n) => (
                <div
                  key={n.id}
                  className="flex items-start gap-3 py-2 border-b border-border-light last:border-none"
                >
                  <StatusBadge status={n.type} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-text-primary">{n.title}</p>
                    <p className="text-xs text-text-muted truncate">{n.body}</p>
                  </div>
                  <span className="text-xs text-text-muted whitespace-nowrap">
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
