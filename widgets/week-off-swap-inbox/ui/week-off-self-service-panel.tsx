"use client";

import { useCallback, useEffect, useState } from "react";
import {
  cancelWeekOffSwapRequest,
  createWeekOffSwapRequest,
  fetchMyWeekOffSwapRequests,
  type WeekOffSwapRequest,
} from "@/entities/week-off-swap/api/queries";
import { useSnackbar } from "@/shared/ui";

function formatDay(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  } catch {
    return iso;
  }
}

export function WeekOffSelfServicePanel() {
  const { showSuccess, showError } = useSnackbar();
  const [rows, setRows] = useState<WeekOffSwapRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setRows(await fetchMyWeekOffSwapRequests());
    } catch (e) {
      showError(e instanceof Error ? e.message : "Failed to load", "Error");
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await createWeekOffSwapRequest({ fromDate, toDate, reason });
      showSuccess("Swap request submitted", "Done");
      setReason("");
      await load();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Submit failed", "Error");
    } finally {
      setSubmitting(false);
    }
  };

  const cancel = async (id: string) => {
    try {
      await cancelWeekOffSwapRequest(id);
      showSuccess("Request cancelled", "Done");
      await load();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Cancel failed", "Error");
    }
  };

  return (
    <section className="rounded-[14px] border border-border/90 bg-surface p-5 shadow-[var(--shadow-card)]">
      <h2 className="text-[16px] font-semibold text-heading">My week-off swaps</h2>
      <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-3">
        <label className="block text-[12px] font-medium text-fg-muted">
          From (week-off day)
          <input
            type="date"
            required
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-canvas px-3 py-2 text-[13px]"
          />
        </label>
        <label className="block text-[12px] font-medium text-fg-muted">
          To (work day)
          <input
            type="date"
            required
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-canvas px-3 py-2 text-[13px]"
          />
        </label>
        <label className="block text-[12px] font-medium text-fg-muted">
          Reason
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-canvas px-3 py-2 text-[13px]"
          />
        </label>
        <div className="sm:col-span-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-primary px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-60"
          >
            {submitting ? "Submitting…" : "Request swap"}
          </button>
        </div>
      </form>

      {loading ? (
        <p className="mt-4 text-[13px] text-fg-muted">Loading…</p>
      ) : (
        <ul className="mt-4 divide-y divide-border/70">
          {rows.length === 0 ? (
            <li className="py-3 text-[13px] text-fg-muted">No swap requests</li>
          ) : (
            rows.map((r) => (
              <li key={r._id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <p className="text-[13px] text-heading">
                  {formatDay(r.fromDate)} → {formatDay(r.toDate)}{" "}
                  <span className="text-fg-muted">({r.status})</span>
                </p>
                {r.status === "pending_hr" || r.status === "pending" ? (
                  <button
                    type="button"
                    onClick={() => void cancel(r._id)}
                    className="text-[12px] font-semibold text-red-600"
                  >
                    Cancel
                  </button>
                ) : null}
              </li>
            ))
          )}
        </ul>
      )}
    </section>
  );
}
