"use client";

import React, { useState, useMemo } from "react";
import { useExpenses, useProjects } from "@/lib/hooks";
import { useAuth } from "@/lib/AuthContext";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { EmptyState } from "@/components/EmptyState";
import { FormModal } from "@/components/FormModal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { formatBDT, formatDate } from "@/lib/utils";
import {
  Receipt,
  Hammer,
  HardHat,
  Truck,
  Wrench,
  Search,
  Plus,
  Check,
  Trash2,
} from "lucide-react";

const categoryIcons: Record<string, React.ElementType> = {
  Materials: Hammer,
  Labor: HardHat,
  Transport: Truck,
  Equipment: Wrench,
};

export default function ExpensesPage() {
  const { user } = useAuth();
  const { data: projects } = useProjects();
  const { data: expenses, loading } = useExpenses();
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [project, setProject] = useState("");
  const [category, setCategory] = useState("Materials");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(
      (e) =>
        !search ||
        e.project.toLowerCase().includes(search.toLowerCase()) ||
        e.category.toLowerCase().includes(search.toLowerCase()) ||
        (e.notes ?? "").toLowerCase().includes(search.toLowerCase())
    );
  }, [expenses, search]);

  const totalExpenses = filteredExpenses.reduce((s, e) => s + e.amount, 0);

  const categorySummary = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of filteredExpenses) {
      map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
    }
    return Array.from(map.entries()).map(([category, amount]) => ({
      category,
      amount,
    }));
  }, [filteredExpenses]);

  const resetForm = () => {
    setProject("");
    setCategory("Materials");
    setAmount("");
    setNotes("");
    setError("");
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();

    const numericAmount = Number(amount);
    if (!project.trim()) {
      setError("Project or expense title is required.");
      return;
    }
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError("Enter a valid amount greater than zero.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const token = await user?.getIdToken();
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          project,
          category,
          amount: numericAmount,
          notes,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error || "Failed to add expense");
      }

      resetForm();
      setShowCreateModal(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add expense");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    setActionError("");

    try {
      const token = await user?.getIdToken();
      const res = await fetch(`/api/expenses?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete expense");
      }

      setDeleteId(null);
    } catch (err: unknown) {
      setActionError(
        err instanceof Error ? err.message : "Failed to delete expense"
      );
    }
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Expenses</h1>
          <p className="text-sm text-text-secondary mt-1">
            Total: {formatBDT(totalExpenses)} across {filteredExpenses.length} entries
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search by project, category, or note..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-primary text-white hover:bg-primary-dark transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Expense
          </button>
        </div>
      </div>

      {actionError && (
        <div className="bg-danger-light border border-danger/20 text-danger rounded-xl px-4 py-3 text-sm animate-fade-in">
          {actionError}
        </div>
      )}

      {/* Category Summary Cards */}
      {categorySummary.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {categorySummary.map((cat) => {
            const Icon = categoryIcons[cat.category] ?? Receipt;
            return (
              <div
                key={cat.category}
                className="bg-white rounded-2xl border border-border p-4 hover:shadow-md transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <p className="text-xs text-text-muted font-medium">
                  {cat.category}
                </p>
                <p className="text-lg font-bold text-text-primary">
                  {formatBDT(cat.amount)}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Expense Table */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        {filteredExpenses.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No expenses recorded"
            description="Add the first expense entry to start tracking village spending."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-background/50">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Project
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Notes
                  </th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {filteredExpenses.map((expense) => {
                  const Icon = categoryIcons[expense.category] ?? Receipt;
                  return (
                    <tr
                      key={expense.id}
                      className="hover:bg-surface-hover/50 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center">
                            <Icon className="w-4 h-4 text-text-muted" />
                          </div>
                          <span className="text-sm font-medium text-text-primary">
                            {expense.category}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-text-secondary">
                        {expense.project}
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold text-text-primary">
                        {formatBDT(expense.amount)}
                      </td>
                      <td className="px-5 py-4 text-sm text-text-muted">
                        {formatDate(expense.date)}
                      </td>
                      <td className="px-5 py-4 text-sm text-text-secondary max-w-xs">
                        <span className="line-clamp-2">{expense.notes || "-"}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end">
                          <button
                            onClick={() => setDeleteId(expense.id)}
                            className="p-2 rounded-lg hover:bg-danger-light text-text-muted hover:text-danger transition-colors"
                            title="Delete expense"
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

      <FormModal
        open={showCreateModal}
        title="Add Expense"
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        size="md"
      >
        <form onSubmit={handleCreateExpense} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Project or Expense Title
            </label>
            <input
              type="text"
              value={project}
              onChange={(e) => setProject(e.target.value)}
              list="expense-project-options"
              placeholder="e.g. Road Repair, School Materials"
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
            <datalist id="expense-project-options">
              {projects.map((projectOption) => (
                <option key={projectOption.id} value={projectOption.title} />
              ))}
            </datalist>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              >
                {["Materials", "Labor", "Transport", "Equipment", "Other"].map(
                  (option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  )
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Amount
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="5000"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Optional details about this expense"
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-danger bg-danger-light px-4 py-3 rounded-xl">
              {error}
            </p>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-primary text-white hover:bg-primary-dark transition-all disabled:opacity-50"
            >
              {saving ? (
                "Saving..."
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Save Expense
                </>
              )}
            </button>
          </div>
        </form>
      </FormModal>

      <ConfirmDialog
        open={deleteId !== null}
        title="Delete Expense"
        message={`Are you sure you want to delete this expense of ${formatBDT(
          expenses.find((expense) => expense.id === deleteId)?.amount ?? 0
        )}? This will reduce total spent by the same amount.`}
        variant="danger"
        confirmLabel="Delete"
        loadingLabel="Deleting..."
        onConfirm={async () => {
          if (deleteId) await handleDeleteExpense(deleteId);
        }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
