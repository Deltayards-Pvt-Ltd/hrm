import type { ComponentType } from "react";
import { en } from "@/shared/i18n";
import { HRM_PERMISSIONS } from "@/shared/permissions";
import {
  IconAnnouncements,
  IconBuilding,
  IconCalendar,
  IconClock,
  IconDirectory,
  IconDocuments,
  IconHome,
  IconOffboarding,
  IconOnboarding,
  IconOrg,
  IconPayroll,
  IconPerformance,
  IconRecruitment,
  IconReimbursement,
  IconUser,
  IconUsers,
} from "@/shared/ui/nav-icons";

export type NavLinkConfig = {
  type: "link";
  id: string;
  href: string;
  label: string;
  Icon: ComponentType<{ className?: string }>;
  showLeaveBadge?: boolean;
  /** Single required permission */
  permission?: string;
  /** Any of these permissions unlocks the item */
  anyOf?: string[];
  /** Always visible once user has any HRM access */
  selfService?: boolean;
};

export type NavGroupConfig = {
  type: "group";
  id: string;
  label: string;
  Icon: ComponentType<{ className?: string }>;
  children: Array<{
    id: string;
    href: string;
    label: string;
    permission?: string;
    anyOf?: string[];
    selfService?: boolean;
  }>;
  anyOf?: string[];
  permission?: string;
};

export type NavItemConfig = NavLinkConfig | NavGroupConfig;

export function isNavGroup(item: NavItemConfig): item is NavGroupConfig {
  return item.type === "group";
}

