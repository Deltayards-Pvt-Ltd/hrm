import { hrmBffFetch } from "@/lib/api/hrm-bff";

export type WeekOffSwapRequest = {
  _id: string;
  user: { _id: string; name?: string; email?: string } | string;
  fromDate: string;
  toDate: string;
  weekKey: string;
  reason?: string;
  status: string;
  hrComment?: string;
  createdAt?: string;
};

export async function fetchHrWeekOffSwapApprovals(): Promise<WeekOffSwapRequest[]> {
  const res = await hrmBffFetch<{ requests: WeekOffSwapRequest[] }>(
    "week-off-swap/approvals/hr",
  );
  return res.requests ?? [];
}

export async function hrApproveWeekOffSwap(id: string, comment?: string) {
  return hrmBffFetch(`week-off-swap/requests/${id}/hr-approve`, {
    method: "POST",
    body: JSON.stringify({ comment: comment || "" }),
  });
}

export async function hrRejectWeekOffSwap(id: string, comment?: string) {
  return hrmBffFetch(`week-off-swap/requests/${id}/hr-reject`, {
    method: "POST",
    body: JSON.stringify({ comment: comment || "" }),
  });
}

export async function fetchMyWeekOffSwapRequests(): Promise<WeekOffSwapRequest[]> {
  const res = await hrmBffFetch<{ requests: WeekOffSwapRequest[] }>(
    "week-off-swap/requests/mine",
  );
  return res.requests ?? [];
}

export async function createWeekOffSwapRequest(body: {
  fromDate: string;
  toDate: string;
  reason?: string;
}) {
  return hrmBffFetch("week-off-swap/requests", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function cancelWeekOffSwapRequest(id: string) {
  return hrmBffFetch(`week-off-swap/requests/${id}`, { method: "DELETE" });
}
