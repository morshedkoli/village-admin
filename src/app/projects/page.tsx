"use client";

import React, { useState } from "react";
import { useProjects } from "@/lib/hooks";
import {
  createProject,
  updateProject,
  deleteProject,
} from "@/lib/firestore-service";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { StatusBadge } from "@/components/StatusBadge";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { FormModal } from "@/components/FormModal";
import { EmptyState } from "@/components/EmptyState";
import { formatBDT, formatDate } from "@/lib/utils";
import type { DevelopmentProject } from "@/lib/models";
import { Plus, Pencil, Trash2, FolderKanban } from "lucide-react";

type ProjectStatus = DevelopmentProject["status"];

const defaultForm = {
  title: "",
  description: "",
  estimatedCost: 0,
  allocatedFunds: 0,
  status: "Planning" as ProjectStatus,
  photos: [] as string[],
  updates: [] as string[],
  spendingReport: [] as string[],
};

export default function ProjectsPage() {
  const { data: projects, loading } = useProjects();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  if (loading) return <LoadingSkeleton />;

  const openCreate = () => {
    setForm(defaultForm);
    setEditingId(null);
    setFormOpen(true);
  };

  const openEdit = (p: DevelopmentProject) => {
    setForm({
      title: p.title,
      description: p.description,
      estimatedCost: p.estimatedCost,
      allocatedFunds: p.allocatedFunds,
      status: p.status,
      photos: p.photos,
      updates: p.updates,
      spendingReport: p.spendingReport,
    });
    setEditingId(p.id);
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await updateProject(editingId, form);
      } else {
        await createProject(form);
      }
      setFormOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const totalAllocated = projects.reduce((s, p) => s + p.allocatedFunds, 0);
  const totalEstimated = projects.reduce((s, p) => s + p.estimatedCost, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Projects</h1>
          <p className="text-sm text-text-secondary mt-1">
            {projects.length} projects &middot; {formatBDT(totalAllocated)} allocated of {formatBDT(totalEstimated)} estimated
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-primary text-white hover:bg-primary-dark transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        {projects.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title="No projects created yet"
            description="Start by creating your first village development project."
            action={
              <button
                onClick={openCreate}
                className="px-4 py-2 text-sm font-medium text-primary bg-primary-light rounded-xl hover:bg-primary/10 transition-colors"
              >
                Create Project
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-background/50">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Project
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Allocated
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Estimated
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {projects.map((project) => (
                  <tr
                    key={project.id}
                    className="hover:bg-surface-hover/50 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-text-primary">
                        {project.title}
                      </p>
                      <p className="text-xs text-text-muted mt-0.5 max-w-xs truncate">
                        {project.description}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={project.status} />
                    </td>
                    <td className="px-5 py-4 text-sm font-medium text-text-primary">
                      {formatBDT(project.allocatedFunds)}
                    </td>
                    <td className="px-5 py-4 text-sm text-text-secondary">
                      {formatBDT(project.estimatedCost)}
                    </td>
                    <td className="px-5 py-4 text-sm text-text-muted">
                      {project.createdAt ? formatDate(project.createdAt) : "—"}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(project)}
                          className="p-2 rounded-lg hover:bg-surface-hover text-text-muted hover:text-text-primary transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteId(project.id)}
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
        open={formOpen}
        title={editingId ? "Edit Project" : "New Project"}
        onClose={() => setFormOpen(false)}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Title
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              placeholder="Project name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
              placeholder="Describe the project..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Estimated Cost
              </label>
              <input
                type="number"
                min={0}
                value={form.estimatedCost}
                onChange={(e) =>
                  setForm({ ...form, estimatedCost: Number(e.target.value) })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Allocated Funds
              </label>
              <input
                type="number"
                min={0}
                value={form.allocatedFunds}
                onChange={(e) =>
                  setForm({ ...form, allocatedFunds: Number(e.target.value) })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Status
            </label>
            <select
              value={form.status}
              onChange={(e) =>
                setForm({ ...form, status: e.target.value as ProjectStatus })
              }
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            >
              <option value="Planning">Planning</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-border">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="px-4 py-2.5 text-sm font-medium rounded-xl border border-border text-text-secondary hover:bg-surface-hover transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 text-sm font-medium rounded-xl bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : editingId ? "Update Project" : "Create Project"}
            </button>
          </div>
        </form>
      </FormModal>

      <ConfirmDialog
        open={deleteId !== null}
        title="Delete Project"
        message="Are you sure you want to delete this project? This action cannot be undone."
        onConfirm={async () => {
          if (deleteId) await deleteProject(deleteId);
          setDeleteId(null);
        }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
