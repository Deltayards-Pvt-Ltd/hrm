"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { hrmBffFetch } from "@/lib/api/hrm-bff";
import { useSnackbar } from "@/shared/ui";
import { PageHeader, Panel } from "@/shared/ui/page-chrome";

type DirectoryDetail = {
  _id?: string;
  id?: string;
  name?: string;
  fullName?: string;
  email?: string;
  position?: string;
  department?: string;
  phone?: string;
  mobile?: string;
  manager?: string;
  joinDate?: string;
  location?: string;
  bio?: string;
  role?: string;
  profile?: {
    department?: string;
    location?: string;
    jobTitle?: string;
    designation?: string;
    joinDate?: string;
    dateOfJoining?: string;
    reportingManagerName?: string;
  };
};

type Row = { label: string; value?: string | null };

function InfoRow({ label, value }: Row) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:items-center">
      <span className="w-40 shrink-0 text-[12px] font-semibold uppercase tracking-wide text-fg-muted">
        {label}
      </span>
      <span className="text-[13px] text-heading">{value}</span>
    </div>
  );
}

export function DirectoryDetailView({ id }: { id: string }) {
  const { showError } = useSnackbar();
  const [person, setPerson] = useState<DirectoryDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await hrmBffFetch<{ data?: DirectoryDetail } | DirectoryDetail>(`directory/${id}`);
      const data = (res as { data?: DirectoryDetail }).data ?? (res as DirectoryDetail);
      setPerson(data);
    } catch (e) {
      showError(e instanceof Error ? e.message : "Failed to load profile", "Error");
    } finally {
      setLoading(false);
    }
  }, [id, showError]);

  useEffect(() => {
    void load();
  }, [load]);

  const name = person?.fullName ?? person?.name ?? "Employee Profile";
  const title =
    person?.profile?.jobTitle ??
    person?.profile?.designation ??
    person?.position ??
    person?.role ??
    "";
  const department = person?.profile?.department ?? person?.department;
  const location = person?.profile?.location ?? person?.location;
  const joinRaw = person?.profile?.joinDate ?? person?.profile?.dateOfJoining ?? person?.joinDate;
  const phone = person?.mobile ?? person?.phone;
  const manager = person?.profile?.reportingManagerName ?? person?.manager;

  return (
    <div className="space-y-6">
      <PageHeader
        title={name}
        subtitle={title || department || ""}
        actions={
          <Link
            href="/directory"
            className="rounded-lg border border-border px-3 py-1.5 text-[12px] font-medium text-fg-muted hover:bg-elevated"
          >
            ← Back
          </Link>
        }
      />

      {loading ? (
        <p className="text-[13px] text-fg-muted">Loading…</p>
      ) : !person ? (
        <p className="text-[13px] text-fg-muted">Profile not found.</p>
      ) : (
        <Panel>
          <div className="flex items-center gap-4 border-b border-border/70 pb-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-[24px] font-bold text-primary">
              {name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-[18px] font-bold text-heading">{name}</h2>
              <p className="text-[13px] text-fg-muted">{title}</p>
            </div>
          </div>
          <div className="mt-2 divide-y divide-border/60">
            <InfoRow label="Email" value={person.email} />
            <InfoRow label="Phone" value={phone} />
            <InfoRow label="Department" value={department} />
            <InfoRow label="Manager" value={manager} />
            <InfoRow label="Location" value={location} />
            <InfoRow label="Join date" value={joinRaw ? String(joinRaw).slice(0, 10) : undefined} />
            {person.bio ? (
              <div className="py-3">
                <p className="text-[12px] font-semibold uppercase tracking-wide text-fg-muted">Bio</p>
                <p className="mt-1 text-[13px] text-heading">{person.bio}</p>
              </div>
            ) : null}
          </div>
        </Panel>
      )}
    </div>
  );
}
