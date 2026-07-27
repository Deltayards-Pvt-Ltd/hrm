/** Permission strings aligned with deltadb `constants/hrmPermissions.js`. */
export const HRM_PERMISSIONS = {
  ACCESS: "hrm:access",
  EMPLOYEES_READ: "hrm:employees:read",
  EMPLOYEES_WRITE: "hrm:employees:write",
  ATTENDANCE_READ: "hrm:attendance:read",
  ATTENDANCE_WRITE: "hrm:attendance:write",
  LEAVE_HR: "hrm:leave:hr",
  LEAVE_TL: "hrm:leave:tl",
  WEEKOFF_HR: "hrm:weekoff:hr",
  PAYROLL_READ: "hrm:payroll:read",
  PAYROLL_RUN: "hrm:payroll:run",
  HOLIDAYS_WRITE: "hrm:holidays:write",
  AUDIT_READ: "hrm:audit:read",
  DEPARTMENTS: "hrm:departments",
  ORG_CHART_READ: "hrm:org_chart:read",
  ORG_CHART_WRITE: "hrm:org_chart:write",
  DIRECTORY: "hrm:directory",
  USERS: "hrm:users",
  ONBOARDING: "hrm:onboarding",
  OFFBOARDING: "hrm:offboarding",
  REIMBURSEMENT_SELF: "hrm:reimbursement:self",
  REIMBURSEMENT_HR: "hrm:reimbursement:hr",
  RECRUITMENT: "hrm:recruitment",
  PERFORMANCE: "hrm:performance",
  PERFORMANCE_REVIEW: "hrm:performance:review",
  ANNOUNCEMENTS_READ: "hrm:announcements:read",
  ANNOUNCEMENTS_WRITE: "hrm:announcements:write",
  DOCUMENTS_READ: "hrm:documents:read",
  DOCUMENTS_WRITE: "hrm:documents:write",
} as const;

export type HrmPermission = (typeof HRM_PERMISSIONS)[keyof typeof HRM_PERMISSIONS];

export const HRM_PERMISSION_LIST = Object.values(HRM_PERMISSIONS);

export type PermissionSubject = {
  role?: string | null;
  level?: number | null;
  permissions?: string[] | null;
};

function isPlatformAdmin(user: PermissionSubject | null | undefined): boolean {
  if (!user) return false;
  const role = String(user.role || "").toLowerCase();
  return role === "superadmin" || user.level === 1;
}

export function hasPermission(
  user: PermissionSubject | null | undefined,
  key: string,
): boolean {
  if (!user) return false;
  if (isPlatformAdmin(user)) return true;
  const perms = user.permissions ?? [];
  return perms.includes(key);
}

export function hasAnyPermission(
  user: PermissionSubject | null | undefined,
  keys: string[],
): boolean {
  if (!user) return false;
  if (isPlatformAdmin(user)) return true;
  return keys.some((k) => (user.permissions ?? []).includes(k));
}

/** Enter HRM app: `hrm:access` or any `hrm:*` key, or platform admin. */
export function hasAnyHrmAccess(user: PermissionSubject | null | undefined): boolean {
  if (!user) return false;
  if (isPlatformAdmin(user)) return true;
  const perms = user.permissions ?? [];
  if (perms.includes(HRM_PERMISSIONS.ACCESS)) return true;
  return perms.some((p) => typeof p === "string" && p.startsWith("hrm:"));
}

export type NavPermissionGate = {
  permission?: string;
  anyOf?: string[];
};

export function canAccessNavItem(
  user: PermissionSubject | null | undefined,
  gate: NavPermissionGate | undefined,
): boolean {
  if (!gate) return hasAnyHrmAccess(user);
  if (gate.anyOf?.length) return hasAnyPermission(user, gate.anyOf);
  if (gate.permission) return hasPermission(user, gate.permission);
  return hasAnyHrmAccess(user);
}
