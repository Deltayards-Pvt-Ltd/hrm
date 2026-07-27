"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/features/auth";
import { hrmBffFetch } from "@/lib/api/hrm-bff";
import { HRM_PERMISSIONS, hasPermission } from "@/shared/permissions";
import { EmptyState } from "@/shared/ui/empty-state";
import { useSnackbar } from "@/shared/ui";
import { PageHeader, Panel, StatCardMini } from "@/shared/ui/page-chrome";

type HrmDocument = {
  _id?: string;
  id?: string;
  name?: string;
  description?: string;
  category?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  uploadedBy?: string;
  uploadedAt?: string;
  public?: boolean;
};

function formatBytes(bytes?: number) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function DocumentsView() {
  const { user } = useAuth();
  const { showSuccess, showError } = useSnackbar();
  const canWrite = hasPermission(user, HRM_PERMISSIONS.DOCUMENTS_WRITE);

  const [docs, setDocs] = useState<HrmDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("policy");
  const [fileUrl, setFileUrl] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await hrmBffFetch<{ data?: HrmDocument[]; documents?: HrmDocument[] }>("documents");
      setDocs(res.data ?? res.documents ?? []);
    } catch (e) {
      showError(e instanceof Error ? e.message : "Failed to load documents", "Error");
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => { void load(); }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { showError("Name is required", "Validation"); return; }
    try {
      setUploading(true);
      await hrmBffFetch("documents", {
        method: "POST",
        body: JSON.stringify({ name, description, category, fileUrl, public: isPublic }),
      });
      showSuccess("Document uploaded", "Done");
      setShowForm(false);
      setName(""); setDescription(""); setFileUrl("");
      await load();
    } catch (e) {
      showError(e instanceof Error ? e.message : "Upload failed", "Error");
    } finally {
      setUploading(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this document?")) return;
    try {
      setDeleting(id);
      await hrmBffFetch(`documents/${id}`, { method: "DELETE" });
      showSuccess("Deleted", "Done");
      await load();
    } catch (e) {
      showError(e instanceof Error ? e.message : "Delete failed", "Error");
    } finally {
      setDeleting(null);
    }
  };

  const filtered = docs.filter((d) => {
    const q = search.toLowerCase();
    return !q || d.name?.toLowerCase().includes(q) || d.category?.toLowerCase().includes(q);
  });

  const byCategory = filtered.reduce<Record<string, HrmDocument[]>>((acc, d) => {
    const cat = d.category ?? "other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(d);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documents"
        subtitle="Company policies, forms, and HR resources"
        actions={
          canWrite ? (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="rounded-lg bg-primary px-4 py-2 text-[13px] font-semibold text-white"
            >
              + Upload document
            </button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCardMini label="Total docs" value={docs.length} />
        <StatCardMini label="Public" value={docs.filter((d) => d.public !== false).length} />
      </div>

      {showForm && canWrite ? (
        <Panel title="Upload document">
          <form onSubmit={(e) => void submit(e)} className="grid gap-3 sm:grid-cols-2">
            <label className="block text-[12px] font-medium text-fg-muted">
              Name *
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-[var(--input-bg)] px-3 py-2 text-[13px] text-heading outline-none focus:border-primary/40"
                required
              />
            </label>
            <label className="block text-[12px] font-medium text-fg-muted">
              Category
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-[var(--input-bg)] px-3 py-2 text-[13px] text-heading outline-none"
              >
                {["policy", "form", "handbook", "compliance", "template", "other"].map((c) => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </label>
            <label className="block text-[12px] font-medium text-fg-muted sm:col-span-2">
              File URL
              <input
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-[var(--input-bg)] px-3 py-2 text-[13px] text-heading outline-none focus:border-primary/40"
                placeholder="https://…"
              />
            </label>
            <label className="block text-[12px] font-medium text-fg-muted sm:col-span-2">
              Description
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-[var(--input-bg)] px-3 py-2 text-[13px] text-heading outline-none focus:border-primary/40"
              />
            </label>
            <label className="flex items-center gap-2 text-[12px] font-medium text-fg-muted sm:col-span-2">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="h-4 w-4 rounded border-border accent-primary"
              />
              Visible to all employees
            </label>
            <div className="flex gap-2 sm:col-span-2">
              <button type="submit" disabled={uploading} className="rounded-lg bg-primary px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-60">
                {uploading ? "Uploading…" : "Upload"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-border px-4 py-2 text-[13px] font-medium text-fg-muted">
                Cancel
              </button>
            </div>
          </form>
        </Panel>
      ) : null}

      <Panel>
        <div className="mb-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents…"
            className="w-full rounded-lg border border-border bg-[var(--input-bg)] px-3 py-2 text-[13px] text-heading outline-none focus:border-primary/40 sm:max-w-xs"
          />
        </div>

        {loading ? (
          <p className="text-[13px] text-fg-muted">Loading…</p>
        ) : filtered.length === 0 ? (
          <EmptyState
            title={search ? "No results" : "No documents yet"}
            description={!search && canWrite ? "Upload the first document." : undefined}
          />
        ) : (
          <div className="space-y-6">
            {Object.entries(byCategory).map(([cat, catDocs]) => (
              <div key={cat}>
                <h3 className="mb-2 text-[12px] font-semibold uppercase tracking-wider text-fg-muted">
                  {cat}
                </h3>
                <ul className="divide-y divide-border/70">
                  {catDocs.map((d) => {
                    const id = d._id ?? d.id ?? "";
                    return (
                      <li key={id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-[18px] text-primary">
                            📄
                          </div>
                          <div>
                            <p className="text-[13px] font-semibold text-heading">{d.name}</p>
                            <p className="text-[12px] text-fg-muted">
                              {[d.description, formatBytes(d.fileSize)].filter(Boolean).join(" · ")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {d.fileUrl ? (
                            <a
                              href={d.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-lg border border-border px-3 py-1.5 text-[12px] font-medium text-fg-muted hover:bg-elevated"
                            >
                              View
                            </a>
                          ) : null}
                          {canWrite ? (
                            <button
                              type="button"
                              disabled={deleting === id}
                              onClick={() => void remove(id)}
                              className="rounded-lg border border-red-200 px-2.5 py-1 text-[12px] font-medium text-red-600 hover:bg-red-50 disabled:opacity-60 dark:border-red-800 dark:text-red-400"
                            >
                              {deleting === id ? "…" : "Delete"}
                            </button>
                          ) : null}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
