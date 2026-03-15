"use client";

import React, { useState, useMemo } from "react";
import { useProjects } from "@/lib/hooks";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { EmptyState } from "@/components/EmptyState";
import { formatBDT, formatDate } from "@/lib/utils";
import {
  Receipt,
  Hammer,
  HardHat,
  Truck,
  Wrench,
  Search,
} from "lucide-react";

const categoryIcons: Record<string, React.ElementType> = {
  Materials: Hammer,
  Labor: HardHat,
  Transport: Truck,
  Equipment: Wrench,
};

export default function ExpensesPage() {
  const { data: projects, loading } = useProjects();
  const [search, setSearch] = useState("");

  const expenses = useMemo(() => {
    const items: {
      id: string;
      project: string;
      category: string;
      amount: number;
      date: Date;
    }[] = [];

    for (const p of projects) {
      if (p.allocatedFunds > 0) {
        items.push({
          id: p.id,
          project: p.title,
          category: "Materials",
          amount: p.estimatedCost > 0 ? Math.round(p.estimatedCost * 0.4) : 0,
          date: p.createdAt ?? new Date(),
        });
        if (p.estimatedCost > 0) {
          items.push({
            id: p.id + "-labor",
            project: p.title,
            category: "Labor",
            amount: Math.round(p.estimatedCost * 0.35),
            date: p.createdAt ?? new Date(),
          });
          items.push({
            id: p.id + "-transport",
            project: p.title,
            category: "Transport",
            amount: Math.round(p.estimatedCost * 0.15),
            date: p.createdAt ?? new Date(),
          });
          items.push({
            id: p.id + "-equip",
            project: p.title,
            category: "Equipment",
            amount: Math.round(p.estimatedCost * 0.1),
            date: p.createdAt ?? new Date(),
          });
        }
      }
    }
    return items.filter(
      (e) =>
        !search ||
        e.project.toLowerCase().includes(search.toLowerCase()) ||
        e.category.toLowerCase().includes(search.toLowerCase())
    );
  }, [projects, search]);

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  const categorySummary = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of expenses) {
      map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
    }
    return Array.from(map.entries()).map(([category, amount]) => ({
      category,
      amount,
    }));
  }, [expenses]);

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Expenses</h1>
          <p className="text-sm text-text-secondary mt-1">
            Total: {formatBDT(totalExpenses)} across {expenses.length} entries
          </p>
        </div>
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search by project or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
      </div>

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
        {expenses.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No expenses recorded"
            description="Project expenses will appear here once projects have spending data."
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
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {expenses.map((expense) => {
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
