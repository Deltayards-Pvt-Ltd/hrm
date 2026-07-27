"use client";

import { useCallback, useEffect, useState } from "react";
import { hrmBffFetch } from "@/lib/api/hrm-bff";
import { useSnackbar } from "@/shared/ui";
import { EmptyState } from "@/shared/ui/empty-state";
import { PageHeader, Panel, StatCardMini } from "@/shared/ui/page-chrome";

type Job = {
  _id?: string;
  id?: string;
  title?: string;
  department?: string;
  location?: string;
  type?: string;
  status?: string;
  openings?: number;
  description?: string;
};

type Candidate = {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  jobId?: string;
  jobTitle?: string;
  stage?: string;
  status?: string;
  resumeUrl?: string;
  appliedAt?: string;
};

function jobStatusClass(s?: string) {
  if (s === "open") return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400";
  if (s === "closed") return "bg-red-500/15 text-red-700 dark:text-red-400";
  return "bg-amber-500/15 text-amber-800 dark:text-amber-300";
}

function candidateStageClass(s?: string) {
  if (s === "hired") return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400";
  if (s === "rejected") return "bg-red-500/15 text-red-700 dark:text-red-400";
  if (s === "interview") return "bg-blue-500/15 text-blue-700 dark:text-blue-400";
  return "bg-amber-500/15 text-amber-800 dark:text-amber-300";
}

const JOB_STAGES = ["open", "paused", "closed"];
const CANDIDATE_STAGES = ["applied", "screening", "interview", "offer", "hired", "rejected"];

