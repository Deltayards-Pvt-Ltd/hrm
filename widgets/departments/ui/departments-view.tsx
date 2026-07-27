"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/features/auth";
import { hrmBffFetch } from "@/lib/api/hrm-bff";
import { HRM_PERMISSIONS, hasPermission } from "@/shared/permissions";
import { EmptyState } from "@/shared/ui/empty-state";
import { useSnackbar } from "@/shared/ui";
import { PageHeader, Panel, StatCardMini } from "@/shared/ui/page-chrome";

type Department = {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  headCount?: number;
  manager?: string;
};

export function DepartmentsView() {
  const { user } = useAuth();
  const { showSuccess, showError } = useSnackbar();
  const canWrite = hasPermission(user, HRM_PERMISSIONS.DEPARTMENTS);

  const [depts, setDepts] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Department | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await hrmBffFetch<{ data?: Department[]; departments?: Department[] }>("departments");
      setDepts(res.data ?? res.departments ?? []);
    } catch (e) {
      showError(e instanceof Error ? e.message : "Failed to load departments", "Error");
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => { void load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setName("");
    setDescription("");
    setCreating(true);
  };

  const openEdit = (d: Department) => {
    setCreating(false);
    setName(d.name);
    setDescription(d.description ?? "");
    setEditing(d);
  };

  const closeForm = () => {
    setCreating(false);
    setEditing(null);
    setName("");
    setDescription("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { showError("Name is required", "Validation"); return; }
    try {
      setSaving(true);
      if (editing) {
        const id = editing._id ?? editing.id;
        await hrmBffFetch(`departments/${id}`, {
          method: "PATCH",
          body: JSON.stringify({ name, description }),
        });
        showSuccess("Department updated", "Done");
      } else {
        await hrmBffFetch("departments", {
          method: "POST",
          body: JSON.stringify({ name, description }),
        });
        showSuccess("Department created", "Done");
      }
      closeForm();
      await load();
    } catch (e) {
      showError(e instanceof Error ? e.message : "Save failed", "Error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Departments"
        subtitle="Manage company departments"
        actions={
          canWrite ? (
            <button
              type="button"
              onClick={openCreate}
              className="rounded-lg bg-primary px-4 py-2 text-[13px] font-semibold text-white"
            >
              + New department
            </button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCardMini label="Total" value={depts.length} />
      </div>

      {(creating || editing) && canWrite ? (
        <Panel title={editing ? "Edit department" : "New department"}>
          <form onSubmit={(e) => void submit(e)} className="grid gap-3 sm:grid-cols-2">
            <label className="block text-[12px] font-medium text-fg-muted sm:col-span-2">
              Name *
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-[var(--input-bg)] px-3 py-2 text-[13px] text-heading outline-none focus:border-primary/40"
                placeholder="e.g. Engineering"
                required
              />
            </label>
            <label className="block text-[12px] font-medium text-fg-muted sm:col-span-2">
              Description
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-[var(--input-bg)] px-3 py-2 text-[13px] text-heading outline-none focus:border-primary/40"
                placeholder="Optional description"
              />
            </label>
            <div className="flex gap-2 sm:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-primary px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-60"
              >
                {saving ? "Saving…" : editing ? "Update" : "Create"}
              </button>
              <button
                type="button"
                onClick={closeForm}
                className="rounded-lg border border-border px-4 py-2 text-[13px] font-medium text-fg-muted"
              >
                Cancel
              </button>
            </div>
          </form>
        </Panel>
      ) : null}

      {loading ? (
        <p className="text-[13px] text-fg-muted">Loading…</p>
      ) : depts.length === 0 ? (
        <EmptyState
          title="No departments yet"
          description="Create your first department to get started."
          action={
            canWrite ? (
              <button
                type="button"
                onClick={openCreate}
                className="rounded-lg bg-primary px-4 py-2 text-[13px] font-semibold text-white"
              >
                + New department
              </button>
            ) : undefined
          }
        />
      ) : (
        <Panel>
          <ul className="divide-y divide-border/70">
            {depts.map((d) => {
              const id = d._id ?? d.id ?? d.name;
              return (
                <li
                  key={id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <div>
                    <p className="text-[14px] font-semibold text-heading">{d.name}</p>
                    {d.description ? (
                      <p className="text-[12px] text-fg-muted">{d.description}</p>
                    ) : null}
                    {d.headCount != null ? (
                      <p className="text-[12px] text-fg-muted">{d.headCount} employees</p>
                    ) : null}
                  </div>
                  {canWrite ? (
                    <button
                      type="button"
                      onClick={() => openEdit(d)}
                      className="rounded-lg border border-border px-3 py-1.5 text-[12px] font-medium text-fg-muted hover:bg-elevated"
                    >
                      Edit
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </Panel>
      )}
    </div>
  );
}
