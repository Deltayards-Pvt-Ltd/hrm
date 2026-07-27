import { apiFetch } from "@/shared/api";
import type { AttendanceAdminAllResponse } from "@/entities/attendance/model/types";
import { combineDateAndTimeToIso } from "@/entities/attendance/lib/time-parse";

function localYmd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** IST day bounds for a calendar date picked in the UI (company timezone). */
function istDayUtcRange(d: Date): { from: Date; to: Date } {
  const ymd = localYmd(d);
  const startIso = combineDateAndTimeToIso(ymd, "00:00", "Asia/Kolkata");
  const endIso = combineDateAndTimeToIso(ymd, "23:59", "Asia/Kolkata");
  if (startIso && endIso) {
    return { from: new Date(startIso), to: new Date(endIso) };
  }
  const from = new Date(d);
  from.setHours(0, 0, 0, 0);
  const to = new Date(d);
  to.setHours(23, 59, 59, 999);
  return { from, to };
}

function startOfLocalDay(d: Date): Date {
  return istDayUtcRange(d).from;
}

function endOfLocalDay(d: Date): Date {
  return istDayUtcRange(d).to;
}

export type AttendanceDateFilter =
  | { kind: "day"; day: Date }
  | { kind: "range"; from: Date; to: Date };

export type FetchAttendanceAdminAllParams = {
  filter: AttendanceDateFilter;
  page?: number;
  /** Default 200 for a single day, 500 for ranges (override if your API caps lower). */
  limit?: number;
  /** Restrict to these user ids (e.g. monthly matrix page). */
  userIds?: string[];
  /** Scope roster to a CRM project team (deltadb `projectId`). */
  projectId?: string;
};

/**
 * HR admin: all users' attendance for a calendar day or local date range
 * (deltadb `GET /api/attendance/admin/all` with `startDate` / `endDate`).
 */
export async function fetchAttendanceAdminAll(
  params: FetchAttendanceAdminAllParams,
  init?: RequestInit,
): Promise<AttendanceAdminAllResponse> {
  const { filter, page = 1, userIds, projectId } = params;
  const defaultLimit = filter.kind === "range" ? 500 : 200;
  const limit = params.limit ?? defaultLimit;

  let start: Date;
  let end: Date;
  if (filter.kind === "day") {
    start = startOfLocalDay(filter.day);
    end = endOfLocalDay(filter.day);
  } else {
    start = startOfLocalDay(filter.from);
    end = endOfLocalDay(filter.to);
    if (start.getTime() > end.getTime()) {
      end = endOfLocalDay(filter.from);
      start = startOfLocalDay(filter.to);
    }
  }

  const qs = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  // Prefer calendar `date=` for single day — matches Attendance.date IST day keys exactly
  if (filter.kind === "day") {
    qs.set("date", localYmd(filter.day));
  } else {
    qs.set("startDate", start.toISOString());
    qs.set("endDate", end.toISOString());
  }

  if (userIds?.length) {
    qs.set("userIds", userIds.join(","));
  }
  if (projectId) {
    qs.set("projectId", projectId);
  }
  return apiFetch<AttendanceAdminAllResponse>(`/api/attendance/admin/all?${qs.toString()}`, init);
}

/**
 * Load every attendance record for a day/range (paginates until exhausted).
 * Use for daily log so "today" isn't truncated at page 1 / limit 25.
 */
export async function fetchAttendanceAdminAllPages(
  params: Omit<FetchAttendanceAdminAllParams, "page" | "limit"> & { pageLimit?: number },
  init?: RequestInit,
): Promise<AttendanceAdminAllResponse> {
  const pageLimit = params.pageLimit ?? 500;
  const first = await fetchAttendanceAdminAll(
    { ...params, page: 1, limit: pageLimit },
    init,
  );
  const attendance = [...first.attendance];
  const totalPages = Math.max(1, first.pagination?.totalPages ?? 1);
  for (let page = 2; page <= totalPages; page++) {
    const res = await fetchAttendanceAdminAll(
      { ...params, page, limit: pageLimit },
      init,
    );
    attendance.push(...res.attendance);
    if (!res.attendance.length) break;
  }
  return {
    ...first,
    attendance,
    pagination: {
      ...first.pagination,
      page: 1,
      limit: attendance.length || pageLimit,
      total: attendance.length || first.pagination?.total || 0,
      totalPages: 1,
    },
    summary: {
      ...first.summary,
      total: attendance.length || first.summary?.total || 0,
    },
  };
}

