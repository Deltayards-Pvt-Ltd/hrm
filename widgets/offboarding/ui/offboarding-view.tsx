"use client";

import { useCallback, useEffect, useState } from "react";
import { hrmBffFetch } from "@/lib/api/hrm-bff";
import { useSnackbar } from "@/shared/ui";
import { EmptyState } from "@/shared/ui/empty-state";
import { PageHeader, Panel } from "@/shared/ui/page-chrome";

type ChecklistItem = {
  key: string;
  label: string;
  done: boolean;
};

type OffboardingRecord = {
  _id?: string;
  id?: string;
  employeeId?: string;
  employeeName?: string;
  exitDate?: string;
  reason?: string;
  status?: string;
  checklist?: ChecklistItem[];
};

function ProgressBar({ done, total }: { done: number; total: number }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-border">
        <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[12px] font-semibold text-fg-muted">{done}/{total}</span>
    </div>
  );
}

export function OffboardingView() {
  const { showSuccess, showError } = useSnackbar();
  const [records, setRecords] = useState<OffboardingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [empId, setEmpId] = useState("");
  const [empName, setEmpName] = useState("");
  const [exitDate, setExitDate] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await hrmBffFetch<{ data?: OffboardingRecord[]; offboarding?: OffboardingRecord[] }>("offboarding");
      setRecords(res.data ?? res.offboarding ?? []);
    } catch (e) {
      showError(e instanceof Error ? e.message : "Failed to load offboarding", "Error");
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => { void load(); }, [load]);

  const toggle = async (recordId: string, key: string, done: boolean) => {
    const tKey = `${recordId}:${key}`;
    try {
      setToggling(tKey);
      await hrmBffFetch(`offboarding/${recordId}/toggle`, {
        method: "POST",
        body: JSON.stringify({ key, done }),
      });
      setRecords((prev) =>
        prev.map((r) => {
          const id = r._id ?? r.id;
          if (id !== recordId) return r;
          return {
            ...r,
            checklist: r.checklist?.map((c) => (c.key === key ? { ...c, done } : c)),
          };
        })
      );
    } catch (e) {
      showError(e instanceof Error ? e.message : "Toggle failed", "Error");
    } finally {
      setToggling(null);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await hrmBffFetch("offboarding", {
        method: "POST",
        body: JSON.stringify({ employeeId: empId, employeeName: empName, exitDate, reason }),
      });
      showSuccess("Offboarding record created", "Done");
      setCreating(false);
      setEmpId(""); setEmpName(""); setExitDate(""); setReason("");
      await load();
    } catch (e) {
      showError(e instanceof Error ? e.message : "Create failed", "Error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Offboarding"
        subtitle="Track employee exit and handover checklists"
        actions={
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="rounded-lg bg-primary px-4 py-2 text-[13px] font-semibold text-white"
          >
            + New offboarding
          </button>
        }
      />

      {creating ? (
        <Panel title="New offboarding">
          <form onSubmit={(e) => void submit(e)} className="grid gap-3 sm:grid-cols-2">
            <label className="block text-[12px] font-medium text-fg-muted">
              Employee ID
              <input
                value={empId}
                onChange={(e) => setEmpId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-[var(--input-bg)] px-3 py-2 text-[13px] text-heading outline-none focus:border-primary/40"
                placeholder="EMP001"
              />
            </label>
            <label className="block text-[12px] font-medium text-fg-muted">
              Employee name
              <input
                value={empName}
                onChange={(e) => setEmpName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-[var(--input-bg)] px-3 py-2 text-[13px] text-heading outline-none focus:border-primary/40"
              />
            </label>
            <label className="block text-[12px] font-medium text-fg-muted">
              Exit date
              <input
                type="date"
                value={exitDate}
                onChange={(e) => setExitDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-[var(--input-bg)] px-3 py-2 text-[13px] text-heading outline-none focus:border-primary/40"
              />
            </label>
            <label className="block text-[12px] font-medium text-fg-muted">
              Reason
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-[var(--input-bg)] px-3 py-2 text-[13px] text-heading outline-none focus:border-primary/40"
                placeholder="Resignation, retirement…"
              />
            </label>
            <div className="flex gap-2 sm:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-primary px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-60"
              >
                {saving ? "Creating…" : "Create"}
              </button>
              <button
                type="button"
                onClick={() => setCreating(false)}
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
      ) : records.length === 0 ? (
        <EmptyState title="No offboarding records" description="Create a new offboarding record to get started." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {records.map((r) => {
            const id = r._id ?? r.id ?? r.employeeId ?? "";
            const checklist = r.checklist ?? [];
            const done = checklist.filter((c) => c.done).length;
            return (
              <Panel key={id}>
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[14px] font-semibold text-heading">
                      {r.employeeName ?? r.employeeId ?? "Unknown"}
                    </p>
                    {r.exitDate ? (
                      <p className="text-[12px] text-fg-muted">Exit {r.exitDate.slice(0, 10)}</p>
                    ) : null}
                    {r.reason ? (
                      <p className="text-[12px] text-fg-muted">{r.reason}</p>
                    ) : null}
                  </div>
                  {r.status ? (
                    <span className="rounded-full bg-red-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-red-700 capitalize dark:text-red-400">
                      {r.status}
                    </span>
                  ) : null}
                </div>
                {checklist.length > 0 ? (
                  <>
                    <ProgressBar done={done} total={checklist.length} />
                    <ul className="mt-3 space-y-1.5">
                      {checklist.map((c) => {
                        const tKey = `${id}:${c.key}`;
                        return (
                          <li key={c.key} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={c.done}
                              disabled={toggling === tKey}
                              onChange={(ev) => void toggle(id, c.key, ev.target.checked)}
                              className="h-4 w-4 rounded border-border accent-primary"
                            />
                            <span className={`text-[13px] ${c.done ? "text-fg-muted line-through" : "text-heading"}`}>
                              {c.label}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </>
                ) : (
                  <p className="text-[12px] text-fg-muted">No checklist items yet.</p>
                )}
              </Panel>
            );
          })}
        </div>
      )}
    </div>
  );
}
