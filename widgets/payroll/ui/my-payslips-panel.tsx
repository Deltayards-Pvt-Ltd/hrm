"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/features/auth";
import { hrmBffFetch } from "@/lib/api/hrm-bff";
import { HRM_PERMISSIONS, hasPermission } from "@/shared/permissions";
import { useSnackbar } from "@/shared/ui";

type Slip = {
  _id: string;
  month: number;
  year: number;
  net?: number;
  gross?: number;
};

export function MyPayslipsPanel() {
  const { user } = useAuth();
  const canHr = hasPermission(user, HRM_PERMISSIONS.PAYROLL_READ);
  const { showError } = useSnackbar();
  const [slips, setSlips] = useState<Slip[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await hrmBffFetch<{ data: Slip[] }>("payslips/mine");
      setSlips(res.data ?? []);
    } catch (e) {
      showError(e instanceof Error ? e.message : "Failed to load payslips", "Error");
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-[26px] font-bold text-heading">Payslips</h1>
        <p className="mt-1 text-[13px] text-fg-muted">
          {canHr
            ? "Your slips below. Use the employee picker for any user when you have payroll read."
            : "Your generated payslips"}
        </p>
      </header>

      {canHr && user?.id ? (
        <p className="text-[13px]">
          <Link className="font-semibold text-primary hover:underline" href={`/payroll/payslip/${user.id}`}>
            Open detailed payslip for me
          </Link>
        </p>
      ) : null}

      {loading ? (
        <p className="text-[13px] text-fg-muted">Loading…</p>
      ) : slips.length === 0 ? (
        <p className="text-[13px] text-fg-muted">No payslips yet</p>
      ) : (
        <ul className="divide-y divide-border/70 rounded-[14px] border border-border/90 bg-surface">
          {slips.map((s) => (
            <li key={s._id} className="flex items-center justify-between px-4 py-3 text-[13px]">
              <span className="font-medium text-heading">
                {s.month}/{s.year}
              </span>
              <span className="text-fg-muted">
                Net {typeof s.net === "number" ? s.net.toLocaleString("en-IN") : "—"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
