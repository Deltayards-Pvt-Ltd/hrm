"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createLeaveRequest,
  fetchMyLeaveBalance,
  fetchMyLeaveRequests,
  fetchTeamLeaveApprovals,
  tlApproveLeave,
  tlRejectLeave,
  type LeaveRequest,
} from "@/entities/leave";
import { useAuth } from "@/features/auth";
import { HRM_PERMISSIONS, hasPermission } from "@/shared/permissions";
import { useSnackbar } from "@/shared/ui";

const LEAVE_TYPES = [
  { value: "paid", label: "Paid leave" },
  { value: "sick", label: "Sick leave" },
  { value: "unpaid", label: "Unpaid leave" },
  { value: "campoff", label: "Camp-off" },
];

function statusClass(status: string) {
  if (status === "approved") return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400";
  if (status.includes("reject")) return "bg-red-500/15 text-red-700 dark:text-red-400";
  if (status.includes("pending")) return "bg-amber-500/15 text-amber-800 dark:text-amber-300";
  return "bg-muted/20 text-muted";
}

export function LeaveSelfServicePanel() {
  const { user } = useAuth();
  const { showSuccess, showError } = useSnackbar();
  const showTl = hasPermission(user, HRM_PERMISSIONS.LEAVE_TL);

  const [mine, setMine] = useState<LeaveRequest[]>([]);
  const [team, setTeam] = useState<LeaveRequest[]>([]);
  const [balances, setBalances] = useState<
    Array<{ label: string; available: number }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState("paid");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [mineRes, balRes] = await Promise.all([
        fetchMyLeaveRequests(),
        fetchMyLeaveBalance(),
      ]);
      setMine(mineRes.data ?? []);
      const rows = (balRes.balances ?? []).map((b) => ({
        label: String(b.leaveType || b.type || "Leave"),
        available: Number(b.available ?? b.closing ?? 0),
      }));
      if (balRes.campOff) {
        rows.push({
          label: "Camp-off",
          available: Number(balRes.campOff.available ?? balRes.campOff.balance ?? 0),
        });
      }
      setBalances(rows);
      if (showTl) {
        try {
          const teamRes = await fetchTeamLeaveApprovals();
          setTeam(teamRes.data ?? []);
        } catch {
          setTeam([]);
        }
      }
    } catch (e) {
      showError(e instanceof Error ? e.message : "Failed to load leave", "Error");
    } finally {
      setLoading(false);
    }
  }, [showError, showTl]);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      showError("Start and end dates are required", "Validation");
      return;
    }
    try {
      setSubmitting(true);
      await createLeaveRequest({ type, startDate, endDate, reason });
      showSuccess("Leave request submitted", "Done");
      setReason("");
      await load();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Submit failed", "Error");
    } finally {
      setSubmitting(false);
    }
  };

  const tlAct = async (id: string, action: "approve" | "reject") => {
    try {
      setActing(id);
      if (action === "approve") await tlApproveLeave(id);
      else await tlRejectLeave(id);
      showSuccess(action === "approve" ? "Approved" : "Rejected", "Done");
      await load();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Action failed", "Error");
    } finally {
      setActing(null);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[14px] border border-border/90 bg-surface p-5 shadow-[var(--shadow-card)]">
        <h2 className="text-[16px] font-semibold text-heading">My leave</h2>
        <p className="mt-1 text-[13px] text-fg-muted">Balances and new requests</p>

        {loading ? (
          <p className="mt-4 text-[13px] text-fg-muted">Loading…</p>
        ) : (
          <>
            <div className="mt-4 flex flex-wrap gap-2">
              {balances.length === 0 ? (
                <span className="text-[13px] text-fg-muted">No balances on file</span>
              ) : (
                balances.map((b) => (
                  <span
                    key={b.label}
                    className="rounded-lg bg-muted/40 px-3 py-1.5 text-[12px] font-medium text-heading"
                  >
                    {b.label}: {b.available}
                  </span>
                ))
              )}
            </div>

            <form onSubmit={submit} className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="block text-[12px] font-medium text-fg-muted">
                Type
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-canvas px-3 py-2 text-[13px] text-heading"
                >
                  {LEAVE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-[12px] font-medium text-fg-muted">
                Start
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-canvas px-3 py-2 text-[13px] text-heading"
                  required
                />
              </label>
              <label className="block text-[12px] font-medium text-fg-muted">
                End
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-canvas px-3 py-2 text-[13px] text-heading"
                  required
                />
              </label>
              <label className="block text-[12px] font-medium text-fg-muted sm:col-span-2 lg:col-span-1">
                Reason
                <input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-canvas px-3 py-2 text-[13px] text-heading"
                  placeholder="Optional"
                />
              </label>
              <div className="sm:col-span-2 lg:col-span-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-primary px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-60"
                >
                  {submitting ? "Submitting…" : "Apply leave"}
                </button>
              </div>
            </form>

            <ul className="mt-5 divide-y divide-border/70">
              {mine.length === 0 ? (
                <li className="py-3 text-[13px] text-fg-muted">No requests yet</li>
              ) : (
                mine.slice(0, 12).map((r) => (
                  <li key={r._id || r.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                    <div>
                      <p className="text-[13px] font-medium text-heading">
                        {r.type} · {r.startDate?.slice?.(0, 10)} → {r.endDate?.slice?.(0, 10)}
                      </p>
                      <p className="text-[12px] text-fg-muted">{r.days} day(s)</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusClass(r.status)}`}>
                      {r.statusLabel || r.status}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </>
        )}
      </section>

      {showTl && team.length > 0 ? (
        <section className="rounded-[14px] border border-border/90 bg-surface p-5 shadow-[var(--shadow-card)]">
          <h2 className="text-[16px] font-semibold text-heading">Team approvals</h2>
          <ul className="mt-4 space-y-3">
            {team.map((r) => {
              const id = r._id || r.id || "";
              const name =
                r.employeeName ||
                (r.user && typeof r.user === "object" ? r.user.name : undefined) ||
                "Employee";
              return (
                <li
                  key={id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 px-3 py-3"
                >
                  <div>
                    <p className="text-[13px] font-semibold text-heading">{name}</p>
                    <p className="text-[12px] text-fg-muted">
                      {r.type} · {r.startDate?.slice?.(0, 10)} → {r.endDate?.slice?.(0, 10)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={acting === id}
                      onClick={() => void tlAct(id, "approve")}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-[12px] font-semibold text-white"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={acting === id}
                      onClick={() => void tlAct(id, "reject")}
                      className="rounded-lg bg-red-600 px-3 py-1.5 text-[12px] font-semibold text-white"
                    >
                      Reject
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
