import { hrmBffFetch } from "@/lib/api/hrm-bff";

export type HrmProjectOption = {
  id: string;
  name: string;
};

/** deltadb `GET /api/hrm/projects` — active CRM projects for attendance/leave filters. */
export async function fetchHrmProjects(): Promise<HrmProjectOption[]> {
  const res = await hrmBffFetch<{ projects?: HrmProjectOption[] }>("projects");
  const list = Array.isArray(res.projects) ? res.projects : [];
  return list
    .filter((p) => p?.id)
    .map((p) => ({ id: String(p.id), name: p.name || String(p.id) }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
