"use client";

import React, { useState, useMemo } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useUsers } from "@/lib/hooks";
import { blockUser } from "@/lib/firestore-service";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { FormModal } from "@/components/FormModal";
import { EmptyState } from "@/components/EmptyState";
import type { Citizen } from "@/lib/models";
import {
  Users,
  ShieldBan,
  ShieldCheck,
  Eye,
  Search,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  CreditCard,
  Droplets,
  Calendar,
  Home,
  Plus,
  Save,
} from "lucide-react";

export default function UsersPage() {
  const { user } = useAuth();
  const { data: users, loading } = useUsers();
  const [blockTarget, setBlockTarget] = useState<Citizen | null>(null);
  const [viewUser, setViewUser] = useState<Citizen | null>(null);
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");
  const [form, setForm] = useState({
    name: "",
    profession: "",
    phone: "",
    village: "",
    email: "",
    address: "",
    nidNumber: "",
    bloodGroup: "",
    dateOfBirth: "",
    photoUrl: "",
  });

  const filtered = useMemo(() => {
    if (!search) return users;
    const q = search.toLowerCase();
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        (u.email ?? "").toLowerCase().includes(q) ||
        u.phone.includes(q) ||
        u.village.toLowerCase().includes(q)
    );
  }, [users, search]);

  const resetCreateForm = () => {
    setForm({
      name: "",
      profession: "",
      phone: "",
      village: "",
      email: "",
      address: "",
      nidNumber: "",
      bloodGroup: "",
      dateOfBirth: "",
      photoUrl: "",
    });
    setCreateError("");
  };

  const handleCreateCitizen = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) {
      setCreateError("Citizen name is required.");
      return;
    }

    if (!form.phone.trim()) {
      setCreateError("Phone number is required.");
      return;
    }

    if (!form.village.trim()) {
      setCreateError("Village name is required.");
      return;
    }

    setCreateLoading(true);
    setCreateError("");

    try {
      const token = await user?.getIdToken();
      const res = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(form),
      });

      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error || "Failed to add citizen");
      }

      resetCreateForm();
      setShowCreateModal(false);
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : "Failed to add citizen");
    } finally {
      setCreateLoading(false);
    }
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Citizens</h1>
          <p className="text-sm text-text-secondary mt-1">
            {users.length} registered citizens
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search by name, email, phone..."
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
            Add Citizen
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title={search ? "No citizens match your search" : "No citizens registered"}
            description={search ? "Try a different search term." : "Registered village citizens will appear here."}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-background/50">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Citizen
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Profession
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Village
                  </th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {filtered.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-surface-hover/50 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {user.photoUrl ? (
                          <img
                            src={user.photoUrl}
                            alt=""
                            className="w-9 h-9 rounded-full object-cover shrink-0 ring-2 ring-border"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-primary-light text-primary flex items-center justify-center text-sm font-semibold shrink-0">
                            {user.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-text-primary">
                              {user.name}
                            </p>
                            {user.blocked && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-danger-light text-danger">
                                Blocked
                              </span>
                            )}
                          </div>
                          {user.email && (
                            <p className="text-xs text-text-muted">{user.email}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-text-secondary">
                      {user.profession || "\u2014"}
                    </td>
                    <td className="px-5 py-4 text-sm text-text-secondary">
                      {user.phone || "\u2014"}
                    </td>
                    <td className="px-5 py-4 text-sm text-text-secondary">
                      {user.village || "\u2014"}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setViewUser(user)}
                          className="p-2 rounded-lg hover:bg-surface-hover text-text-muted hover:text-text-primary transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setBlockTarget(user)}
                          className={`p-2 rounded-lg transition-colors ${
                            user.blocked
                              ? "hover:bg-success-light text-text-muted hover:text-success"
                              : "hover:bg-danger-light text-text-muted hover:text-danger"
                          }`}
                          title={user.blocked ? "Unblock" : "Block"}
                        >
                          {user.blocked ? (
                            <ShieldCheck className="w-4 h-4" />
                          ) : (
                            <ShieldBan className="w-4 h-4" />
                          )}
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
        open={viewUser !== null}
        title="Citizen Details"
        onClose={() => setViewUser(null)}
        size="md"
      >
        {viewUser && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              {viewUser.photoUrl ? (
                <img
                  src={viewUser.photoUrl}
                  alt=""
                  className="w-16 h-16 rounded-2xl object-cover ring-2 ring-border"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-primary-light text-primary flex items-center justify-center text-xl font-bold">
                  {viewUser.name.charAt(0)}
                </div>
              )}
              <div>
                <h3 className="text-lg font-semibold text-text-primary">
                  {viewUser.name}
                </h3>
                {viewUser.email && (
                  <p className="text-sm text-text-secondary">{viewUser.email}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-background rounded-xl">
              {[
                { icon: Briefcase, label: "Profession", value: viewUser.profession },
                { icon: Phone, label: "Phone", value: viewUser.phone },
                { icon: MapPin, label: "Village", value: viewUser.village },
                { icon: Home, label: "Address", value: viewUser.address },
                { icon: CreditCard, label: "NID Number", value: viewUser.nidNumber },
                { icon: Droplets, label: "Blood Group", value: viewUser.bloodGroup },
                { icon: Calendar, label: "Date of Birth", value: viewUser.dateOfBirth },
                { icon: Mail, label: "Email", value: viewUser.email },
              ]
                .filter((f) => f.value)
                .map((field) => (
                  <div key={field.label} className="flex items-center gap-3 text-sm">
                    <field.icon className="w-4 h-4 text-text-muted shrink-0" />
                    <div>
                      <p className="text-xs text-text-muted">{field.label}</p>
                      <p className="text-text-primary font-medium">{field.value}</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </FormModal>

      <ConfirmDialog
        open={blockTarget !== null}
        title={blockTarget?.blocked ? "Unblock Citizen" : "Block Citizen"}
        message={
          blockTarget?.blocked
            ? `Are you sure you want to unblock ${blockTarget?.name}? They will regain access to the platform.`
            : `Are you sure you want to block ${blockTarget?.name}? They will lose access to the platform.`
        }
        variant={blockTarget?.blocked ? "warning" : "danger"}
        confirmLabel={blockTarget?.blocked ? "Unblock" : "Block"}
        loadingLabel={blockTarget?.blocked ? "Unblocking..." : "Blocking..."}
        onConfirm={async () => {
          if (blockTarget) await blockUser(blockTarget.id, !blockTarget.blocked);
          setBlockTarget(null);
        }}
        onCancel={() => setBlockTarget(null)}
      />

      <FormModal
        open={showCreateModal}
        title="Add Citizen"
        onClose={() => {
          setShowCreateModal(false);
          resetCreateForm();
        }}
        size="lg"
      >
        <form onSubmit={handleCreateCitizen} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Citizen full name"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Profession
              </label>
              <input
                type="text"
                value={form.profession}
                onChange={(e) => setForm((prev) => ({ ...prev, profession: e.target.value }))}
                placeholder="Profession"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Phone Number
              </label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="Phone number"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Village
              </label>
              <input
                type="text"
                value={form.village}
                onChange={(e) => setForm((prev) => ({ ...prev, village: e.target.value }))}
                placeholder="Village name"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="email@example.com"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                NID Number
              </label>
              <input
                type="text"
                value={form.nidNumber}
                onChange={(e) => setForm((prev) => ({ ...prev, nidNumber: e.target.value }))}
                placeholder="NID number"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Blood Group
              </label>
              <input
                type="text"
                value={form.bloodGroup}
                onChange={(e) => setForm((prev) => ({ ...prev, bloodGroup: e.target.value }))}
                placeholder="e.g. A+"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Date of Birth
              </label>
              <input
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => setForm((prev) => ({ ...prev, dateOfBirth: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Address
            </label>
            <textarea
              value={form.address}
              onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
              rows={3}
              placeholder="Full address"
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Photo URL
            </label>
            <input
              type="url"
              value={form.photoUrl}
              onChange={(e) => setForm((prev) => ({ ...prev, photoUrl: e.target.value }))}
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
                  Save Citizen
                </>
              )}
            </button>
          </div>
        </form>
      </FormModal>
    </div>
  );
}
