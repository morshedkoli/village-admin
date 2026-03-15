"use client";

import React from "react";
import {
  useVillageOverview,
  useDonations,
  useProjects,
} from "@/lib/hooks";
import { availableBalance } from "@/lib/models";
import { formatBDT } from "@/lib/utils";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import {
  FileBarChart,
  Download,
  Wallet,
  TrendingDown,
  Scale,
  FolderKanban,
} from "lucide-react";

export default function ReportsPage() {
  const { data: overview, loading: l1 } = useVillageOverview();
  const { data: donations, loading: l2 } = useDonations();
  const { data: projects, loading: l3 } = useProjects();

  if (l1 || l2 || l3) return <LoadingSkeleton />;

  const totalDonations = donations.reduce((s, d) => s + d.amount, 0);
  const totalProjectCost = projects.reduce((s, p) => s + p.estimatedCost, 0);
  const totalAllocated = projects.reduce((s, p) => s + p.allocatedFunds, 0);

  const downloadCSV = () => {
    const headers = ["Donor Name", "Amount", "Payment Method", "Date"];
    const rows = donations.map((d) => [
      d.donorName,
      d.amount.toString(),
      d.paymentMethod,
      d.createdAt.toLocaleDateString(),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "village-donations-report.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadProjectCSV = () => {
    const headers = ["Project", "Status", "Estimated Cost", "Allocated Funds"];
    const rows = projects.map((p) => [
      p.title,
      p.status,
      p.estimatedCost.toString(),
      p.allocatedFunds.toString(),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "village-projects-report.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Reports</h1>
        <p className="text-sm text-text-secondary mt-1">
          Generate and download transparency reports
        </p>
      </div>

      {/* Fund Summary */}
      <div className="bg-white rounded-2xl border border-border p-6">
        <h2 className="text-base font-semibold text-text-primary mb-4">
          Village Fund Summary
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Total Fund",
              value: formatBDT(overview?.totalFundCollected ?? 0),
              icon: Wallet,
              color: "text-primary",
              bg: "bg-primary-light",
            },
            {
              label: "Total Spent",
              value: formatBDT(overview?.totalSpent ?? 0),
              icon: TrendingDown,
              color: "text-danger",
              bg: "bg-danger-light",
            },
            {
              label: "Available Balance",
              value: overview ? formatBDT(availableBalance(overview)) : "৳0",
              icon: Scale,
              color: "text-success",
              bg: "bg-success-light",
            },
            {
              label: "Total Projects",
              value: projects.length.toString(),
              icon: FolderKanban,
              color: "text-secondary",
              bg: "bg-secondary-light",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-3 p-4 bg-background rounded-xl"
            >
              <div
                className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}
              >
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xs text-text-muted">{stat.label}</p>
                <p className="text-lg font-bold text-text-primary">
                  {stat.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Download Reports */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-border p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-success-light flex items-center justify-center">
              <FileBarChart className="w-5 h-5 text-success" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-text-primary">
                Donation Report
              </h3>
              <p className="text-xs text-text-muted">
                {donations.length} donations &middot; {formatBDT(totalDonations)} total
              </p>
            </div>
          </div>
          <p className="text-sm text-text-secondary mb-4">
            Download a complete list of all donations with donor names, amounts,
            payment methods, and dates.
          </p>
          <button
            onClick={downloadCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-primary text-white hover:bg-primary-dark transition-colors"
          >
            <Download className="w-4 h-4" />
            Download CSV
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-border p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-secondary-light flex items-center justify-center">
              <FolderKanban className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-text-primary">
                Project Report
              </h3>
              <p className="text-xs text-text-muted">
                {projects.length} projects &middot; {formatBDT(totalAllocated)} allocated
              </p>
            </div>
          </div>
          <p className="text-sm text-text-secondary mb-4">
            Download a summary of all projects with status, estimated costs, and
            allocated funds.
          </p>
          <button
            onClick={downloadProjectCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-primary text-white hover:bg-primary-dark transition-colors"
          >
            <Download className="w-4 h-4" />
            Download CSV
          </button>
        </div>
      </div>
    </div>
  );
}
