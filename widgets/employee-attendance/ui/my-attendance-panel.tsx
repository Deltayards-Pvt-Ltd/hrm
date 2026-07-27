"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { hrmBffFetch } from "@/lib/api/hrm-bff";
import { useSnackbar } from "@/shared/ui";

type SummaryRow = {
  date?: string;
  dayType?: string;
  isLop?: boolean;
  user?: string;
};

function monthRange() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const start = new Date(y, m, 1);
  const end = new Date(y, m + 1, 0);
  // Local calendar YMD (toISOString shifts a day in IST)
  const ymd = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return { startDate: ymd(start), endDate: ymd(end) };
}

export function MyAttendancePanel() {
  const { showError } = useSnackbar();
  const [rows, setRows] = useState<SummaryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const range = useMemo(() => monthRange(), []);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const q = `attendance/summary/mine?startDate=${range.startDate}&endDate=${range.endDate}`;
      const res = await hrmBffFetch<{ data: SummaryRow[] }>(q);
      setRows(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      showError(e instanceof Error ? e.message : "Failed to load attendance", "Error");
    } finally {
      setLoading(false);
    }
  }, [range.endDate, range.startDate, showError]);

  useEffect(() => {
    void load();
  }, [load]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const r of rows) {
      const k = r.dayType || "unknown";
      c[k] = (c[k] || 0) + 1;
    }
    return c;
  }, [rows]);

  return (
    <section className="rounded-[14px] border border-border/90 bg-surface p-5 shadow-[var(--shadow-card)]">
      <h2 className="text-[16px] font-semibold text-heading">My attendance</h2>
      <p className="mt-1 text-[13px] text-fg-muted">
        {range.startDate} → {range.endDate}
      </p>

      {loading ? (
        <p className="mt-4 text-[13px] text-fg-muted">Loading…</p>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap gap-2">
            {Object.keys(counts).length === 0 ? (
              <span className="text-[13px] text-fg-muted">No day summaries yet</span>
            ) : (
              Object.entries(counts).map(([k, v]) => (
                <span
                  key={k}
                  className="rounded-lg bg-muted/40 px-3 py-1.5 text-[12px] font-medium text-heading"
                >
                  {k}: {v}
                </span>
              ))
            )}
          </div>
          <ul className="mt-4 max-h-72 divide-y divide-border/70 overflow-y-auto">
            {rows
              .slice()
              .reverse()
              .slice(0, 31)
              .map((r, i) => (
                <li key={`${r.date}-${i}`} className="flex justify-between py-2 text-[13px]">
                  <span className="text-heading">{String(r.date).slice(0, 10)}</span>
                  <span className="text-fg-muted">{r.dayType || "—"}</span>
                </li>
              ))}
          </ul>
        </>
      )}
    </section>
  );
}
