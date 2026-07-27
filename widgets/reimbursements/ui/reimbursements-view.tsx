"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/features/auth";
import { hrmBffFetch } from "@/lib/api/hrm-bff";
import { HRM_PERMISSIONS, hasPermission } from "@/shared/permissions";
import { EmptyState } from "@/shared/ui/empty-state";
import { useSnackbar } from "@/shared/ui";
import { PageHeader, Panel, StatCardMini } from "@/shared/ui/page-chrome";

type Reimbursement = {
  _id?: string;
  id?: string;
  title?: string;
  description?: string;
  amount?: number;
  category?: string;
  date?: string;
  receiptUrl?: string;
  status?: string;
  comment?: string;
  employeeName?: string;
};

function statusClass(s?: string) {
  if (!s) return "bg-muted/20 text-fg-muted";
  if (s === "approved") return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400";
  if (s === "paid") return "bg-blue-500/15 text-blue-700 dark:text-blue-400";
  if (s === "rejected") return "bg-red-500/15 text-red-700 dark:text-red-400";
  return "bg-amber-500/15 text-amber-800 dark:text-amber-300";
}

export function ReimbursementsView() {
  const { user } = useAuth();
  const { showSuccess, showError } = useSnackbar();
  const isHr = hasPermission(user, HRM_PERMISSIONS.REIMBURSEMENT_HR);

  const [mine, setMine] = useState<Reimbursement[]>([]);
  const [hrQueue, setHrQueue] = useState<Reimbursement[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("travel");
  const [date, setDate] = useState("");
  const [desc, setDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [decideId, setDecideId] = useState<string | null>(null);
  const [decideComment, setDecideComment] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const mineRes = await hrmBffFetch<{ data?: Reimbursement[]; reimbursements?: Reimbursement[] }>(
        "reimbursements/mine"
      );
      setMine(mineRes.data ?? mineRes.reimbursements ?? []);
      if (isHr) {
        try {
          const hrRes = await hrmBffFetch<{ data?: Reimbursement[]; reimbursements?: Reimbursement[] }>(
            "reimbursements/hr"
          );
          setHrQueue(hrRes.data ?? hrRes.reimbursements ?? []);
        } catch { setHrQueue([]); }
      }
    } catch (e) {
      showError(e instanceof Error ? e.message : "Failed to load reimbursements", "Error");
    } finally {
      setLoading(false);
    }
  }, [isHr, showError]);

  useEffect(() => { void load(); }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount) { showError("Title and amount are required", "Validation"); return; }
    try {
      setSaving(true);
      await hrmBffFetch("reimbursements", {
        method: "POST",
        body: JSON.stringify({ title, amount: parseFloat(amount), category, date, description: desc }),
      });
      showSuccess("Reimbursement submitted", "Done");
      setCreating(false);
      setTitle(""); setAmount(""); setDate(""); setDesc("");
      await load();
    } catch (e) {
      showError(e instanceof Error ? e.message : "Submit failed", "Error");
    } finally {
      setSaving(false);
    }
  };

  const decide = async (id: string, action: "approve" | "reject" | "paid") => {
    try {
      setActing(id);
      await hrmBffFetch(`reimbursements/${id}/decide`, {
        method: "POST",
        body: JSON.stringify({ action, comment: decideComment }),
      });
      showSuccess(`Marked as ${action}`, "Done");
      setDecideId(null);
      setDecideComment("");
      await load();
    } catch (e) {
      showError(e instanceof Error ? e.message : "Action failed", "Error");
    } finally {
      setActing(null);
    }
  };

  const pending = mine.filter((r) => r.status === "pending");
  const total = mine.reduce((s, r) => s + (r.amount ?? 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reimbursements"
        subtitle="Submit and track expense reimbursements"
        actions={
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="rounded-lg bg-primary px-4 py-2 text-[13px] font-semibold text-white"
          >
            + New request
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCardMini label="My requests" value={mine.length} />
        <StatCardMini label="Pending" value={pending.length} />
        <StatCardMini label="Total claimed" value={`₹${total.toLocaleString()}`} />
      </div>

      {creating ? (
        <Panel title="New reimbursement request">
          <form onSubmit={(e) => void submit(e)} className="grid gap-3 sm:grid-cols-2">
            <label className="block text-[12px] font-medium text-fg-muted">
              Title *
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-[var(--input-bg)] px-3 py-2 text-[13px] text-heading outline-none focus:border-primary/40"
                placeholder="e.g. Client travel"
                required
              />
            </label>
            <label className="block text-[12px] font-medium text-fg-muted">
              Amount (₹) *
              <input
                type="number"
                min={0}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-[var(--input-bg)] px-3 py-2 text-[13px] text-heading outline-none focus:border-primary/40"
                required
              />
            </label>
            <label className="block text-[12px] font-medium text-fg-muted">
              Category
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-[var(--input-bg)] px-3 py-2 text-[13px] text-heading outline-none focus:border-primary/40"
              >
                {["travel", "meals", "accommodation", "equipment", "other"].map((c) => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </label>
            <label className="block text-[12px] font-medium text-fg-muted">
              Date
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-[var(--input-bg)] px-3 py-2 text-[13px] text-heading outline-none focus:border-primary/40"
              />
            </label>
            <label className="block text-[12px] font-medium text-fg-muted sm:col-span-2">
              Description
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                rows={2}
                className="mt-1 w-full rounded-lg border border-border bg-[var(--input-bg)] px-3 py-2 text-[13px] text-heading outline-none focus:border-primary/40"
              />
            </label>
            <div className="flex gap-2 sm:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-primary px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-60"
              >
                {saving ? "Submitting…" : "Submit"}
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

      <Panel title="My requests">
        {loading ? (
          <p className="text-[13px] text-fg-muted">Loading…</p>
        ) : mine.length === 0 ? (
          <EmptyState title="No reimbursements yet" />
        ) : (
          <ul className="divide-y divide-border/70">
            {mine.map((r) => {
              const id = r._id ?? r.id ?? "";
              return (
                <li key={id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div>
                    <p className="text-[13px] font-semibold text-heading">{r.title}</p>
                    <p className="text-[12px] text-fg-muted">
                      {r.category} · {r.date?.slice(0, 10)} · ₹{(r.amount ?? 0).toLocaleString()}
                    </p>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${statusClass(r.status)}`}>
                    {r.status ?? "pending"}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      {isHr ? (
        <Panel title="HR queue">
          {hrQueue.length === 0 ? (
            <EmptyState title="No pending reimbursements" description="All requests are processed." />
          ) : (
            <ul className="divide-y divide-border/70">
              {hrQueue.map((r) => {
                const id = r._id ?? r.id ?? "";
                return (
                  <li key={id} className="py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-[13px] font-semibold text-heading">
                          {r.employeeName ?? "Employee"} — {r.title}
                        </p>
                        <p className="text-[12px] text-fg-muted">
                          {r.category} · {r.date?.slice(0, 10)} · ₹{(r.amount ?? 0).toLocaleString()}
                        </p>
                      </div>
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${statusClass(r.status)}`}>
                        {r.status ?? "pending"}
                      </span>
                    </div>
                    {decideId === id ? (
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <input
                          value={decideComment}
                          onChange={(e) => setDecideComment(e.target.value)}
                          placeholder="Optional comment"
                          className="rounded-lg border border-border bg-[var(--input-bg)] px-3 py-1.5 text-[12px] text-heading outline-none w-48"
                        />
                        <button
                          type="button"
                          disabled={!!acting}
                          onClick={() => void decide(id, "approve")}
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-[12px] font-semibold text-white"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          disabled={!!acting}
                          onClick={() => void decide(id, "reject")}
                          className="rounded-lg bg-red-600 px-3 py-1.5 text-[12px] font-semibold text-white"
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          disabled={!!acting}
                          onClick={() => void decide(id, "paid")}
                          className="rounded-lg bg-blue-600 px-3 py-1.5 text-[12px] font-semibold text-white"
                        >
                          Mark paid
                        </button>
                        <button
                          type="button"
                          onClick={() => setDecideId(null)}
                          className="rounded-lg border border-border px-3 py-1.5 text-[12px] font-medium text-fg-muted"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDecideId(id)}
                        className="mt-2 rounded-lg border border-border px-3 py-1 text-[12px] font-medium text-fg-muted hover:bg-elevated"
                      >
                        Decide
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      ) : null}
    </div>
  );
}
