"use client";

import Link from "next/link";
import { CalendarCheck2, Clock, Wallet } from "lucide-react";
import { useAuth } from "@/features/auth";
import { en } from "@/shared/i18n";
import { HRM_PERMISSIONS, hasPermission } from "@/shared/permissions";
import { HrmDashboardView } from "@/widgets/hrm-dashboard/ui/hrm-dashboard-view";

const iconProps = { size: 22 as const, strokeWidth: 1.7 as const };

export function DashboardPageView({ apiConfigured }: { apiConfigured: boolean }) {
  const { user } = useAuth();
  const isHr =
    hasPermission(user, HRM_PERMISSIONS.EMPLOYEES_READ) ||
    hasPermission(user, HRM_PERMISSIONS.LEAVE_HR) ||
    hasPermission(user, HRM_PERMISSIONS.ATTENDANCE_READ);

  if (isHr) {
    return <HrmDashboardView apiConfigured={apiConfigured} />;
  }

  const name = user?.displayName || user?.name || user?.email || "there";

  return (
    <div className="animate-[fade-in_0.45s_cubic-bezier(0.16,1,0.3,1)_both] space-y-6">
      <header>
        <h1 className="text-[28px] font-bold tracking-tight text-heading">Hi, {name}</h1>
        <p className="mt-1 text-[13px] text-fg-muted">{en.dashboard.subtitle}</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/leave"
          className="rounded-[14px] border border-border/90 bg-surface p-5 shadow-[var(--shadow-card)] transition hover:border-primary/40"
        >
          <CalendarCheck2 {...iconProps} className="text-primary" />
          <p className="mt-3 text-[15px] font-semibold text-heading">Leave</p>
          <p className="mt-1 text-[12px] text-fg-muted">Apply and track requests</p>
        </Link>
        <Link
          href="/attendance"
          className="rounded-[14px] border border-border/90 bg-surface p-5 shadow-[var(--shadow-card)] transition hover:border-primary/40"
        >
          <Clock {...iconProps} className="text-primary" />
          <p className="mt-3 text-[15px] font-semibold text-heading">Attendance</p>
          <p className="mt-1 text-[12px] text-fg-muted">This month’s day summary</p>
        </Link>
        <Link
          href="/payroll/payslip"
          className="rounded-[14px] border border-border/90 bg-surface p-5 shadow-[var(--shadow-card)] transition hover:border-primary/40"
        >
          <Wallet {...iconProps} className="text-primary" />
          <p className="mt-3 text-[15px] font-semibold text-heading">Payslips</p>
          <p className="mt-1 text-[12px] text-fg-muted">View your payslips</p>
        </Link>
      </section>
    </div>
  );
}
