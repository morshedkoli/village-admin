"use client";

import React, { useState } from "react";
import { useProblems } from "@/lib/hooks";
import { updateProblemStatus, deleteProblem } from "@/lib/firestore-service";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { StatusBadge } from "@/components/StatusBadge";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { FormModal } from "@/components/FormModal";
import { EmptyState } from "@/components/EmptyState";
import { formatDate } from "@/lib/utils";
import type { ProblemReport } from "@/lib/models";
import {
  AlertTriangle,
  CheckCircle2,
  Trash2,
  MapPin,
  Calendar,
  User,
  ShieldCheck,
} from "lucide-react";

export default function ProblemsPage() {
  const { data: problems, loading } = useProblems();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewProblem, setViewProblem] = useState<ProblemReport | null>(null);

  if (loading) return <LoadingSkeleton />;

  const pending = problems.filter((p) => p.status === "Pending").length;
  const approved = problems.filter((p) => p.status === "Approved").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Problems</h1>
        <p className="text-sm text-text-secondary mt-1">
          {problems.length} reported &middot; {pending} pending &middot; {approved} approved
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        {problems.length === 0 ? (
          <EmptyState
            icon={AlertTriangle}
            title="No problems reported"
            description="All reported village problems will appear here for moderation."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-background/50">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Problem
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Reported By
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
                {problems.map((problem) => (
                  <tr
                    key={problem.id}
                    className="hover:bg-surface-hover/50 transition-colors cursor-pointer"
                    onClick={() => setViewProblem(problem)}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {problem.photoUrl ? (
                          <img
                            src={problem.photoUrl}
                            alt=""
                            className="w-10 h-10 rounded-xl object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center shrink-0">
                            <AlertTriangle className="w-5 h-5 text-text-muted" />
                          </div>
                        )}
                        <p className="text-sm font-medium text-text-primary">
                          {problem.title}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-text-secondary">
                      {problem.location || "—"}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={problem.status} />
                    </td>
                    <td className="px-5 py-4 text-sm text-text-secondary">
                      {problem.reportedByName}
                    </td>
                    <td className="px-5 py-4 text-sm text-text-muted">
                      {formatDate(problem.createdAt)}
                    </td>
                    <td className="px-5 py-4">
                      <div
                        className="flex items-center justify-end gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {problem.status === "Pending" && (
                          <button
                            onClick={() =>
                              updateProblemStatus(problem.id, "Approved")
                            }
                            className="p-2 rounded-lg hover:bg-info-light text-text-muted hover:text-info transition-colors"
                            title="Approve"
                          >
                            <ShieldCheck className="w-4 h-4" />
                          </button>
                        )}
                        {problem.status === "Approved" && (
                          <button
                            onClick={() =>
                              updateProblemStatus(problem.id, "Completed")
                            }
                            className="p-2 rounded-lg hover:bg-success-light text-text-muted hover:text-success transition-colors"
                            title="Mark Complete"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteId(problem.id)}
                          className="p-2 rounded-lg hover:bg-danger-light text-text-muted hover:text-danger transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <FormModal
        open={viewProblem !== null}
        title="Problem Details"
        onClose={() => setViewProblem(null)}
        size="md"
      >
        {viewProblem && (
          <div className="space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-text-primary">
                  {viewProblem.title}
                </h3>
                <div className="mt-2">
                  <StatusBadge status={viewProblem.status} />
                </div>
              </div>
            </div>

            {viewProblem.photoUrl && (
              <img
                src={viewProblem.photoUrl}
                alt="Problem photo"
                className="w-full rounded-xl max-h-64 object-cover"
              />
            )}

            <p className="text-sm text-text-secondary leading-relaxed">
              {viewProblem.description}
            </p>

            <div className="grid grid-cols-2 gap-4 p-4 bg-background rounded-xl">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-text-muted" />
                <span className="text-text-secondary">
                  {viewProblem.location || "Not specified"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-text-muted" />
                <span className="text-text-secondary">
                  {viewProblem.reportedByName}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-text-muted" />
                <span className="text-text-secondary">
                  {viewProblem.createdAt.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-border">
              {viewProblem.status === "Pending" && (
                <button
                  onClick={() => {
                    updateProblemStatus(viewProblem.id, "Approved");
                    setViewProblem(null);
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-info text-white hover:bg-info/90 transition-colors"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Approve
                </button>
              )}
              {viewProblem.status === "Approved" && (
                <button
                  onClick={() => {
                    updateProblemStatus(viewProblem.id, "Completed");
                    setViewProblem(null);
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-success text-white hover:bg-success/90 transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Mark Complete
                </button>
              )}
              <button
                onClick={() => {
                  setDeleteId(viewProblem.id);
                  setViewProblem(null);
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-danger-light text-danger hover:bg-danger/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        )}
      </FormModal>

      <ConfirmDialog
        open={deleteId !== null}
        title="Delete Problem"
        message="Are you sure you want to delete this problem report? This action cannot be undone."
        onConfirm={async () => {
          if (deleteId) await deleteProblem(deleteId);
          setDeleteId(null);
        }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
