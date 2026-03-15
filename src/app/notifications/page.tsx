"use client";

import React, { useState } from "react";
import { useNotifications } from "@/lib/hooks";
import {
  createNotification,
  deleteNotification,
} from "@/lib/firestore-service";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { StatusBadge } from "@/components/StatusBadge";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { FormModal } from "@/components/FormModal";
import { EmptyState } from "@/components/EmptyState";
import { relativeTime } from "@/lib/utils";
import type { AppNotification } from "@/lib/models";
import { Megaphone, Plus, Trash2, Send } from "lucide-react";

type NotificationType = AppNotification["type"];

export default function NotificationsPage() {
  const { data: notifications, loading } = useNotifications();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    body: "",
    type: "donation" as NotificationType,
  });
  const [saving, setSaving] = useState(false);

  if (loading) return <LoadingSkeleton />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createNotification(form);
      setFormOpen(false);
      setForm({ title: "", body: "", type: "donation" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Notifications</h1>
          <p className="text-sm text-text-secondary mt-1">
            {notifications.length} notifications sent
          </p>
        </div>
        <button
          onClick={() => setFormOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-primary text-white hover:bg-primary-dark transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Notification
        </button>
      </div>

      {/* Notification Composer */}
      <div className="bg-white rounded-2xl border border-border p-6 animate-fade-in">
        <h3 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Send className="w-4 h-4 text-primary" />
          Quick Compose
        </h3>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col sm:flex-row gap-3"
        >
          <select
            value={form.type}
            onChange={(e) =>
              setForm({ ...form, type: e.target.value as NotificationType })
            }
            className="px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all sm:w-36"
          >
            <option value="donation">Donation</option>
            <option value="problem">Problem</option>
            <option value="citizen">Citizen</option>
            <option value="project">Project</option>
          </select>
          <input
            type="text"
            placeholder="Title"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
          <input
            type="text"
            placeholder="Message body"
            required
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            className="flex-[2] px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 rounded-xl text-sm font-medium bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {saving ? "Sending..." : "Send"}
          </button>
        </form>
      </div>

      {/* Notification List */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        {notifications.length === 0 ? (
          <EmptyState
            icon={Megaphone}
            title="No notifications yet"
            description="Send your first announcement to village citizens."
          />
        ) : (
          <div className="divide-y divide-border-light">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className="flex items-center gap-4 px-5 py-4 hover:bg-surface-hover/50 transition-colors"
              >
                <StatusBadge status={notification.type} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary">
                    {notification.title}
                  </p>
                  <p className="text-xs text-text-muted truncate mt-0.5">
                    {notification.body}
                  </p>
                </div>
                <span className="text-xs text-text-muted whitespace-nowrap">
                  {relativeTime(notification.createdAt)}
                </span>
                <button
                  onClick={() => setDeleteId(notification.id)}
                  className="p-2 rounded-lg hover:bg-danger-light text-text-muted hover:text-danger transition-colors shrink-0"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Full Composer Modal */}
      <FormModal
        open={formOpen}
        title="Create Notification"
        onClose={() => setFormOpen(false)}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Type
            </label>
            <select
              value={form.type}
              onChange={(e) =>
                setForm({ ...form, type: e.target.value as NotificationType })
              }
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            >
              <option value="donation">Donation</option>
              <option value="problem">Problem</option>
              <option value="citizen">Citizen</option>
              <option value="project">Project</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Title
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Notification title"
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Message
            </label>
            <textarea
              rows={4}
              required
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              placeholder="Write your announcement message..."
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
            />
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
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {saving ? "Sending..." : "Send Notification"}
            </button>
          </div>
        </form>
      </FormModal>

      <ConfirmDialog
        open={deleteId !== null}
        title="Delete Notification"
        message="Are you sure you want to delete this notification?"
        onConfirm={async () => {
          if (deleteId) await deleteNotification(deleteId);
          setDeleteId(null);
        }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
