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
import { sendPushNotification } from "@/lib/onesignal";
import {
  HandCoins,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  CircleDollarSign,
  Ban,
  CheckCheck,
} from "lucide-react";
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
  const [approveId, setApproveId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterPeriod>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkApproveOpen, setBulkApproveOpen] = useState(false);

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

  const pendingDonations = donations.filter((d) => d.status === "Pending");
  const pendingCount = pendingDonations.length;
  const pendingAmount = pendingDonations.reduce((s, d) => s + d.amount, 0);
  const approvedCount = donations.filter((d) => d.status === "Approved").length;
  const approvedAmount = donations
    .filter((d) => d.status === "Approved")
    .reduce((s, d) => s + d.amount, 0);
  const rejectedCount = donations.filter((d) => d.status === "Rejected").length;

  if (loading) return <LoadingSkeleton />;

  const totalAmount = filtered.reduce((sum, d) => sum + d.amount, 0);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      const donation = donations.find((d) => d.id === id);
      await approveDonation(id);
      if (donation) {
        await sendPushNotification({
          title: "নতুন অনুদান",
          body: `${donation.donorName} ৳${donation.amount} অনুদান দিয়েছেন`,
          type: "donation",
        });
      }
    } catch (err) {
      console.error("Failed to approve donation:", err);
    } finally {
      setActionLoading(null);
      setApproveId(null);
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
      setRejectId(null);
    }
  };

  const handleBulkApprove = async () => {
    const toApprove = pendingDonations.filter((d) => selectedIds.has(d.id));
    for (const donation of toApprove) {
      try {
        await approveDonation(donation.id);
      } catch (err) {
        console.error("Failed to approve donation:", donation.id, err);
      }
    }
    if (toApprove.length > 0) {
      await sendPushNotification({
        title: "নতুন অনুদান",
        body: `${toApprove.length}টি অনুদান অনুমোদিত হয়েছে — মোট ৳${toApprove.reduce((s, d) => s + d.amount, 0)}`,
        type: "donation",
      });
    }
    setSelectedIds(new Set());
    setBulkApproveOpen(false);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const pendingIds = pendingDonations.map((d) => d.id);
    if (pendingIds.every((id) => selectedIds.has(id))) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingIds));
    }
  };

  const allPendingSelected =
    pendingDonations.length > 0 &&
    pendingDonations.every((d) => selectedIds.has(d.id));

  const selectedAmount = pendingDonations
    .filter((d) => selectedIds.has(d.id))
    .reduce((s, d) => s + d.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
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
        <div className="flex items-center gap-2 flex-wrap">
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

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-border p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-warning-light flex items-center justify-center">
            <Clock className="w-5 h-5 text-warning" />
          </div>
          <div>
            <p className="text-xs font-medium text-text-muted uppercase tracking-wider">
              Pending
            </p>
            <p className="text-lg font-bold text-text-primary">
              {pendingCount}
            </p>
            <p className="text-xs text-warning font-medium">
              {formatBDT(pendingAmount)}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-border p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-success-light flex items-center justify-center">
            <CircleDollarSign className="w-5 h-5 text-success" />
          </div>
          <div>
            <p className="text-xs font-medium text-text-muted uppercase tracking-wider">
              Approved
            </p>
            <p className="text-lg font-bold text-text-primary">
              {approvedCount}
            </p>
            <p className="text-xs text-success font-medium">
              {formatBDT(approvedAmount)}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-border p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-danger-light flex items-center justify-center">
            <Ban className="w-5 h-5 text-danger" />
          </div>
          <div>
            <p className="text-xs font-medium text-text-muted uppercase tracking-wider">
              Rejected
            </p>
            <p className="text-lg font-bold text-text-primary">
              {rejectedCount}
            </p>
          </div>
        </div>
      </div>

      {/* Pending Donations Section */}
      {pendingCount > 0 && statusFilter === "all" && (
        <div className="bg-white rounded-2xl border-2 border-warning/30 overflow-hidden animate-fade-in">
          <div className="px-5 py-4 bg-warning-light/50 border-b border-warning/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-warning" />
              <div>
                <h3 className="text-sm font-semibold text-text-primary">
                  Pending Approval ({pendingCount})
                </h3>
                <p className="text-xs text-text-muted">
                  Total: {formatBDT(pendingAmount)} — Review and approve or
                  reject donations
                </p>
              </div>
            </div>
            {selectedIds.size > 0 && (
              <button
                onClick={() => setBulkApproveOpen(true)}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-success text-white hover:bg-success/90 transition-colors"
              >
                <CheckCheck className="w-4 h-4" />
                Approve Selected ({selectedIds.size}) &middot;{" "}
                {formatBDT(selectedAmount)}
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-background/50">
                  <th className="px-5 py-3 text-left w-10">
                    <input
                      type="checkbox"
                      checked={allPendingSelected}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-border-light text-success focus:ring-success/30 cursor-pointer accent-[#1F7A5A]"
                    />
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Donor
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Transaction
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {pendingDonations.map((donation) => {
                  const isLoading = actionLoading === donation.id;
                  return (
                    <tr
                      key={donation.id}
                      className={`transition-colors ${
                        selectedIds.has(donation.id)
                          ? "bg-success-light/30"
                          : "hover:bg-surface-hover/50"
                      }`}
                    >
                      <td className="px-5 py-3.5">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(donation.id)}
                          onChange={() => toggleSelect(donation.id)}
                          className="w-4 h-4 rounded border-border-light text-success focus:ring-success/30 cursor-pointer accent-[#1F7A5A]"
                        />
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-medium text-text-primary">
                          {donation.donorName}
                        </p>
                        {donation.senderNumber && (
                          <p className="text-xs text-text-muted mt-0.5">
                            {donation.senderNumber}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-semibold text-warning">
                          {formatBDT(donation.amount)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
                            paymentMethodStyles[donation.paymentMethod] ??
                            "bg-background text-text-secondary"
                          }`}
                        >
                          {donation.paymentMethod}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-xs text-text-primary font-mono">
                          {donation.transactionId || "—"}
                        </p>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-text-muted">
                        {formatDate(donation.createdAt)}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => setApproveId(donation.id)}
                            disabled={isLoading}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-success-light text-success hover:bg-success hover:text-white text-xs font-semibold transition-colors disabled:opacity-50"
                            title="Approve"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Approve
                          </button>
                          <button
                            onClick={() => setRejectId(donation.id)}
                            disabled={isLoading}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-danger-light text-danger hover:bg-danger hover:text-white text-xs font-semibold transition-colors disabled:opacity-50"
                            title="Reject"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Monthly Chart */}
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

      {/* All Donations Table */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-text-primary">
            All Donations
          </h3>
        </div>
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
                        <span
                          className={`text-sm font-semibold ${
                            donation.status === "Approved"
                              ? "text-success"
                              : donation.status === "Pending"
                                ? "text-warning"
                                : "text-text-muted"
                          }`}
                        >
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
                                onClick={() => setApproveId(donation.id)}
                                disabled={isLoading}
                                className="p-2 rounded-lg hover:bg-success-light text-text-muted hover:text-success transition-colors disabled:opacity-50"
                                title="Approve"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setRejectId(donation.id)}
                                disabled={isLoading}
                                className="p-2 rounded-lg hover:bg-danger-light text-text-muted hover:text-danger transition-colors disabled:opacity-50"
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

      {/* Approve Confirmation */}
      <ConfirmDialog
        open={approveId !== null}
        title="Approve Donation"
        message={`Are you sure you want to approve this donation? This will add ${formatBDT(
          donations.find((d) => d.id === approveId)?.amount ?? 0
        )} from "${
          donations.find((d) => d.id === approveId)?.donorName ?? ""
        }" to the village fund.`}
        variant="warning"
        confirmLabel="Approve"
        loadingLabel="Approving..."
        onConfirm={async () => {
          if (approveId) await handleApprove(approveId);
        }}
        onCancel={() => setApproveId(null)}
      />

      {/* Reject Confirmation */}
      <ConfirmDialog
        open={rejectId !== null}
        title="Reject Donation"
        message={`Are you sure you want to reject the donation of ${formatBDT(
          donations.find((d) => d.id === rejectId)?.amount ?? 0
        )} from "${
          donations.find((d) => d.id === rejectId)?.donorName ?? ""
        }"? This donation will be marked as rejected.`}
        variant="danger"
        confirmLabel="Reject"
        loadingLabel="Rejecting..."
        onConfirm={async () => {
          if (rejectId) await handleReject(rejectId);
        }}
        onCancel={() => setRejectId(null)}
      />

      {/* Bulk Approve Confirmation */}
      <ConfirmDialog
        open={bulkApproveOpen}
        title="Bulk Approve Donations"
        message={`Are you sure you want to approve ${selectedIds.size} donation(s) totaling ${formatBDT(selectedAmount)}? This will add the full amount to the village fund.`}
        variant="warning"
        confirmLabel={`Approve ${selectedIds.size} Donations`}
        loadingLabel="Approving..."
        onConfirm={handleBulkApprove}
        onCancel={() => setBulkApproveOpen(false)}
      />

      {/* Delete Confirmation */}
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
