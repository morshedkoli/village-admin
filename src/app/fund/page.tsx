"use client";

import React, { useMemo } from "react";
import {
  useVillageOverview,
  useDonations,
  useProjects,
} from "@/lib/hooks";
import { availableBalance } from "@/lib/models";
import { formatBDT } from "@/lib/utils";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { ChartCard } from "@/components/ChartCard";
import { DashboardCard } from "@/components/DashboardCard";
import {
  Wallet,
  TrendingDown,
  Scale,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function FundPage() {
  const { data: overview, loading: l1 } = useVillageOverview();
  const { data: donations, loading: l2 } = useDonations();
  const { data: projects, loading: l3 } = useProjects();

  const monthlyFlow = useMemo(() => {
    const map = new Map<string, { income: number; expense: number }>();

    for (const d of donations.filter((d) => d.status === "Approved")) {
      const key = `${d.createdAt.getFullYear()}-${String(
        d.createdAt.getMonth() + 1
      ).padStart(2, "0")}`;
      const entry = map.get(key) ?? { income: 0, expense: 0 };
      entry.income += d.amount;
      map.set(key, entry);
    }

    for (const p of projects) {
      if (p.createdAt) {
        const key = `${p.createdAt.getFullYear()}-${String(
          p.createdAt.getMonth() + 1
        ).padStart(2, "0")}`;
        const entry = map.get(key) ?? { income: 0, expense: 0 };
        entry.expense += p.allocatedFunds;
        map.set(key, entry);
      }
    }

    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8)
      .map(([month, data]) => ({
        month: new Date(month + "-01").toLocaleDateString("en-US", {
          month: "short",
        }),
        ...data,
      }));
  }, [donations, projects]);

  if (l1 || l2 || l3) return <LoadingSkeleton />;

  const totalDonations = donations.reduce((s, d) => s + d.amount, 0);
  const totalAllocated = projects.reduce((s, p) => s + p.allocatedFunds, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Village Fund</h1>
        <p className="text-sm text-text-secondary mt-1">
          Financial overview and fund management
        </p>
      </div>

      {/* Fund Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard
          title="Total Fund Collected"
          value={formatBDT(overview?.totalFundCollected ?? 0)}
          icon={Wallet}
          iconBg="bg-primary-light"
          iconColor="text-primary"
          className="animate-fade-in stagger-1"
        />
        <DashboardCard
          title="Total Spent"
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
          title="Allocated to Projects"
          value={formatBDT(totalAllocated)}
          icon={TrendingUp}
          iconBg="bg-secondary-light"
          iconColor="text-secondary"
          className="animate-fade-in stagger-4"
        />
      </div>

      {/* Fund Flow Chart */}
      <ChartCard
        title="Fund Flow"
        description="Monthly income vs expenditure"
        className="animate-fade-in"
      >
        {monthlyFlow.length === 0 ? (
          <div className="h-[280px] flex items-center justify-center text-sm text-text-muted">
            No financial data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={monthlyFlow}>
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1F7A5A" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#1F7A5A" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E74C3C" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#E74C3C" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" fontSize={12} tick={{ fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <YAxis fontSize={12} tick={{ fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(value, name) => [
                  formatBDT(Number(value)),
                  name === "income" ? "Income" : "Expense",
                ]}
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #E5E7EB",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
                  fontSize: "13px",
                }}
              />
              <Area
                type="monotone"
                dataKey="income"
                stroke="#1F7A5A"
                strokeWidth={2}
                fill="url(#incomeGrad)"
              />
              <Area
                type="monotone"
                dataKey="expense"
                stroke="#E74C3C"
                strokeWidth={2}
                fill="url(#expenseGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-border p-6">
          <h3 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
            <ArrowUpRight className="w-4 h-4 text-success" />
            Recent Income
          </h3>
          <div className="space-y-3">
            {donations.filter((d) => d.status === "Approved").slice(0, 5).map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between py-2 border-b border-border-light last:border-none"
              >
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {d.donorName}
                  </p>
                  <p className="text-xs text-text-muted">{d.paymentMethod}</p>
                </div>
                <span className="text-sm font-semibold text-success">
                  +{formatBDT(d.amount)}
                </span>
              </div>
            ))}
            {donations.length === 0 && (
              <p className="text-sm text-text-muted text-center py-4">
                No income recorded
              </p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border p-6">
          <h3 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
            <ArrowDownRight className="w-4 h-4 text-danger" />
            Project Allocations
          </h3>
          <div className="space-y-3">
            {projects.slice(0, 5).map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between py-2 border-b border-border-light last:border-none"
              >
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {p.title}
                  </p>
                  <p className="text-xs text-text-muted">{p.status}</p>
                </div>
                <span className="text-sm font-semibold text-danger">
                  -{formatBDT(p.allocatedFunds)}
                </span>
              </div>
            ))}
            {projects.length === 0 && (
              <p className="text-sm text-text-muted text-center py-4">
                No allocations yet
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
