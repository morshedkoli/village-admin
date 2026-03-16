"use client";

import React, { useState, useMemo } from "react";
import { useDonations } from "@/lib/hooks";
import {
  deleteDonation,
  approveDonation,
  rejectDonation,
} from "@/lib/firestore-service";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { ChartCard } from "@/components/ChartCard";
import { formatBDT, formatDate } from "@/lib/utils";
import { HandCoins, Trash2, CheckCircle, XCircle } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const paymentMethodStyles: Record<string, string> = {
  bKash: "bg-success-light text-success",
  Nagad: "bg-warning-light text-warning",
  Rocket: "bg-secondary-light text-secondary",
  Bank: "bg-info-light text-info",
  "Bank Transfer": "bg-info-light text-info",
  Cash: "bg-background text-text-secondary",
};

type FilterPeriod = "all" | "today" | "week" | "month";
type StatusFilter = "all" | "Pending" | "Approved" | "Rejected";

export default function DonationsPage() {
  const { data: donations, loading } = useDonations();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterPeriod>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const now = new Date();
    return donations.filter((d) => {
      if (statusFilter !== "all" && d.status !== statusFilter) return false;
      if (filter === "all") return true;
      const diff = now.getTime() - d.createdAt.getTime();
      if (filter === "today") return diff < 86400000;
      if (filter === "week") return diff < 604800000;
      if (filter === "month") return diff < 2592000000;
      return true;
    });
  }, [donations, filter, statusFilter]);

  const monthlyData = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of donations.filter((d) => d.status === "Approved")) {
      const key = `${d.createdAt.getFullYear()}-${String(
        d.createdAt.getMonth() + 1
      ).padStart(2, "0")}`;
      map.set(key, (map.get(key) ?? 0) + d.amount);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8)
      .map(([month, amount]) => ({
        month: new Date(month + "-01").toLocaleDateString("en-US", {
          month: "short",
          year: "2-digit",
        }),
        amount,
      }));
  }, [donations]);

  const pendingCount = donations.filter((d) => d.status === "Pending").length;

  if (loading) return <LoadingSkeleton />;

  const totalAmount = filtered.reduce((sum, d) => sum + d.amount, 0);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      await approveDonation(id);
    } catch (err) {
      console.error("Failed to approve donation:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    try {
      await rejectDonation(id);
    } catch (err) {
      console.error("Failed to reject donation:", err);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Donations
            {pendingCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-warning-light text-warning">
                {pendingCount} pending
              </span>
            )}
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            {filtered.length} donations &middot; Total: {formatBDT(totalAmount)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-background rounded-xl p-1">
            {(["all", "Pending", "Approved", "Rejected"] as StatusFilter[]).map(
              (s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors capitalize ${
                    statusFilter === s
                      ? "bg-white text-text-primary shadow-sm"
                      : "text-text-muted hover:text-text-secondary"
                  }`}
                >
                  {s === "all" ? "All Status" : s}
                </button>
              )
            )}
          </div>
          <div className="flex items-center gap-1 bg-background rounded-xl p-1">
            {(["all", "today", "week", "month"] as FilterPeriod[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors capitalize ${
                  filter === f
                    ? "bg-white text-text-primary shadow-sm"
                    : "text-text-muted hover:text-text-secondary"
                }`}
              >
                {f === "all"
                  ? "All"
                  : f === "week"
                    ? "This Week"
                    : f === "month"
                      ? "This Month"
                      : "Today"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {monthlyData.length > 0 && (
        <ChartCard
          title="Donation Trend"
          description="Monthly approved donation amounts"
          className="animate-fade-in"
        >
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="month"
                fontSize={12}
                tick={{ fill: "#9CA3AF" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                fontSize={12}
                tick={{ fill: "#9CA3AF" }}
                axisLine={false}
                tickLine={false}
              />
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
        </ChartCard>
      )}

      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            icon={HandCoins}
            title="No donations found"
            description={
              filter !== "all" || statusFilter !== "all"
                ? "Try a different filter."
                : "Donations will appear here once received."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-background/50">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Donor
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Transaction
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {filtered.map((donation) => {
                  const isLoading = actionLoading === donation.id;
                  return (
                    <tr
                      key={donation.id}
                      className="hover:bg-surface-hover/50 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-text-primary">
                          {donation.donorName}
                        </p>
                        {donation.senderNumber && (
                          <p className="text-xs text-text-muted mt-0.5">
                            {donation.senderNumber}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm font-semibold text-success">
                          {formatBDT(donation.amount)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
                            paymentMethodStyles[donation.paymentMethod] ??
                            "bg-background text-text-secondary"
                          }`}
                        >
                          {donation.paymentMethod}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-xs text-text-primary font-mono">
                          {donation.transactionId || "—"}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={donation.status} />
                      </td>
                      <td className="px-5 py-4 text-sm text-text-muted">
                        {formatDate(donation.createdAt)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-1">
                          {donation.status === "Pending" && (
                            <>
                              <button
                                onClick={() => handleApprove(donation.id)}
                                disabled={isLoading}
                                className="p-2 rounded-lg hover:bg-success-light text-text-muted hover:text-success transition-colors disabled:opacity-50"
                                title="Approve"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleReject(donation.id)}
                                disabled={isLoading}
                                className="p-2 rounded-lg hover:bg-warning-light text-text-muted hover:text-warning transition-colors disabled:opacity-50"
                                title="Reject"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => setDeleteId(donation.id)}
                            className="p-2 rounded-lg hover:bg-danger-light text-text-muted hover:text-danger transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleteId !== null}
        title="Delete Donation"
        message="Are you sure you want to delete this donation? This action cannot be undone."
        onConfirm={async () => {
          if (deleteId) await deleteDonation(deleteId);
          setDeleteId(null);
        }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
