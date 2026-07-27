"use client";

import type { ReactNode } from "react";

type Props = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
};

/** Shared page chrome matching HRM dashboard theme. */
export function PageHeader({ title, subtitle, actions }: Props) {
  return (
    <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-[26px] font-bold tracking-tight text-heading md:text-[28px]">{title}</h1>
        {subtitle ? (
          <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-fg-muted">{subtitle}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

type StatProps = { label: string; value: string | number; hint?: string };

export function StatCardMini({ label, value, hint }: StatProps) {
  return (
    <div className="rounded-[14px] border border-border/90 bg-surface p-4 shadow-[var(--shadow-card)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-fg-muted">{label}</p>
      <p className="mt-1 text-[22px] font-bold text-heading">{value}</p>
      {hint ? <p className="mt-1 text-[12px] text-fg-muted">{hint}</p> : null}
    </div>
  );
}

export function Panel({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[14px] border border-border/90 bg-surface p-5 shadow-[var(--shadow-card)] ${className}`}
    >
      {title ? <h2 className="mb-3 text-[15px] font-semibold text-heading">{title}</h2> : null}
      {children}
    </section>
  );
}
