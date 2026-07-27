"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/features/auth";
import { hrmBffFetch } from "@/lib/api/hrm-bff";
import { HRM_PERMISSIONS, hasPermission } from "@/shared/permissions";
import { EmptyState } from "@/shared/ui/empty-state";
import { useSnackbar } from "@/shared/ui";
import { PageHeader, Panel } from "@/shared/ui/page-chrome";

type Announcement = {
  _id?: string;
  id?: string;
  title?: string;
  body?: string;
  category?: string;
  pinned?: boolean;
  createdAt?: string;
  author?: string;
};

export function AnnouncementsView() {
  const { user } = useAuth();
  const { showSuccess, showError } = useSnackbar();
  const canWrite = hasPermission(user, HRM_PERMISSIONS.ANNOUNCEMENTS_WRITE);

  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [composing, setComposing] = useState(false);
  const [editItem, setEditItem] = useState<Announcement | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("general");
  const [pinned, setPinned] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await hrmBffFetch<{ data?: Announcement[]; announcements?: Announcement[] }>(
        "announcements"
      );
      setItems(res.data ?? res.announcements ?? []);
    } catch (e) {
      showError(e instanceof Error ? e.message : "Failed to load announcements", "Error");
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => { void load(); }, [load]);

  const openCreate = () => {
    setEditItem(null);
    setTitle(""); setBody(""); setCategory("general"); setPinned(false);
    setComposing(true);
  };

  const openEdit = (a: Announcement) => {
    setComposing(false);
    setTitle(a.title ?? "");
    setBody(a.body ?? "");
    setCategory(a.category ?? "general");
    setPinned(a.pinned ?? false);
    setEditItem(a);
  };

  const closeForm = () => {
    setComposing(false);
    setEditItem(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { showError("Title is required", "Validation"); return; }
    try {
      setSaving(true);
      if (editItem) {
        const id = editItem._id ?? editItem.id;
        await hrmBffFetch(`announcements/${id}`, {
          method: "PATCH",
          body: JSON.stringify({ title, body, category, pinned }),
        });
        showSuccess("Announcement updated", "Done");
      } else {
        await hrmBffFetch("announcements", {
          method: "POST",
          body: JSON.stringify({ title, body, category, pinned }),
        });
        showSuccess("Announcement posted", "Done");
      }
      closeForm();
      await load();
    } catch (e) {
      showError(e instanceof Error ? e.message : "Save failed", "Error");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this announcement?")) return;
    try {
      setDeleting(id);
      await hrmBffFetch(`announcements/${id}`, { method: "DELETE" });
      showSuccess("Deleted", "Done");
      await load();
    } catch (e) {
      showError(e instanceof Error ? e.message : "Delete failed", "Error");
    } finally {
      setDeleting(null);
    }
  };

  const pinned_items = items.filter((a) => a.pinned);
  const regular = items.filter((a) => !a.pinned);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Announcements"
        subtitle="Company-wide news and updates"
        actions={
          canWrite ? (
            <button
              type="button"
              onClick={openCreate}
              className="rounded-lg bg-primary px-4 py-2 text-[13px] font-semibold text-white"
            >
              + Post announcement
            </button>
          ) : undefined
        }
      />

      {(composing || editItem) && canWrite ? (
        <Panel title={editItem ? "Edit announcement" : "New announcement"}>
          <form onSubmit={(e) => void submit(e)} className="grid gap-3">
            <label className="block text-[12px] font-medium text-fg-muted">
              Title *
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-[var(--input-bg)] px-3 py-2 text-[13px] text-heading outline-none focus:border-primary/40"
                required
              />
            </label>
            <label className="block text-[12px] font-medium text-fg-muted">
              Body
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={4}
                className="mt-1 w-full rounded-lg border border-border bg-[var(--input-bg)] px-3 py-2 text-[13px] text-heading outline-none focus:border-primary/40"
              />
            </label>
            <div className="flex flex-wrap items-center gap-4">
              <label className="block text-[12px] font-medium text-fg-muted">
                Category
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="ml-2 rounded-lg border border-border bg-[var(--input-bg)] px-2 py-1.5 text-[13px] text-heading outline-none"
                >
                  {["general", "policy", "event", "urgent"].map((c) => (
                    <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-2 text-[12px] font-medium text-fg-muted">
                <input
                  type="checkbox"
                  checked={pinned}
                  onChange={(e) => setPinned(e.target.checked)}
                  className="h-4 w-4 rounded border-border accent-primary"
                />
                Pin to top
              </label>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="rounded-lg bg-primary px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-60">
                {saving ? "Saving…" : editItem ? "Update" : "Post"}
              </button>
              <button type="button" onClick={closeForm} className="rounded-lg border border-border px-4 py-2 text-[13px] font-medium text-fg-muted">
                Cancel
              </button>
            </div>
          </form>
        </Panel>
      ) : null}

      {loading ? (
        <p className="text-[13px] text-fg-muted">Loading…</p>
      ) : items.length === 0 ? (
        <EmptyState
          title="No announcements"
          description={canWrite ? "Post the first announcement." : "Nothing here yet."}
          action={
            canWrite ? (
              <button
                type="button"
                onClick={openCreate}
                className="rounded-lg bg-primary px-4 py-2 text-[13px] font-semibold text-white"
              >
                + Post announcement
              </button>
            ) : undefined
          }
        />
      ) : (
        <>
          {pinned_items.length > 0 ? (
            <section>
              <h2 className="mb-3 text-[14px] font-semibold uppercase tracking-wide text-fg-muted">
                Pinned
              </h2>
              <ul className="space-y-3">
                {pinned_items.map((a) => (
                  <AnnouncementCard
                    key={a._id ?? a.id}
                    item={a}
                    canWrite={canWrite}
                    deleting={deleting}
                    onEdit={openEdit}
                    onDelete={remove}
                  />
                ))}
              </ul>
            </section>
          ) : null}
          {regular.length > 0 ? (
            <section>
              {pinned_items.length > 0 ? (
                <h2 className="mb-3 text-[14px] font-semibold uppercase tracking-wide text-fg-muted">
                  All announcements
                </h2>
              ) : null}
              <ul className="space-y-3">
                {regular.map((a) => (
                  <AnnouncementCard
                    key={a._id ?? a.id}
                    item={a}
                    canWrite={canWrite}
                    deleting={deleting}
                    onEdit={openEdit}
                    onDelete={remove}
                  />
                ))}
              </ul>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}

function AnnouncementCard({
  item,
  canWrite,
  deleting,
  onEdit,
  onDelete,
}: {
  item: Announcement;
  canWrite: boolean;
  deleting: string | null;
  onEdit: (a: Announcement) => void;
  onDelete: (id: string) => void;
}) {
  const id = item._id ?? item.id ?? "";
  return (
    <li className="rounded-[14px] border border-border/90 bg-surface p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            {item.pinned ? (
              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                Pinned
              </span>
            ) : null}
            {item.category ? (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary capitalize">
                {item.category}
              </span>
            ) : null}
          </div>
          <h3 className="text-[15px] font-semibold text-heading">{item.title}</h3>
          {item.body ? (
            <p className="mt-1.5 text-[13px] leading-relaxed text-fg-muted">{item.body}</p>
          ) : null}
          <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-fg-muted">
            {item.author ? <span>{item.author}</span> : null}
            {item.createdAt ? <span>{new Date(item.createdAt).toLocaleDateString()}</span> : null}
          </div>
        </div>
        {canWrite ? (
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onEdit(item)}
              className="rounded-lg border border-border px-2.5 py-1 text-[12px] font-medium text-fg-muted hover:bg-elevated"
            >
              Edit
            </button>
            <button
              type="button"
              disabled={deleting === id}
              onClick={() => onDelete(id)}
              className="rounded-lg border border-red-200 px-2.5 py-1 text-[12px] font-medium text-red-600 hover:bg-red-50 disabled:opacity-60 dark:border-red-800 dark:text-red-400"
            >
              {deleting === id ? "…" : "Delete"}
            </button>
          </div>
        ) : null}
      </div>
    </li>
  );
}
