"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { hrmBffFetch } from "@/lib/api/hrm-bff";
import { useSnackbar } from "@/shared/ui";
import { EmptyState } from "@/shared/ui/empty-state";
import { PageHeader, Panel } from "@/shared/ui/page-chrome";

type DirectoryEntry = {
  _id?: string;
  id?: string;
  name?: string;
  fullName?: string;
  email?: string;
  position?: string;
  title?: string;
  department?: string;
  phone?: string;
  mobile?: string;
  avatar?: string;
};

function displayName(e: DirectoryEntry) {
  return e.fullName ?? e.name ?? "Unknown";
}

function displayRole(e: DirectoryEntry) {
  return e.title ?? e.position ?? e.department ?? e.email ?? "";
}

export function DirectoryView() {
  const { showError } = useSnackbar();
  const [entries, setEntries] = useState<DirectoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(
    async (q: string) => {
      try {
        setLoading(true);
        const qs = q ? `?search=${encodeURIComponent(q)}` : "";
        const res = await hrmBffFetch<{ data?: DirectoryEntry[]; directory?: DirectoryEntry[] }>(
          `directory${qs}`
        );
        setEntries(res.data ?? res.directory ?? []);
      } catch (e) {
        showError(e instanceof Error ? e.message : "Failed to load directory", "Error");
      } finally {
        setLoading(false);
      }
    },
    [showError]
  );

  useEffect(() => {
    void load(debounced);
  }, [load, debounced]);

  return (
    <div className="space-y-6">
      <PageHeader title="Employee Directory" subtitle="Find employees by name, role, or department" />

      <Panel>
        <div className="mb-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employees…"
            className="w-full rounded-lg border border-border bg-[var(--input-bg)] px-3 py-2 text-[13px] text-heading outline-none focus:border-primary/40 sm:max-w-sm"
          />
        </div>

        {loading ? (
          <p className="text-[13px] text-fg-muted">Loading…</p>
        ) : entries.length === 0 ? (
          <EmptyState
            title={search ? "No results" : "Directory is empty"}
            description={search ? "Try a different search term." : undefined}
          />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {entries.map((e) => {
              const id = String(e._id ?? e.id ?? e.email);
              const name = displayName(e);
              return (
                <li key={id}>
                  <Link
                    href={`/directory/${id}`}
                    className="flex items-center gap-3 rounded-[12px] border border-border/80 bg-surface px-4 py-3 shadow-sm transition hover:border-primary/30 hover:shadow-md"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[15px] font-bold text-primary">
                      {name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-heading">{name}</p>
                      <p className="truncate text-[12px] text-fg-muted">{displayRole(e)}</p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}
