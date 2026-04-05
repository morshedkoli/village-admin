"use client";

import React, { useState, useEffect } from "react";
import { useVillageOverview, usePaymentAccounts } from "@/lib/hooks";
import { availableBalance } from "@/lib/models";
import type {
  AdminAccount,
  PaymentAccount,
  PaymentAccounts as PaymentAccountsType,
} from "@/lib/models";
import { formatBDT } from "@/lib/utils";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useAuth } from "@/lib/AuthContext";
import {
  Settings,
  Save,
  Check,
  Pencil,
  X,
  Wallet,
  TrendingDown,
  Scale,
  Users,
  Shield,
  Mail,
  User as UserIcon,
  CreditCard,
  Smartphone,
  Landmark,
  Bell,
  Plus,
  Trash2,
} from "lucide-react";

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

export default function SettingsPage() {
  const { data: overview, loading } = useVillageOverview();
  const { data: paymentAccounts, loading: paLoading } = usePaymentAccounts();
  const { user } = useAuth();
  const [villageName, setVillageName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [editingVillageName, setEditingVillageName] = useState(false);

  // Payment accounts state
  const [accounts, setAccounts] = useState<PaymentAccountsType>([]);
  const [paSaving, setPaSaving] = useState(false);
  const [paSaved, setPaSaved] = useState(false);
  const [paError, setPaError] = useState("");
  const [paLoaded, setPaLoaded] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminSaving, setAdminSaving] = useState(false);
  const [adminSaved, setAdminSaved] = useState(false);
  const [adminError, setAdminError] = useState("");
  const [admins, setAdmins] = useState<AdminAccount[]>([]);
  const [adminsLoading, setAdminsLoading] = useState(true);

  useEffect(() => {
    if (overview && !editingVillageName) setVillageName(overview.name);
  }, [overview, editingVillageName]);

  useEffect(() => {
    if (!paLoaded && !paLoading) {
      setAccounts(paymentAccounts);
      setPaLoaded(true);
    }
  }, [paymentAccounts, paLoading, paLoaded]);

  useEffect(() => {
    const loadAdmins = async () => {
      if (!user) {
        setAdmins([]);
        setAdminsLoading(false);
        return;
      }

      try {
        setAdminsLoading(true);
        const token = await user.getIdToken();
        const res = await fetch("/api/admins", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error("Failed to load admins");
        }

        const data = (await res.json()) as {
          admins?: Array<{
            id: string;
            email: string;
            addedBy?: string;
            addedAt?: string | null;
          }>;
        };

        setAdmins(
          (data.admins ?? []).map((admin) => ({
            id: admin.id,
            email: admin.email,
            addedBy: admin.addedBy ?? "",
            addedAt: admin.addedAt ? new Date(admin.addedAt) : undefined,
          }))
        );
      } catch {
        setAdmins([]);
      } finally {
        setAdminsLoading(false);
      }
    };

    void loadAdmins();
  }, [user]);

  if (loading) return <LoadingSkeleton />;

  const normalizeAdminEmail = (email: string) => email.trim().toLowerCase();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!villageName.trim() || villageName === overview?.name) return;
    setShowConfirm(true);
  };

  const confirmSave = async () => {
    setSaving(true);
    setError("");
    try {
      const token = await user?.getIdToken();
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ name: villageName }),
      });

      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error || "Failed to update village name");
      }

      setEditingVillageName(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to update village name";
      setError(msg);
    } finally {
      setSaving(false);
      setShowConfirm(false);
    }
  };

  const updateAccount = (
    id: string,
    field: keyof Pick<PaymentAccount, "type" | "number" | "name">,
    value: string
  ) => {
    setAccounts((prev) =>
      prev.map((account) =>
        account.id === id ? { ...account, [field]: value } : account
      )
    );
  };

  const addAccount = () => {
    setAccounts((prev) => [...prev, createEmptyAccount()]);
  };

  const removeAccount = (id: string) => {
    setAccounts((prev) => prev.filter((account) => account.id !== id));
  };

  const handleSaveAccounts = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaSaving(true);
    setPaError("");
    try {
      const token = await user?.getIdToken();
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ paymentAccounts: accounts }),
      });

      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error || "Failed to update payment accounts");
      }

      setPaSaved(true);
      setTimeout(() => setPaSaved(false), 2000);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to update payment accounts";
      setPaError(msg);
    } finally {
      setPaSaving(false);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = normalizeAdminEmail(adminEmail);

    if (!normalizedEmail) {
      setAdminError("Please enter an email address.");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(normalizedEmail)) {
      setAdminError("Please enter a valid email address.");
      return;
    }

    if (admins.some((admin) => admin.email === normalizedEmail)) {
      setAdminError("This email already has admin access.");
      return;
    }

    setAdminSaving(true);
    setAdminError("");

    try {
      const token = await user?.getIdToken();
      const res = await fetch("/api/admins", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ email: normalizedEmail }),
      });

      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error || "Failed to add admin");
      }

      setAdminEmail("");
      setAdmins((prev) =>
        [...prev, { id: normalizedEmail, email: normalizedEmail, addedBy: user?.email ?? "" }]
          .sort((a, b) => a.email.localeCompare(b.email))
      );
      setAdminSaved(true);
      setTimeout(() => setAdminSaved(false), 2000);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to add admin";
      setAdminError(msg);
    } finally {
      setAdminSaving(false);
    }
  };

  const stats= overview
    ? [
        {
          label: "Total Fund Collected",
          value: formatBDT(overview.totalFundCollected),
          icon: Wallet,
          color: "text-primary",
          bg: "bg-primary-light",
        },
        {
          label: "Total Spent",
          value: formatBDT(overview.totalSpent),
          icon: TrendingDown,
          color: "text-danger",
          bg: "bg-danger-light",
        },
        {
          label: "Available Balance",
          value: formatBDT(availableBalance(overview)),
          icon: Scale,
          color: "text-success",
          bg: "bg-success-light",
        },
        {
          label: "Total Citizens",
          value: overview.totalCitizens.toLocaleString(),
          icon: Users,
          color: "text-secondary",
          bg: "bg-secondary-light",
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
        <p className="text-sm text-text-secondary mt-1">
          Manage village configuration and view statistics
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Village Settings */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-border p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center">
                <Settings className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-text-primary">
                  Village Configuration
                </h2>
                <p className="text-xs text-text-muted">
                  Update your village details
                </p>
              </div>
            </div>
            <form onSubmit={handleSave} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Village Name
                </label>
                {editingVillageName ? (
                  <input
                    type="text"
                    value={villageName}
                    onChange={(e) => setVillageName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                ) : (
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-4 py-3">
                    <span className="text-sm text-text-primary font-medium">
                      {overview?.name || "Our Village"}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setVillageName(overview?.name ?? "");
                        setEditingVillageName(true);
                        setError("");
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-border text-sm font-medium text-text-primary hover:bg-surface-hover transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                      Edit
                    </button>
                  </div>
                )}
              </div>
              {editingVillageName && (
                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-primary text-white hover:bg-primary-dark transition-all disabled:opacity-50"
                  >
                    {saved ? (
                      <>
                        <Check className="w-4 h-4" />
                        Saved!
                      </>
                    ) : saving ? (
                      "Saving..."
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Name
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setVillageName(overview?.name ?? "");
                      setEditingVillageName(false);
                      setError("");
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-background hover:bg-surface-hover text-text-primary border border-border transition-all"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              )}
              {error && (
                <p className="text-sm text-danger bg-danger-light px-4 py-3 rounded-xl">
                  {error}
                </p>
              )}
            </form>
          </div>

          {/* Donation Account Settings */}
          <div className="bg-white rounded-2xl border border-border p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#FFF4E6] flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-[#FF9500]" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-text-primary">
                  Donation Account Numbers
                </h2>
                <p className="text-xs text-text-muted">
                  Citizens will see these accounts when donating
                </p>
              </div>
            </div>
            <form onSubmit={handleSaveAccounts} className="space-y-5">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={addAccount}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-background border border-border text-text-primary hover:bg-surface-hover transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Add Account
                </button>
              </div>

              {accounts.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-text-muted">
                  No donation accounts added yet. Use <span className="font-medium text-text-primary">Add Account</span> to create one.
                </div>
              ) : (
                accounts.map((account) => {
                const meta = getAccountTypeMeta(account.type);
                const Icon = meta.icon;
                const isActive = account.number.trim() !== "" && account.name.trim() !== "";
                return (
                  <div
                    key={account.id}
                    className="rounded-xl border overflow-hidden"
                    style={{ borderColor: `${meta.color}33` }}
                  >
                    <div
                      className="flex items-center justify-between px-4 py-3"
                      style={{ backgroundColor: `${meta.color}0A` }}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${meta.color}1A` }}
                        >
                          <Icon className="w-4 h-4" style={{ color: meta.color }} />
                        </div>
                        <span className="text-sm font-semibold" style={{ color: meta.color }}>
                          {meta.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-md ${
                            isActive
                              ? "bg-[#ECFDF5] text-[#059669]"
                              : "bg-[#FEF2F2] text-[#DC2626]"
                          }`}
                        >
                          {isActive ? "Active" : "Incomplete"}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeAccount(account.id)}
                          className="p-2 rounded-lg hover:bg-white/70 text-text-muted hover:text-danger transition-colors"
                          title="Remove account"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-text-muted mb-1">
                          Account Type
                        </label>
                        <select
                          value={account.type}
                          onChange={(e) => updateAccount(account.id, "type", e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-text-primary focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                          style={{ "--tw-ring-color": `${meta.color}33` } as React.CSSProperties}
                        >
                          {accountTypeOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-text-muted mb-1">
                          Account Number
                        </label>
                        <input
                          type="text"
                          value={account.number}
                          onChange={(e) => updateAccount(account.id, "number", e.target.value)}
                          placeholder="e.g. 01XXXXXXXXX"
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-text-primary focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                          style={{ "--tw-ring-color": `${meta.color}33` } as React.CSSProperties}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-text-muted mb-1">
                          Account Holder Name
                        </label>
                        <input
                          type="text"
                          value={account.name}
                          onChange={(e) => updateAccount(account.id, "name", e.target.value)}
                          placeholder="Account holder name"
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-text-primary focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                          style={{ "--tw-ring-color": `${meta.color}33` } as React.CSSProperties}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
              )}
              <button
                type="submit"
                disabled={paSaving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-[#FF9500] text-white hover:bg-[#E68600] transition-all disabled:opacity-50"
              >
                {paSaved ? (
                  <>
                    <Check className="w-4 h-4" />
                    Saved!
                  </>
                ) : paSaving ? (
                  "Saving..."
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Account Settings
                  </>
                )}
              </button>
              {paError && (
                <p className="text-sm text-danger bg-danger-light px-4 py-3 rounded-xl">
                  {paError}
                </p>
              )}
            </form>
          </div>

          {/* Firebase Push Notifications */}
          <div className="bg-white rounded-2xl border border-border p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#E8F5FF] flex items-center justify-center">
                <Bell className="w-5 h-5 text-[#0073E6]" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-text-primary">
                  Push Notifications (Firebase)
                </h2>
                <p className="text-xs text-text-muted">
                  Firebase Cloud Messaging is handled server-side with the Firebase Admin SDK
                </p>
              </div>
            </div>
            <div className="bg-background rounded-xl p-4 text-sm text-text-secondary space-y-2">
              <p>
                Admin broadcasts now use Firebase Cloud Messaging instead of OneSignal.
              </p>
              <p className="text-xs text-text-muted">
                Client apps should subscribe to the <code className="font-mono">all</code> topic to receive admin notifications.
              </p>
            </div>
          </div>

          {/* Village Statistics */}
          <div className="bg-white rounded-2xl border border-border p-6">
            <h2 className="text-base font-semibold text-text-primary mb-4">
              Village Statistics
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {stats.map((stat) => (
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
                    <p className="text-base font-semibold text-text-primary">
                      {stat.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Admin Profile */}
        <div className="space-y-6">
          {user && (
            <div className="bg-white rounded-2xl border border-border p-6 h-fit">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-secondary-light flex items-center justify-center">
                  <Shield className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-text-primary">
                    Admin Profile
                  </h2>
                  <p className="text-xs text-text-muted">Your account details</p>
                </div>
              </div>

              <div className="flex flex-col items-center text-center mb-6">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt=""
                    className="w-20 h-20 rounded-2xl mb-3 ring-4 ring-background"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-primary text-white flex items-center justify-center text-2xl font-bold mb-3">
                    {user.displayName?.charAt(0) || "A"}
                  </div>
                )}
                <h3 className="text-lg font-semibold text-text-primary">
                  {user.displayName}
                </h3>
                <span className="text-xs font-medium text-primary bg-primary-light px-2.5 py-1 rounded-lg mt-1">
                  Administrator
                </span>
              </div>

              <div className="space-y-3 p-4 bg-background rounded-xl">
                <div className="flex items-center gap-3 text-sm">
                  <UserIcon className="w-4 h-4 text-text-muted" />
                  <div>
                    <p className="text-xs text-text-muted">Display Name</p>
                    <p className="text-text-primary font-medium">{user.displayName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-text-muted" />
                  <div>
                    <p className="text-xs text-text-muted">Email</p>
                    <p className="text-text-primary font-medium">{user.email}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-border p-6 h-fit">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-text-primary">
                  Admin Access
                </h2>
                <p className="text-xs text-text-muted">
                  Add a new admin by email address
                </p>
              </div>
            </div>

            <form onSubmit={handleAddAdmin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Admin Email
                </label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
                <p className="text-xs text-text-muted mt-2">
                  The user can sign in with this email and will get admin access automatically.
                </p>
              </div>

              <button
                type="submit"
                disabled={adminSaving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-text-primary text-white hover:bg-text-primary/90 transition-all disabled:opacity-50"
              >
                {adminSaved ? (
                  <>
                    <Check className="w-4 h-4" />
                    Added!
                  </>
                ) : adminSaving ? (
                  "Adding..."
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Add Admin
                  </>
                )}
              </button>

              {adminError && (
                <p className="text-sm text-danger bg-danger-light px-4 py-3 rounded-xl">
                  {adminError}
                </p>
              )}
            </form>

            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-sm font-medium text-text-primary mb-3">
                Current Admins
              </p>
              <div className="space-y-2">
                {adminsLoading ? (
                  <p className="text-sm text-text-muted">Loading admins...</p>
                ) : admins.length === 0 ? (
                  <p className="text-sm text-text-muted">No extra admins added yet.</p>
                ) : (
                  admins.map((admin) => (
                    <div
                      key={admin.id}
                      className="flex items-center justify-between gap-3 rounded-xl bg-background px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text-primary break-all">
                          {admin.email}
                        </p>
                        {admin.addedBy && (
                          <p className="text-xs text-text-muted break-all">
                            Added by {admin.addedBy}
                          </p>
                        )}
                      </div>
                      <span className="text-xs font-medium text-primary bg-primary-light px-2.5 py-1 rounded-lg">
                        Admin
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showConfirm}
        title="Change Village Name"
        message={`Are you sure you want to change the village name to "${villageName}"? This will be visible to all citizens.`}
        variant="warning"
        confirmLabel="Confirm Change"
        loadingLabel="Saving..."
        onConfirm={confirmSave}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}
