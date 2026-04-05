"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useProblems } from "@/lib/hooks";
import { updateProblemStatus } from "@/lib/firestore-service";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { StatusBadge } from "@/components/StatusBadge";
import { FormModal } from "@/components/FormModal";
import { EmptyState } from "@/components/EmptyState";
import { formatDate } from "@/lib/utils";
import type { ProblemReport } from "@/lib/models";
import {
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Calendar,
  User,
  ShieldCheck,
  Plus,
  Save,
} from "lucide-react";

export default function ProblemsPage() {
  const { user } = useAuth();
  const { data: problems, loading } = useProblems();
  const [viewProblem, setViewProblem] = useState<ProblemReport | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");
  const [actionError, setActionError] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    photoUrl: "",
    status: "Pending" as ProblemReport["status"],
  });

  if (loading) return <LoadingSkeleton />;

  const pending = problems.filter((p) => p.status === "Pending").length;
  const approved = problems.filter((p) => p.status === "Approved").length;

  const resetCreateForm = () => {
    setForm({
      title: "",
      description: "",
      location: "",
      photoUrl: "",
      status: "Pending",
    });
    setCreateError("");
  };

  const handleCreateProblem = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title.trim()) {
      setCreateError("Problem title is required.");
      return;
    }

    if (!form.description.trim()) {
      setCreateError("Problem description is required.");
      return;
    }

    setCreateLoading(true);
    setCreateError("");

    try {
      const token = await user?.getIdToken();
      const res = await fetch("/api/problems", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(form),
      });

      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error || "Failed to add problem");
      }

      resetCreateForm();
      setShowCreateModal(false);
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : "Failed to add problem");
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Problems</h1>
          <p className="text-sm text-text-secondary mt-1">
            {problems.length} reported &middot; {pending} pending &middot; {approved} approved
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-primary text-white hover:bg-primary-dark transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Problem
        </button>
      </div>

      {actionError && (
        <div className="bg-danger-light border border-danger/20 text-danger rounded-xl px-4 py-3 text-sm animate-fade-in">
          {actionError}
        </div>
      )}

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
            </div>
          </div>
        )}
      </FormModal>

      <FormModal
        open={showCreateModal}
        title="Add Problem"
        onClose={() => {
          setShowCreateModal(false);
          resetCreateForm();
        }}
        size="md"
      >
        <form onSubmit={handleCreateProblem} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Problem Title
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="e.g. Road damage near school"
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, description: e.target.value }))
              }
              rows={4}
              placeholder="Describe the issue and why it needs attention"
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Location
              </label>
              <input
                type="text"
                value={form.location}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, location: e.target.value }))
                }
                placeholder="e.g. North road, market area"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    status: e.target.value as ProblemReport["status"],
                  }))
                }
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              >
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Photo URL
            </label>
            <input
              type="url"
              value={form.photoUrl}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, photoUrl: e.target.value }))
              }
              placeholder="https://example.com/photo.jpg"
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          {createError && (
            <p className="text-sm text-danger bg-danger-light px-4 py-3 rounded-xl">
              {createError}
            </p>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={createLoading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-primary text-white hover:bg-primary-dark transition-all disabled:opacity-50"
            >
              {createLoading ? (
                "Saving..."
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Problem
                </>
              )}
            </button>
          </div>
        </form>
      </FormModal>
    </div>
  );
}
