"use client";

import React, { useState, useEffect } from "react";
import { useVillageOverview } from "@/lib/hooks";
import { updateVillageOverview } from "@/lib/firestore-service";
import { availableBalance } from "@/lib/models";
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
} from "lucide-react";

export default function SettingsPage() {
  const { data: overview, loading } = useVillageOverview();
  const { user } = useAuth();
  const [villageName, setVillageName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (overview) setVillageName(overview.name);
  }, [overview]);

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

  const stats = overview
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