/** IST calendar month bounds for matrix punch fetch (aligns with summary API). */
export function istMonthDateRange(year: number, month: number): { from: Date; to: Date } {
  const dim = new Date(year, month + 1, 0).getDate();
  const ymd = (d: number) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const startIso = combineDateAndTimeToIso(ymd(1), "00:00", "Asia/Kolkata");
  const endIso = combineDateAndTimeToIso(ymd(dim), "23:59", "Asia/Kolkata");
  if (!startIso || !endIso) {
    const from = new Date(year, month, 1);
    const to = new Date(year, month + 1, 0, 23, 59, 59, 999);
    return { from, to };
  }
  return { from: new Date(startIso), to: new Date(endIso) };
}

export type LiveAttendanceUser = {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  mobile?: string;
  role?: string;
  level?: string | number;
};

export type LiveAttendanceDashboard = {
  date: string;
  dateRange: { startDate: string; endDate: string } | null;
  projectId: string | null;
  summary: {
    totalUsers: number;
    checkedIn: number;
    checkedOut: number;
    absent: number;
    onBreak: number;
  };
  checkedInUsers: Array<{
    user?: LiveAttendanceUser | null;
    checkInTime?: string;
    checkInAddress?: string | null;
    checkInSelfie?: string | null;
    hoursWorked?: string | number;
    isOnBreak?: boolean;
  }>;
  checkedOutUsers: Array<{
    user?: LiveAttendanceUser | null;
    checkInTime?: string;
    checkOutTime?: string;
    checkInAddress?: string | null;
    checkOutAddress?: string | null;
    totalHours?: number;
  }>;
  absentUsers: LiveAttendanceUser[];
};

/**
 * Real-time attendance dashboard (CRM + HRM).
 * deltadb `GET /api/attendance/admin/live?startDate&endDate&projectId`
 */
export async function fetchLiveAttendanceDashboard(params?: {
  /** YYYY-MM-DD calendar day (IST-aligned via startDate/endDate). */
  date?: string;
  projectId?: string;
}): Promise<LiveAttendanceDashboard> {
  const qs = new URLSearchParams();
  if (params?.date) {
    qs.set("startDate", params.date);
    qs.set("endDate", params.date);
  }
  if (params?.projectId) qs.set("projectId", params.projectId);
  const q = qs.toString();
  return apiFetch<LiveAttendanceDashboard>(`/api/attendance/admin/live${q ? `?${q}` : ""}`);
}

/**
 * Matrix punches: same endpoint as daily log, but full IST month — no `userIds` filter.
 * (Filtering by page userIds + limit=100 was dropping rows like today's check-in.)
 */
export async function fetchAttendancePunchesForMatrix(params: {
  year: number;
  month: number;
  projectId?: string;
}): Promise<AttendanceAdminAllResponse> {
  const { from, to } = istMonthDateRange(params.year, params.month);
  const pageLimit = 5000;
  const projectId = params.projectId;

  const first = await fetchAttendanceAdminAll({
    filter: { kind: "range", from, to },
    page: 1,
    limit: pageLimit,
    projectId,
  });

  const attendance = [...first.attendance];
  const totalPages = Math.max(1, first.pagination.totalPages ?? 1);
  for (let page = 2; page <= totalPages; page++) {
    const res = await fetchAttendanceAdminAll({
      filter: { kind: "range", from, to },
      page,
      limit: pageLimit,
      projectId,
    });
    attendance.push(...res.attendance);
    if (!res.attendance.length) break;
  }

  return {
    ...first,
    attendance,
    pagination: {
      ...first.pagination,
      page: 1,
      total: attendance.length,
    },
  };
}

/** Optional: load one employee's month (e.g. debugging) — uses a safe limit, not 100. */
export async function fetchAttendancePunchesForUserMonth(
  userId: string,
  year: number,
  month: number,
): Promise<AttendanceAdminAllResponse> {
  const { from, to } = istMonthDateRange(year, month);
  const days = new Date(year, month + 1, 0).getDate();
  const limit = Math.min(5000, Math.max(500, days * 4));
  return fetchAttendanceAdminAll({
    filter: { kind: "range", from, to },
    page: 1,
    limit,
    userIds: [userId],
  });
}
