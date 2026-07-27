"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/features/auth";
import { hrmBffFetch } from "@/lib/api/hrm-bff";
import { HRM_PERMISSIONS, hasPermission } from "@/shared/permissions";
import { EmptyState } from "@/shared/ui/empty-state";
import { useSnackbar } from "@/shared/ui";
import { PageHeader, Panel, StatCardMini } from "@/shared/ui/page-chrome";

type Goal = { title: string; target?: string; selfRating?: number };

type PerformanceReview = {
  _id?: string;
  id?: string;
  employeeId?: string;
  employeeName?: string;
  period?: string;
  status?: string;
  goals?: Goal[];
  selfRating?: number;
  selfComment?: string;
  hrRating?: number;
  hrComment?: string;
};

function RatingStars({
  value,
  onChange,
  disabled = false,
}: {
  value?: number;
  onChange?: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={disabled}
          onClick={() => onChange?.(n)}
          className={`text-[18px] leading-none transition ${
            (value ?? 0) >= n ? "text-amber-400" : "text-border"
          } ${disabled ? "cursor-default" : "hover:text-amber-400"}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function statusClass(s?: string) {
  if (s === "completed") return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400";
  if (s === "hr_review") return "bg-blue-500/15 text-blue-700 dark:text-blue-400";
  if (s === "self_review") return "bg-amber-500/15 text-amber-800 dark:text-amber-300";
  return "bg-muted/20 text-fg-muted";
}

export function PerformanceView() {
  const { user } = useAuth();
  const { showSuccess, showError } = useSnackbar();
  const isHr = hasPermission(user, HRM_PERMISSIONS.PERFORMANCE_REVIEW);

  const [mine, setMine] = useState<PerformanceReview[]>([]);
  const [hrList, setHrList] = useState<PerformanceReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [period, setPeriod] = useState("");
  const [goalsText, setGoalsText] = useState("");
  const [saving, setSaving] = useState(false);

  const [selfReviewId, setSelfReviewId] = useState<string | null>(null);
  const [selfRating, setSelfRating] = useState(3);
  const [selfComment, setSelfComment] = useState("");

  const [hrReviewId, setHrReviewId] = useState<string | null>(null);
  const [hrRating, setHrRating] = useState(3);
  const [hrComment, setHrComment] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const mineRes = await hrmBffFetch<{ data?: PerformanceReview[]; reviews?: PerformanceReview[] }>(
        "performance/mine"
      );
      setMine(mineRes.data ?? mineRes.reviews ?? []);
      if (isHr) {
        try {
          const hrRes = await hrmBffFetch<{ data?: PerformanceReview[]; reviews?: PerformanceReview[] }>(
            "performance/hr"
          );
          setHrList(hrRes.data ?? hrRes.reviews ?? []);
        } catch { setHrList([]); }
      }
    } catch (e) {
      showError(e instanceof Error ? e.message : "Failed to load performance data", "Error");
    } finally {
      setLoading(false);
    }
  }, [isHr, showError]);

  useEffect(() => { void load(); }, [load]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!period) { showError("Period is required", "Validation"); return; }
    const goals: Goal[] = goalsText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((title) => ({ title }));
    try {
      setSaving(true);
      await hrmBffFetch("performance", {
        method: "POST",
        body: JSON.stringify({ period, goals }),
      });
      showSuccess("Review created", "Done");
      setCreating(false);
      setPeriod(""); setGoalsText("");
      await load();
    } catch (e) {
      showError(e instanceof Error ? e.message : "Create failed", "Error");
    } finally {
      setSaving(false);
    }
  };

  const submitSelf = async (id: string) => {
    try {
      setSaving(true);
      await hrmBffFetch(`performance/${id}/self`, {
        method: "POST",
        body: JSON.stringify({ selfRating, selfComment }),
      });
      showSuccess("Self review submitted", "Done");
      setSelfReviewId(null);
      setSelfComment("");
      await load();
    } catch (e) {
      showError(e instanceof Error ? e.message : "Submit failed", "Error");
    } finally {
      setSaving(false);
    }
  };

  const submitHr = async (id: string) => {
    try {
      setSaving(true);
      await hrmBffFetch(`performance/${id}/hr`, {
        method: "POST",
        body: JSON.stringify({ hrRating, hrComment }),
      });
      showSuccess("HR review completed", "Done");
      setHrReviewId(null);
      setHrComment("");
      await load();
    } catch (e) {
      showError(e instanceof Error ? e.message : "Submit failed", "Error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Performance"
        subtitle="Goal tracking and performance reviews"
        actions={
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="rounded-lg bg-primary px-4 py-2 text-[13px] font-semibold text-white"
          >
            + New review
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCardMini label="My reviews" value={mine.length} />
        <StatCardMini
          label="Pending self"
          value={mine.filter((r) => r.status === "self_review").length}
        />
      </div>

      {creating ? (
        <Panel title="New performance review">
          <form onSubmit={(e) => void create(e)} className="grid gap-3">
            <label className="block text-[12px] font-medium text-fg-muted">
              Period (e.g. Q1 2026) *
              <input
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-[var(--input-bg)] px-3 py-2 text-[13px] text-heading outline-none focus:border-primary/40"
                placeholder="Q1 2026"
                required
              />
            </label>
            <label className="block text-[12px] font-medium text-fg-muted">
              Goals (one per line)
              <textarea
                value={goalsText}
                onChange={(e) => setGoalsText(e.target.value)}
                rows={4}
                className="mt-1 w-full rounded-lg border border-border bg-[var(--input-bg)] px-3 py-2 text-[13px] text-heading outline-none focus:border-primary/40"
                placeholder={"Ship feature X\nImprove test coverage to 80%"}
              />
            </label>
            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="rounded-lg bg-primary px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-60">
                {saving ? "Creating…" : "Create"}
              </button>
              <button type="button" onClick={() => setCreating(false)} className="rounded-lg border border-border px-4 py-2 text-[13px] font-medium text-fg-muted">
                Cancel
              </button>
            </div>
          </form>
        </Panel>
      ) : null}

      <section>
        <h2 className="mb-4 text-[16px] font-semibold text-heading">My reviews</h2>
        {loading ? (
          <p className="text-[13px] text-fg-muted">Loading…</p>
        ) : mine.length === 0 ? (
          <EmptyState title="No reviews yet" description="Create your first performance review." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {mine.map((r) => {
              const id = r._id ?? r.id ?? "";
              return (
                <Panel key={id}>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-[14px] font-semibold text-heading">{r.period ?? "Review"}</p>
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${statusClass(r.status)}`}>
                      {r.status ?? "draft"}
                    </span>
                  </div>
                  {(r.goals?.length ?? 0) > 0 ? (
                    <ul className="mb-3 space-y-1">
                      {r.goals!.map((g, i) => (
                        <li key={i} className="text-[12px] text-fg-muted">• {g.title}</li>
                      ))}
                    </ul>
                  ) : null}
                  {r.selfRating ? (
                    <div className="mb-2">
                      <p className="text-[12px] text-fg-muted">Self rating:</p>
                      <RatingStars value={r.selfRating} disabled />
                    </div>
                  ) : null}
                  {selfReviewId === id ? (
                    <div className="space-y-2">
                      <div>
                        <p className="text-[12px] font-medium text-fg-muted">Self rating</p>
                        <RatingStars value={selfRating} onChange={setSelfRating} />
                      </div>
                      <textarea
                        value={selfComment}
                        onChange={(e) => setSelfComment(e.target.value)}
                        rows={2}
                        placeholder="Your self assessment…"
                        className="w-full rounded-lg border border-border bg-[var(--input-bg)] px-3 py-2 text-[13px] text-heading outline-none focus:border-primary/40"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => void submitSelf(id)}
                          className="rounded-lg bg-primary px-3 py-1.5 text-[12px] font-semibold text-white disabled:opacity-60"
                        >
                          {saving ? "Submitting…" : "Submit self review"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelfReviewId(null)}
                          className="rounded-lg border border-border px-3 py-1.5 text-[12px] font-medium text-fg-muted"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    !r.selfRating && (
                      <button
                        type="button"
                        onClick={() => setSelfReviewId(id)}
                        className="rounded-lg border border-border px-3 py-1 text-[12px] font-medium text-fg-muted hover:bg-elevated"
                      >
                        Submit self review
                      </button>
                    )
                  )}
                </Panel>
              );
            })}
          </div>
        )}
      </section>

      {isHr ? (
        <section>
          <h2 className="mb-4 text-[16px] font-semibold text-heading">HR review queue</h2>
          {hrList.length === 0 ? (
            <EmptyState title="No reviews pending HR" description="All reviews are complete." />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {hrList.map((r) => {
                const id = r._id ?? r.id ?? "";
                return (
                  <Panel key={id}>
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[14px] font-semibold text-heading">
                          {r.employeeName ?? r.employeeId ?? "Employee"}
                        </p>
                        <p className="text-[12px] text-fg-muted">{r.period}</p>
                      </div>
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${statusClass(r.status)}`}>
                        {r.status}
                      </span>
                    </div>
                    {r.selfRating ? (
                      <div className="mb-2">
                        <p className="text-[12px] text-fg-muted">Self rating:</p>
                        <RatingStars value={r.selfRating} disabled />
                        {r.selfComment ? <p className="mt-1 text-[12px] text-fg-muted">{r.selfComment}</p> : null}
                      </div>
                    ) : null}
                    {hrReviewId === id ? (
                      <div className="space-y-2">
                        <div>
                          <p className="text-[12px] font-medium text-fg-muted">HR rating</p>
                          <RatingStars value={hrRating} onChange={setHrRating} />
                        </div>
                        <textarea
                          value={hrComment}
                          onChange={(e) => setHrComment(e.target.value)}
                          rows={2}
                          placeholder="HR assessment…"
                          className="w-full rounded-lg border border-border bg-[var(--input-bg)] px-3 py-2 text-[13px] text-heading outline-none focus:border-primary/40"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => void submitHr(id)}
                            className="rounded-lg bg-primary px-3 py-1.5 text-[12px] font-semibold text-white disabled:opacity-60"
                          >
                            {saving ? "Completing…" : "Complete HR review"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setHrReviewId(null)}
                            className="rounded-lg border border-border px-3 py-1.5 text-[12px] font-medium text-fg-muted"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setHrReviewId(id)}
                        className="rounded-lg border border-border px-3 py-1 text-[12px] font-medium text-fg-muted hover:bg-elevated"
                      >
                        Complete HR review
                      </button>
                    )}
                  </Panel>
                );
              })}
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}