export function RecruitmentView() {
  const { showSuccess, showError } = useSnackbar();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingJob, setAddingJob] = useState(false);
  const [addingCandidate, setAddingCandidate] = useState(false);
  const [saving, setSaving] = useState(false);

  const [jTitle, setJTitle] = useState("");
  const [jDept, setJDept] = useState("");
  const [jLoc, setJLoc] = useState("");
  const [jType, setJType] = useState("full-time");
  const [jOpenings, setJOpenings] = useState("1");

  const [cName, setCName] = useState("");
  const [cEmail, setCEmail] = useState("");
  const [cPhone, setCPhone] = useState("");
  const [cJobId, setCJobId] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [jRes, cRes] = await Promise.all([
        hrmBffFetch<{ data?: Job[]; jobs?: Job[] }>("recruitment/jobs"),
        hrmBffFetch<{ data?: Candidate[]; candidates?: Candidate[] }>("recruitment/candidates"),
      ]);
      setJobs(jRes.data ?? jRes.jobs ?? []);
      setCandidates(cRes.data ?? cRes.candidates ?? []);
    } catch (e) {
      showError(e instanceof Error ? e.message : "Failed to load recruitment data", "Error");
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => { void load(); }, [load]);

  const createJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jTitle) { showError("Job title is required", "Validation"); return; }
    try {
      setSaving(true);
      await hrmBffFetch("recruitment/jobs", {
        method: "POST",
        body: JSON.stringify({ title: jTitle, department: jDept, location: jLoc, type: jType, openings: parseInt(jOpenings) }),
      });
      showSuccess("Job posted", "Done");
      setAddingJob(false);
      setJTitle(""); setJDept(""); setJLoc(""); setJOpenings("1");
      await load();
    } catch (e) {
      showError(e instanceof Error ? e.message : "Failed to post job", "Error");
    } finally {
      setSaving(false);
    }
  };

  const createCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cName) { showError("Candidate name is required", "Validation"); return; }
    try {
      setSaving(true);
      await hrmBffFetch("recruitment/candidates", {
        method: "POST",
        body: JSON.stringify({ name: cName, email: cEmail, phone: cPhone, jobId: cJobId }),
      });
      showSuccess("Candidate added", "Done");
      setAddingCandidate(false);
      setCName(""); setCEmail(""); setCPhone(""); setCJobId("");
      await load();
    } catch (e) {
      showError(e instanceof Error ? e.message : "Failed to add candidate", "Error");
    } finally {
      setSaving(false);
    }
  };

  const updateJobStatus = async (id: string, status: string) => {
    try {
      await hrmBffFetch(`recruitment/jobs/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      setJobs((prev) => prev.map((j) => (j._id === id || j.id === id ? { ...j, status } : j)));
    } catch (e) {
      showError(e instanceof Error ? e.message : "Update failed", "Error");
    }
  };

  const updateCandidateStage = async (id: string, stage: string) => {
    try {
      await hrmBffFetch(`recruitment/candidates/${id}`, { method: "PATCH", body: JSON.stringify({ stage }) });
      setCandidates((prev) => prev.map((c) => (c._id === id || c.id === id ? { ...c, stage } : c)));
    } catch (e) {
      showError(e instanceof Error ? e.message : "Update failed", "Error");
    }
  };

  const openJobs = jobs.filter((j) => j.status === "open").length;
  const totalCandidates = candidates.length;
  const interviews = candidates.filter((c) => c.stage === "interview").length;

  return (
    <div className="space-y-6">
      <PageHeader title="Recruitment" subtitle="Manage job openings and candidates" />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCardMini label="Open jobs" value={openJobs} />
        <StatCardMini label="Candidates" value={totalCandidates} />
        <StatCardMini label="Interviews" value={interviews} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Jobs column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-semibold text-heading">Job openings</h2>
            <button
              type="button"
              onClick={() => setAddingJob(true)}
              className="rounded-lg bg-primary px-3 py-1.5 text-[12px] font-semibold text-white"
            >
              + Post job
            </button>
          </div>

          {addingJob ? (
            <Panel title="New job">
              <form onSubmit={(e) => void createJob(e)} className="grid gap-3 sm:grid-cols-2">
                <label className="block text-[12px] font-medium text-fg-muted sm:col-span-2">
                  Title *
                  <input
                    value={jTitle}
                    onChange={(e) => setJTitle(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-[var(--input-bg)] px-3 py-2 text-[13px] text-heading outline-none focus:border-primary/40"
                    required
                  />
                </label>
                <label className="block text-[12px] font-medium text-fg-muted">
                  Department
                  <input
                    value={jDept}
                    onChange={(e) => setJDept(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-[var(--input-bg)] px-3 py-2 text-[13px] text-heading outline-none focus:border-primary/40"
                  />
                </label>
                <label className="block text-[12px] font-medium text-fg-muted">
                  Location
                  <input
                    value={jLoc}
                    onChange={(e) => setJLoc(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-[var(--input-bg)] px-3 py-2 text-[13px] text-heading outline-none focus:border-primary/40"
                  />
                </label>
                <label className="block text-[12px] font-medium text-fg-muted">
                  Type
                  <select
                    value={jType}
                    onChange={(e) => setJType(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-[var(--input-bg)] px-3 py-2 text-[13px] text-heading outline-none focus:border-primary/40"
                  >
                    {["full-time", "part-time", "contract", "internship"].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </label>
                <label className="block text-[12px] font-medium text-fg-muted">
                  Openings
                  <input
                    type="number"
                    min={1}
                    value={jOpenings}
                    onChange={(e) => setJOpenings(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-[var(--input-bg)] px-3 py-2 text-[13px] text-heading outline-none focus:border-primary/40"
                  />
                </label>
                <div className="flex gap-2 sm:col-span-2">
                  <button type="submit" disabled={saving} className="rounded-lg bg-primary px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-60">
                    {saving ? "Posting…" : "Post"}
                  </button>
                  <button type="button" onClick={() => setAddingJob(false)} className="rounded-lg border border-border px-4 py-2 text-[13px] font-medium text-fg-muted">
                    Cancel
                  </button>
                </div>
              </form>
            </Panel>
          ) : null}

          {loading ? (
            <p className="text-[13px] text-fg-muted">Loading…</p>
          ) : jobs.length === 0 ? (
            <EmptyState title="No job openings" />
          ) : (
            <ul className="space-y-3">
              {jobs.map((j) => {
                const id = j._id ?? j.id ?? "";
                return (
                  <li key={id} className="rounded-[14px] border border-border/90 bg-surface p-4 shadow-[var(--shadow-card)]">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[14px] font-semibold text-heading">{j.title}</p>
                        <p className="text-[12px] text-fg-muted">
                          {[j.department, j.location, j.type].filter(Boolean).join(" · ")}
                        </p>
                        {j.openings ? (
                          <p className="text-[12px] text-fg-muted">{j.openings} opening(s)</p>
                        ) : null}
                      </div>
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${jobStatusClass(j.status)}`}>
                        {j.status ?? "open"}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {JOB_STAGES.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => void updateJobStatus(id, s)}
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize transition ${
                            j.status === s
                              ? "bg-primary text-white"
                              : "border border-border text-fg-muted hover:bg-elevated"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Candidates column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-semibold text-heading">Candidates</h2>
            <button
              type="button"
              onClick={() => setAddingCandidate(true)}
              className="rounded-lg bg-primary px-3 py-1.5 text-[12px] font-semibold text-white"
            >
              + Add candidate
            </button>
          </div>

          {addingCandidate ? (
            <Panel title="New candidate">
              <form onSubmit={(e) => void createCandidate(e)} className="grid gap-3 sm:grid-cols-2">
                <label className="block text-[12px] font-medium text-fg-muted">
                  Name *
                  <input
                    value={cName}
                    onChange={(e) => setCName(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-[var(--input-bg)] px-3 py-2 text-[13px] text-heading outline-none focus:border-primary/40"
                    required
                  />
                </label>
                <label className="block text-[12px] font-medium text-fg-muted">
                  Email
                  <input
                    type="email"
                    value={cEmail}
                    onChange={(e) => setCEmail(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-[var(--input-bg)] px-3 py-2 text-[13px] text-heading outline-none focus:border-primary/40"
                  />
                </label>
                <label className="block text-[12px] font-medium text-fg-muted">
                  Phone
                  <input
                    value={cPhone}
                    onChange={(e) => setCPhone(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-[var(--input-bg)] px-3 py-2 text-[13px] text-heading outline-none focus:border-primary/40"
                  />
                </label>
                <label className="block text-[12px] font-medium text-fg-muted">
                  Job
                  <select
                    value={cJobId}
                    onChange={(e) => setCJobId(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-[var(--input-bg)] px-3 py-2 text-[13px] text-heading outline-none focus:border-primary/40"
                  >
                    <option value="">— select job —</option>
                    {jobs.map((j) => (
                      <option key={j._id ?? j.id} value={j._id ?? j.id}>{j.title}</option>
                    ))}
                  </select>
                </label>
                <div className="flex gap-2 sm:col-span-2">
                  <button type="submit" disabled={saving} className="rounded-lg bg-primary px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-60">
                    {saving ? "Adding…" : "Add"}
                  </button>
                  <button type="button" onClick={() => setAddingCandidate(false)} className="rounded-lg border border-border px-4 py-2 text-[13px] font-medium text-fg-muted">
                    Cancel
                  </button>
                </div>
              </form>
            </Panel>
          ) : null}

          {loading ? (
            <p className="text-[13px] text-fg-muted">Loading…</p>
          ) : candidates.length === 0 ? (
            <EmptyState title="No candidates yet" />
          ) : (
            <ul className="space-y-3">
              {candidates.map((c) => {
                const id = c._id ?? c.id ?? "";
                return (
                  <li key={id} className="rounded-[14px] border border-border/90 bg-surface p-4 shadow-[var(--shadow-card)]">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[14px] font-semibold text-heading">{c.name}</p>
                        <p className="text-[12px] text-fg-muted">
                          {[c.email, c.phone].filter(Boolean).join(" · ")}
                        </p>
                        {c.jobTitle ? (
                          <p className="text-[12px] text-fg-muted">Applied for: {c.jobTitle}</p>
                        ) : null}
                      </div>
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${candidateStageClass(c.stage)}`}>
                        {c.stage ?? "applied"}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {CANDIDATE_STAGES.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => void updateCandidateStage(id, s)}
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize transition ${
                            c.stage === s
                              ? "bg-primary text-white"
                              : "border border-border text-fg-muted hover:bg-elevated"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