export const hrmNavItems: NavItemConfig[] = [
  {
    type: "link",
    id: "home",
    href: "/",
    label: en.nav.home,
    Icon: IconHome,
    selfService: true,
  },
  {
    type: "link",
    id: "employees",
    href: "/employees",
    label: en.nav.employees,
    Icon: IconUsers,
    permission: HRM_PERMISSIONS.EMPLOYEES_READ,
  },
  {
    type: "group",
    id: "attendance",
    label: en.nav.attendance,
    Icon: IconClock,
    anyOf: [
      HRM_PERMISSIONS.ATTENDANCE_READ,
      HRM_PERMISSIONS.ATTENDANCE_WRITE,
      HRM_PERMISSIONS.WEEKOFF_HR,
      "attendance:read",
      HRM_PERMISSIONS.ACCESS,
    ],
    children: [
      {
        id: "attendance-overview",
        href: "/attendance",
        label: en.nav.attendanceOverview,
        anyOf: [
          HRM_PERMISSIONS.ATTENDANCE_READ,
          "attendance:read",
          HRM_PERMISSIONS.ACCESS,
        ],
        selfService: true,
      },
      {
        id: "attendance-manual-entry",
        href: "/attendance/manual-entry",
        label: en.nav.attendanceManualEntry,
        anyOf: [HRM_PERMISSIONS.ATTENDANCE_WRITE, "attendance:read"],
      },
      {
        id: "attendance-rules",
        href: "/attendance/rules",
        label: en.nav.attendanceRules,
        permission: HRM_PERMISSIONS.ATTENDANCE_WRITE,
      },
      {
        id: "attendance-week-off-swaps",
        href: "/attendance/week-off-swaps",
        label: en.nav.attendanceWeekOffSwaps,
        anyOf: [HRM_PERMISSIONS.WEEKOFF_HR, HRM_PERMISSIONS.ACCESS],
        selfService: true,
      },
    ],
  },
  {
    type: "link",
    id: "leave",
    href: "/leave",
    label: en.nav.leave,
    Icon: IconCalendar,
    showLeaveBadge: true,
    anyOf: [HRM_PERMISSIONS.LEAVE_HR, HRM_PERMISSIONS.LEAVE_TL, HRM_PERMISSIONS.ACCESS],
    selfService: true,
  },
  {
    type: "group",
    id: "payroll",
    label: en.nav.payroll,
    Icon: IconPayroll,
    anyOf: [HRM_PERMISSIONS.PAYROLL_READ, HRM_PERMISSIONS.PAYROLL_RUN, HRM_PERMISSIONS.ACCESS],
    children: [
      {
        id: "payroll-list",
        href: "/payroll/list",
        label: en.nav.payrollPayList,
        anyOf: [HRM_PERMISSIONS.PAYROLL_READ, HRM_PERMISSIONS.PAYROLL_RUN],
      },
      {
        id: "payroll-payslip",
        href: "/payroll/payslip",
        label: en.nav.payrollPayslip,
        anyOf: [HRM_PERMISSIONS.PAYROLL_READ, HRM_PERMISSIONS.ACCESS],
        selfService: true,
      },
    ],
  },
  {
    type: "link",
    id: "org-chart",
    href: "/org-chart",
    label: en.nav.orgChart,
    Icon: IconOrg,
    anyOf: [HRM_PERMISSIONS.ORG_CHART_READ, HRM_PERMISSIONS.ORG_CHART_WRITE, HRM_PERMISSIONS.ACCESS],
    selfService: true,
  },
  {
    type: "link",
    id: "departments",
    href: "/departments",
    label: en.nav.departments,
    Icon: IconBuilding,
    permission: HRM_PERMISSIONS.DEPARTMENTS,
  },
  {
    type: "link",
    id: "users",
    href: "/users",
    label: en.nav.users,
    Icon: IconUsers,
    permission: HRM_PERMISSIONS.USERS,
  },
  {
    type: "link",
    id: "directory",
    href: "/directory",
    label: en.nav.directory,
    Icon: IconDirectory,
    permission: HRM_PERMISSIONS.DIRECTORY,
  },
  {
    type: "link",
    id: "onboarding",
    href: "/onboarding",
    label: en.nav.onboarding,
    Icon: IconOnboarding,
    permission: HRM_PERMISSIONS.ONBOARDING,
  },
  {
    type: "link",
    id: "offboarding",
    href: "/offboarding",
    label: en.nav.offboarding,
    Icon: IconOffboarding,
    permission: HRM_PERMISSIONS.OFFBOARDING,
  },
  {
    type: "link",
    id: "reimbursements",
    href: "/reimbursements",
    label: en.nav.reimbursements,
    Icon: IconReimbursement,
    anyOf: [HRM_PERMISSIONS.REIMBURSEMENT_SELF, HRM_PERMISSIONS.REIMBURSEMENT_HR, HRM_PERMISSIONS.ACCESS],
    selfService: true,
  },
  {
    type: "link",
    id: "recruitment",
    href: "/recruitment",
    label: en.nav.recruitment,
    Icon: IconRecruitment,
    permission: HRM_PERMISSIONS.RECRUITMENT,
  },
  {
    type: "link",
    id: "performance",
    href: "/performance",
    label: en.nav.performance,
    Icon: IconPerformance,
    anyOf: [HRM_PERMISSIONS.PERFORMANCE, HRM_PERMISSIONS.PERFORMANCE_REVIEW, HRM_PERMISSIONS.ACCESS],
    selfService: true,
  },
  {
    type: "link",
    id: "announcements",
    href: "/announcements",
    label: en.nav.announcements,
    Icon: IconAnnouncements,
    anyOf: [HRM_PERMISSIONS.ANNOUNCEMENTS_READ, HRM_PERMISSIONS.ANNOUNCEMENTS_WRITE, HRM_PERMISSIONS.ACCESS],
    selfService: true,
  },
  {
    type: "link",
    id: "documents",
    href: "/documents",
    label: en.nav.documents,
    Icon: IconDocuments,
    anyOf: [HRM_PERMISSIONS.DOCUMENTS_READ, HRM_PERMISSIONS.DOCUMENTS_WRITE, HRM_PERMISSIONS.ACCESS],
    selfService: true,
  },
  {
    type: "link",
    id: "profile",
    href: "/profile",
    label: en.nav.profile,
    Icon: IconUser,
    selfService: true,
  },
];
