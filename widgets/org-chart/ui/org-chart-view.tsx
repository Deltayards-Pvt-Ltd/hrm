"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/features/auth";
import { hrmBffFetch } from "@/lib/api/hrm-bff";
import { HRM_PERMISSIONS, hasAnyPermission, hasPermission } from "@/shared/permissions";
import { EmptyState } from "@/shared/ui/empty-state";
import { useSnackbar } from "@/shared/ui";
import { PageHeader, Panel, StatCardMini } from "@/shared/ui/page-chrome";

type OrgNode = {
  id: string;
  name: string;
  email?: string;
  title?: string;
  level?: number;
  teamType?: string | null;
  project?: { _id?: string; name?: string } | null;
  context?: string | null;
  children?: OrgNode[];
};

type OrgChartResponse = {
  source?: string;
  tree?: OrgNode[];
  scope?: string;
  summaryCounts?: { totalPeople?: number; roots?: number };
  meta?: { editableIn?: string; hint?: string };
};

function OrgNodeRow({ node, depth = 0 }: { node: OrgNode; depth?: number }) {
  const [open, setOpen] = useState(depth < 2);
  const hasChildren = (node.children?.length ?? 0) > 0;
  const projectLabel = node.project?.name;
  const subtitle = [node.title, projectLabel ? `📁 ${projectLabel}` : null, node.teamType]
    .filter(Boolean)
    .join(" · ");

  return (
    <li>
      <div
        className="flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 hover:bg-elevated"
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
        onClick={() => hasChildren && setOpen((v) => !v)}
      >
        {hasChildren ? (
          <span className="mt-0.5 text-[11px] text-fg-muted">{open ? "▾" : "▸"}</span>
        ) : (
          <span className="mt-0.5 w-3" />
        )}
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-[13px] font-semibold text-heading">{node.name}</span>
            {typeof node.level === "number" ? (
              <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                L{node.level}
              </span>
            ) : null}
          </div>
          {subtitle ? <p className="truncate text-[12px] text-fg-muted">{subtitle}</p> : null}
          {node.email ? <p className="truncate text-[11px] text-fg-muted/80">{node.email}</p> : null}
        </div>
      </div>
      {open && hasChildren ? (
        <ul>
          {node.children!.map((child) => (
            <OrgNodeRow key={`${node.id}-${child.id}`} node={child} depth={depth + 1} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function OrgChartView() {
  const { user } = useAuth();
  const { showError } = useSnackbar();
  const canManageReporting = hasPermission(user, HRM_PERMISSIONS.ORG_CHART_WRITE);
  const canSeeCompany = hasAnyPermission(user, [
    HRM_PERMISSIONS.ORG_CHART_READ,
    HRM_PERMISSIONS.ORG_CHART_WRITE,
    HRM_PERMISSIONS.EMPLOYEES_READ,
    HRM_PERMISSIONS.DIRECTORY,
    HRM_PERMISSIONS.USERS,
  ]);

  const [tree, setTree] = useState<OrgNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState<string>("");
  const [counts, setCounts] = useState<{ totalPeople?: number; roots?: number }>({});
  const [hint, setHint] = useState("");
  const [focusUserId, setFocusUserId] = useState("");

  const load = useCallback(
    async (userId?: string) => {
      try {
        setLoading(true);
        const qs = userId ? `?userId=${encodeURIComponent(userId)}` : "";
        const res = await hrmBffFetch<OrgChartResponse>(`org-chart${qs}`);
        setTree(res.tree ?? []);
        setScope(res.scope ?? "");
        setCounts(res.summaryCounts ?? {});
        setHint(res.meta?.hint ?? "");
      } catch (e) {
        showError(e instanceof Error ? e.message : "Failed to load org chart", "Error");
      } finally {
        setLoading(false);
      }
    },
    [showError]
  );

  useEffect(() => {
    void load();
  }, [load]);

  const crmReportingUrl =
    typeof process.env.NEXT_PUBLIC_CRM_URL === "string" && process.env.NEXT_PUBLIC_CRM_URL
      ? `${process.env.NEXT_PUBLIC_CRM_URL.replace(/\/$/, "")}/apps/user-reporting`
      : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Org Chart"
        subtitle={
          canSeeCompany
            ? "Live reporting hierarchy from CRM User Reporting"
            : "Your team reporting structure (CRM sync)"
        }
        actions={
          <div className="flex flex-wrap gap-2">
            {focusUserId || scope === "user" ? (
              <button
                type="button"
                onClick={() => {
                  setFocusUserId("");
                  void load();
                }}
                className="rounded-lg border border-border px-3 py-1.5 text-[12px] font-medium text-fg-muted hover:bg-elevated"
              >
                Reset view
              </button>
            ) : null}
            {canManageReporting && crmReportingUrl ? (
              <a
                href={crmReportingUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg bg-primary px-3 py-1.5 text-[12px] font-semibold text-white hover:opacity-90"
              >
                Edit in CRM
              </a>
            ) : null}
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCardMini label="People in view" value={counts.totalPeople ?? "—"} />
        <StatCardMini label="Roots" value={counts.roots ?? "—"} />
        <StatCardMini label="Scope" value={scope || "—"} />
      </div>

      {canSeeCompany ? (
        <Panel title="Focus on a user">
          <form
            className="flex flex-col gap-2 sm:flex-row sm:items-center"
            onSubmit={(e) => {
              e.preventDefault();
              const id = focusUserId.trim();
              if (!id) {
                void load();
                return;
              }
              void load(id);
            }}
          >
            <input
              value={focusUserId}
              onChange={(e) => setFocusUserId(e.target.value)}
              placeholder="User Mongo ID (optional)"
              className="w-full rounded-lg border border-border bg-[var(--input-bg)] px-3 py-2 text-[13px] text-heading outline-none focus:border-primary/40 sm:max-w-md"
            />
            <button
              type="submit"
              className="rounded-lg border border-border bg-surface px-4 py-2 text-[13px] font-semibold text-heading hover:bg-elevated"
            >
              Load subtree
            </button>
          </form>
          <p className="mt-2 text-[12px] text-fg-muted">
            Same data as CRM <code className="font-mono text-[11px]">/api/user-reporting/hierarchy/:userId</code>
            . Leave blank for company-wide roots.
          </p>
        </Panel>
      ) : null}

      {loading ? (
        <p className="text-[13px] text-fg-muted">Loading…</p>
      ) : (
        <Panel title="Organisation structure">
          {tree.length === 0 ? (
            <EmptyState
              title="No reporting hierarchy"
              description="No operational (project/global) reporting lines found in CRM User Reporting."
            />
          ) : (
            <ul className="mt-2">
              {tree.map((node) => (
                <OrgNodeRow key={node.id} node={node} />
              ))}
            </ul>
          )}
        </Panel>
      )}

      {hint || canManageReporting ? (
        <Panel title="How to edit">
          <p className="text-[13px] text-fg-muted">
            {hint ||
              "Reporting lines are managed in CRM → User Reporting. This page is a live read-only sync — draft/publish JSON has been removed."}
          </p>
          {!crmReportingUrl ? (
            <p className="mt-2 text-[12px] text-fg-muted">
              Open CRM apps → <strong>User Reporting</strong> to add/change managers.
            </p>
          ) : null}
        </Panel>
      ) : null}
    </div>
  );
}
