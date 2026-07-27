"use client";

import { useCallback, useEffect, useState } from "react";
import { hrmBffFetch } from "@/lib/api/hrm-bff";
import { useSnackbar } from "@/shared/ui";
import { EmptyState } from "@/shared/ui/empty-state";
import { PageHeader, Panel, StatCardMini } from "@/shared/ui/page-chrome";

type HrmUser = {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  level?: number;
  permissions?: string[];
  department?: string;
  position?: string;
  isActive?: boolean;
};

export function UsersView() {
  const { showError } = useSnackbar();
  const [users, setUsers] = useState<HrmUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await hrmBffFetch<{ data?: HrmUser[]; users?: HrmUser[] }>("users");
      setUsers(res.data ?? res.users ?? []);
    } catch (e) {
      showError(e instanceof Error ? e.message : "Failed to load users", "Error");
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => { void load(); }, [load]);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      !q ||
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Users" subtitle="CRM users and their role permissions" />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCardMini label="Total users" value={users.length} />
        <StatCardMini label="Active" value={users.filter((u) => u.isActive !== false).length} />
      </div>

      <Panel>
        <div className="mb-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or role…"
            className="w-full rounded-lg border border-border bg-[var(--input-bg)] px-3 py-2 text-[13px] text-heading outline-none focus:border-primary/40 sm:max-w-xs"
          />
        </div>

        {loading ? (
          <p className="text-[13px] text-fg-muted">Loading…</p>
        ) : filtered.length === 0 ? (
          <EmptyState title="No users found" description={search ? "Try a different search term." : undefined} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-border text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
                  <th className="pb-2 pr-4">Name</th>
                  <th className="pb-2 pr-4">Email</th>
                  <th className="pb-2 pr-4">Role</th>
                  <th className="pb-2 pr-4">Level</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filtered.map((u) => {
                  const id = u._id ?? u.id ?? u.email;
                  return (
                    <tr key={id} className="hover:bg-elevated/50">
                      <td className="py-2.5 pr-4 font-medium text-heading">{u.name ?? "—"}</td>
                      <td className="py-2.5 pr-4 text-fg-muted">{u.email ?? "—"}</td>
                      <td className="py-2.5 pr-4">
                        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                          {u.role ?? "—"}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 text-fg-muted">{u.level ?? "—"}</td>
                      <td className="py-2.5">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                            u.isActive === false
                              ? "bg-red-500/15 text-red-700 dark:text-red-400"
                              : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                          }`}
                        >
                          {u.isActive === false ? "Inactive" : "Active"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
