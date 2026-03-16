"use client";

import React, { useState, useEffect } from "react";
import { useVillageOverview, usePaymentAccounts } from "@/lib/hooks";
import { updateVillageOverview, updatePaymentAccounts } from "@/lib/firestore-service";
import { availableBalance } from "@/lib/models";
import type { PaymentAccounts as PaymentAccountsType } from "@/lib/models";
import { formatBDT } from "@/lib/utils";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useAuth } from "@/lib/AuthContext";
import {
  Settings,
  Save,
  Check,
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
} from "lucide-react";

export default function SettingsPage() {
  const { data: overview, loading } = useVillageOverview();
  const { data: paymentAccounts, loading: paLoading } = usePaymentAccounts();
  const { user } = useAuth();
  const [villageName, setVillageName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");

  // Payment accounts state
  const [accounts, setAccounts] = useState<PaymentAccountsType>({
    bKash: { number: "", name: "" },
    Nagad: { number: "", name: "" },
    Rocket: { number: "", name: "" },
    Bank: { number: "", name: "", bankName: "", branch: "" },
  });
  const [paSaving, setPaSaving] = useState(false);
  const [paSaved, setPaSaved] = useState(false);
  const [paError, setPaError] = useState("");
  const [paLoaded, setPaLoaded] = useState(false);

  useEffect(() => {
    if (overview) setVillageName(overview.name);
  }, [overview]);

  useEffect(() => {
    if (!paLoaded && !paLoading) {
      setAccounts({
        bKash: paymentAccounts.bKash ?? { number: "", name: "" },
        Nagad: paymentAccounts.Nagad ?? { number: "", name: "" },
        Rocket: paymentAccounts.Rocket ?? { number: "", name: "" },
        Bank: paymentAccounts.Bank ?? { number: "", name: "", bankName: "", branch: "" },
      });
      setPaLoaded(true);
    }
  }, [paymentAccounts, paLoading, paLoaded]);

  if (loading) return <LoadingSkeleton />;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!villageName.trim() || villageName === overview?.name) return;
    setShowConfirm(true);
  };

  const confirmSave = async () => {
    setSaving(true);
    setError("");
    try {
      await updateVillageOverview({ name: villageName });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to update village name";
      if (msg.includes("permission")) {
        setError(
          "Permission denied. Please update Firestore rules to allow writes to the 'villages' collection for authenticated users."
        );
      } else {
        setError(msg);
      }
    } finally {
      setSaving(false);
      setShowConfirm(false);
    }
  };

  const updateAccount = (
    provider: string,
    field: "number" | "name" | "bankName" | "branch",
    value: string
  ) => {
    setAccounts((prev) => ({
      ...prev,
      [provider]: { ...prev[provider], [field]: value },
    }));
  };

  const handleSaveAccounts = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaSaving(true);
    setPaError("");
    try {
      await updatePaymentAccounts(accounts);
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

  const paymentMethods = [
    { key: "bKash", label: "bKash", color: "#E2136E", isBank: false },
    { key: "Nagad", label: "Nagad", color: "#FF6A00", isBank: false },
    { key: "Rocket", label: "Rocket", color: "#8B2FA0", isBank: false },
    { key: "Bank", label: "Bank Account", color: "#1E40AF", isBank: true },
  ];

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
                <input
                  type="text"
                  value={villageName}
                  onChange={(e) => setVillageName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
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
                    Save Settings
                  </>
                )}
              </button>
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
              {paymentMethods.map((method) => {
                const account = accounts[method.key] ?? { number: "", name: "" };
                const isActive = account.number.trim() !== "";
                return (
                  <div
                    key={method.key}
                    className="rounded-xl border overflow-hidden"
                    style={{ borderColor: `${method.color}33` }}
                  >
                    <div
                      className="flex items-center justify-between px-4 py-3"
                      style={{ backgroundColor: `${method.color}0A` }}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${method.color}1A` }}
                        >
                          {method.isBank ? (
                            <Landmark className="w-4 h-4" style={{ color: method.color }} />
                          ) : (
                            <Smartphone className="w-4 h-4" style={{ color: method.color }} />
                          )}
                        </div>
                        <span className="text-sm font-semibold" style={{ color: method.color }}>
                          {method.label}
                        </span>
                      </div>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-md ${
                          isActive
                            ? "bg-[#ECFDF5] text-[#059669]"
                            : "bg-[#FEF2F2] text-[#DC2626]"
                        }`}
                      >
                        {isActive ? "Active" : "Not Set"}
                      </span>
                    </div>
                    <div className="p-4 space-y-3">
                      {method.isBank && (
                        <>
                          <div>
                            <label className="block text-xs font-medium text-text-muted mb-1">
                              Bank Name
                            </label>
                            <input
                              type="text"
                              value={account.bankName ?? ""}
                              onChange={(e) => updateAccount(method.key, "bankName", e.target.value)}
                              placeholder="e.g. Sonali Bank, Dutch Bangla Bank"
                              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-text-primary focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                              style={{ "--tw-ring-color": `${method.color}33` } as React.CSSProperties}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-text-muted mb-1">
                              Branch Name
                            </label>
                            <input
                              type="text"
                              value={account.branch ?? ""}
                              onChange={(e) => updateAccount(method.key, "branch", e.target.value)}
                              placeholder="e.g. Main Branch, Dhaka"
                              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-text-primary focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                              style={{ "--tw-ring-color": `${method.color}33` } as React.CSSProperties}
                            />
                          </div>
                        </>
                      )}
                      <div>
                        <label className="block text-xs font-medium text-text-muted mb-1">
                          Account Number
                        </label>
                        <input
                          type="text"
                          value={account.number}
                          onChange={(e) => updateAccount(method.key, "number", e.target.value)}
                          placeholder="e.g. 01XXXXXXXXX"
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-text-primary focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                          style={{ "--tw-ring-color": `${method.color}33` } as React.CSSProperties}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-text-muted mb-1">
                          Account Holder Name
                        </label>
                        <input
                          type="text"
                          value={account.name}
                          onChange={(e) => updateAccount(method.key, "name", e.target.value)}
                          placeholder="Account holder name"
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-text-primary focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                          style={{ "--tw-ring-color": `${method.color}33` } as React.CSSProperties}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
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

          {/* OneSignal Push Notifications */}
          <div className="bg-white rounded-2xl border border-border p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#E8F5FF] flex items-center justify-center">
                <Bell className="w-5 h-5 text-[#0073E6]" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-text-primary">
                  Push Notifications (OneSignal)
                </h2>
                <p className="text-xs text-text-muted">
                  OneSignal credentials are configured via server environment variables
                </p>
              </div>
            </div>
            <div className="bg-background rounded-xl p-4 text-sm text-text-secondary space-y-2">
              <p>
                Push notification credentials are now managed server-side via <code className="bg-border/50 px-1.5 py-0.5 rounded text-xs font-mono">.env.local</code> for security.
              </p>
              <p className="text-xs text-text-muted">
                Set <code className="font-mono">ONESIGNAL_APP_ID</code> and <code className="font-mono">ONESIGNAL_API_KEY</code> in your environment variables.
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
