"use client";

import { Suspense } from "react";
import { useAuth } from "@/features/auth";
import { HRM_PERMISSIONS, hasAnyPermission } from "@/shared/permissions";
import { EmployeeAttendanceView } from "@/widgets/employee-attendance/ui/employee-attendance-view";
import { MyAttendancePanel } from "@/widgets/employee-attendance/ui/my-attendance-panel";

export function AttendancePageView() {
  const { user } = useAuth();
  // HRM portal key OR legacy CRM attendance admin key
  const canAdmin = hasAnyPermission(user, [
    HRM_PERMISSIONS.ATTENDANCE_READ,
    "attendance:read",
  ]);

  return (
    <div className="space-y-8">
      <MyAttendancePanel />
      {canAdmin ? (
        <Suspense fallback={null}>
          <EmployeeAttendanceView />
        </Suspense>
      ) : null}
    </div>
  );
}
