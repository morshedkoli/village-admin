"use client";

import React, { useState, useEffect } from "react";
import { usePaymentAccounts } from "@/lib/hooks";
import { useAuth } from "@/lib/AuthContext";
import type { PaymentAccount } from "@/lib/models";
import {
  CreditCard,
  Smartphone,
  Landmark,
  Copy,
  Check,
  AlertCircle,
  Plus,
  Edit2,
  Trash2,
  X,
  Save,
} from "lucide-react";

const accountTypeOptions = [
  { value: "bkash", label: "bKash", color: "#E2136E", icon: Smartphone },
  { value: "nagad", label: "Nagad", color: "#FF6A00", icon: Smartphone },
  { value: "bank", label: "Bank", color: "#1E40AF", icon: Landmark },
  { value: "rocket", label: "Rocket", color: "#8B2FA0", icon: Smartphone },
];

function getAccountTypeMeta(type: string) {
  return (
    accountTypeOptions.find((option) => option.value === type) ?? {
      value: type,
      label: type || "Other",
      color: "#6B7280",
      icon: CreditCard,
    }
  );
}

function createEmptyAccount(): PaymentAccount {
  return {
    id:
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `account-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: "bkash",
    number: "",
    name: "",
  };
}

export default function DonationAccountsPage() {
  const { data: paymentAccounts, loading } = usePaymentAccounts();
  const { user } = useAuth();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<PaymentAccount | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    setAccounts(paymentAccounts);
  }, [paymentAccounts]);

  const handleCopy = async (text: string, accountId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(accountId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleAddAccount = () => {
    const newAccount = createEmptyAccount();
    setEditingAccount(newAccount);
    setShowModal(true);
  };

  const handleEditAccount = (account: PaymentAccount) => {
    setEditingAccount({ ...account });
    setShowModal(true);
  };

  const handleDeleteAccount = async (accountId: string) => {
    if (!confirm("Are you sure you want to delete this account?")) return;
    
    const updatedAccounts = accounts.filter((acc) => acc.id !== accountId);
    await saveAccounts(updatedAccounts);
  };

  const handleSaveAccount = async () => {
    if (!editingAccount) return;

    const isNew = !accounts.find((acc) => acc.id === editingAccount.id);
    const updatedAccounts = isNew
      ? [...accounts, editingAccount]
      : accounts.map((acc) => (acc.id === editingAccount.id ? editingAccount : acc));

    await saveAccounts(updatedAccounts);
  };

  const saveAccounts = async (updatedAccounts: PaymentAccount[]) => {
    setSaving(true);
    setSaveError("");
    try {
      const token = await user?.getIdToken();
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ paymentAccounts: updatedAccounts }),
      });

      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error || "Failed to update payment accounts");
      }

      setAccounts(updatedAccounts);
      setShowModal(false);
      setEditingAccount(null);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to update payment accounts";
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  };

  const updateEditingAccount = (field: keyof PaymentAccount, value: string) => {
    if (!editingAccount) return;
    setEditingAccount({ ...editingAccount, [field]: value });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-white border-b border-border">
          <div className="max-w-4xl mx-auto px-6 py-8">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF9500] to-[#FF7A00] flex items-center justify-center shadow-lg">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="animate-shimmer h-8 rounded-lg w-64 mb-2" />
                <div className="animate-shimmer h-4 rounded-lg w-48" />
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-shimmer h-64 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const activeAccounts = paymentAccounts.filter(
    (acc) => acc.number.trim() !== "" && acc.name.trim() !== ""
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF9500] to-[#FF7A00] flex items-center justify-center shadow-lg">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-text-primary">
                  Donation Accounts
                </h1>
                <p className="text-sm text-text-muted mt-1">
                  Available payment methods for donations
                </p>
              </div>
            </div>
            <button
              onClick={handleAddAccount}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-primary text-white hover:bg-primary/90 transition-all shadow-sm"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Add Account</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {activeAccounts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-border p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-orange-50 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-orange-500" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              No Active Accounts
            </h3>
            <p className="text-sm text-text-muted max-w-md mx-auto">
              No donation accounts are currently configured. Please contact the
              administrator to add payment accounts.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeAccounts.map((account) => {
              const meta = getAccountTypeMeta(account.type);
              const Icon = meta.icon;
              const isCopied = copiedId === account.id;

              return (
                <div
                  key={account.id}
                  className="bg-white rounded-2xl border-2 overflow-hidden shadow-sm hover:shadow-md transition-all"
                  style={{ borderColor: `${meta.color}33` }}
                >
                  {/* Card Header */}
                  <div
                    className="px-6 py-4"
                    style={{
                      backgroundColor: `${meta.color}08`,
                      borderBottom: `1px solid ${meta.color}22`,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm"
                        style={{ backgroundColor: `${meta.color}15` }}
                      >
                        <Icon
                          className="w-6 h-6"
                          style={{ color: meta.color }}
                        />
                      </div>
                      <div className="flex-1">
                        <h3
                          className="text-lg font-bold"
                          style={{ color: meta.color }}
                        >
                          {meta.label}
                        </h3>
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md bg-green-50 text-green-700 mt-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                          Active
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6 space-y-4 relative">
                    {/* Action Buttons */}
                    <div className="absolute top-4 right-4 flex gap-2">
                      <button
                        onClick={() => handleEditAccount(account)}
                        className="p-2 rounded-lg border border-border bg-white hover:bg-surface transition-all"
                        title="Edit account"
                      >
                        <Edit2 className="w-4 h-4 text-text-muted" />
                      </button>
                      <button
                        onClick={() => handleDeleteAccount(account.id)}
                        className="p-2 rounded-lg border border-border bg-white hover:bg-red-50 hover:border-red-200 transition-all"
                        title="Delete account"
                      >
                        <Trash2 className="w-4 h-4 text-text-muted hover:text-red-600" />
                      </button>
                    </div>
                    {/* Account Number */}
                    <div>
                      <label className="block text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">
                        Account Number
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-surface px-4 py-3 rounded-xl border border-border">
                          <p className="text-base font-mono font-semibold text-text-primary tracking-wide">
                            {account.number}
                          </p>
                        </div>
                        <button
                          onClick={() => handleCopy(account.number, account.id)}
                          className="p-3 rounded-xl border border-border bg-white hover:bg-surface transition-all"
                          title="Copy account number"
                        >
                          {isCopied ? (
                            <Check className="w-5 h-5 text-green-600" />
                          ) : (
                            <Copy className="w-5 h-5 text-text-muted" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Account Holder Name */}
                    <div>
                      <label className="block text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">
                        Account Holder
                      </label>
                      <div className="bg-surface px-4 py-3 rounded-xl border border-border">
                        <p className="text-base font-semibold text-text-primary">
                          {account.name}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            </div>

            {/* Show incomplete accounts for admins */}
            {accounts.filter((acc) => acc.number.trim() === "" || acc.name.trim() === "").length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-text-primary mb-4">
                  Incomplete Accounts
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {accounts
                    .filter((acc) => acc.number.trim() === "" || acc.name.trim() === "")
                    .map((account) => {
                      const meta = getAccountTypeMeta(account.type);
                      const Icon = meta.icon;
                      return (
                        <div
                          key={account.id}
                          className="bg-white rounded-xl border-2 border-dashed border-orange-300 p-4 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: `${meta.color}15` }}
                            >
                              <Icon className="w-5 h-5" style={{ color: meta.color }} />
                            </div>
                            <div>
                              <p className="font-medium text-text-primary">{meta.label}</p>
                              <p className="text-xs text-orange-600">Incomplete - needs setup</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditAccount(account)}
                              className="p-2 rounded-lg bg-orange-50 hover:bg-orange-100 transition-all"
                            >
                              <Edit2 className="w-4 h-4 text-orange-600" />
                            </button>
                            <button
                              onClick={() => handleDeleteAccount(account.id)}
                              className="p-2 rounded-lg hover:bg-red-50 transition-all"
                            >
                              <Trash2 className="w-4 h-4 text-text-muted hover:text-red-600" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </>
        )}

        {/* Footer Info */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-blue-900 mb-1">
                How to Donate
              </h4>
              <p className="text-sm text-blue-700 leading-relaxed">
                Send your donation to any of the active accounts shown above.
                Make sure to use the correct account number and holder name.
                After sending, please submit your donation details through the
                app for verification.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && editingAccount && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-border px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-text-primary">
                {accounts.find((acc) => acc.id === editingAccount.id)
                  ? "Edit Account"
                  : "Add Account"}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingAccount(null);
                  setSaveError("");
                }}
                className="p-2 rounded-lg hover:bg-surface transition-all"
              >
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Account Type */}
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-2">
                  Account Type
                </label>
                <select
                  value={editingAccount.type}
                  onChange={(e) => updateEditingAccount("type", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                >
                  {accountTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Account Number */}
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-2">
                  Account Number
                </label>
                <input
                  type="text"
                  value={editingAccount.number}
                  onChange={(e) => updateEditingAccount("number", e.target.value)}
                  placeholder="e.g. 01XXXXXXXXX or IBAN"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>

              {/* Account Holder Name */}
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-2">
                  Account Holder Name
                </label>
                <input
                  type="text"
                  value={editingAccount.name}
                  onChange={(e) => updateEditingAccount("name", e.target.value)}
                  placeholder="Full name of account holder"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>

              {saveError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-sm text-red-600">{saveError}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingAccount(null);
                    setSaveError("");
                  }}
                  className="flex-1 px-4 py-3 rounded-xl border border-border bg-white text-text-primary font-medium hover:bg-surface transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAccount}
                  disabled={saving || !editingAccount.number.trim() || !editingAccount.name.trim()}
                  className="flex-1 px-4 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {saving ? (
                    "Saving..."
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Account
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
