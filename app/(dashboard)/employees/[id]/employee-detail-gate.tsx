"use client";

import { RequirePermission } from "@/features/auth";
import { EmployeeViewSheet } from "@/features/employees";
import { HRM_PERMISSIONS } from "@/shared/permissions";

export function EmployeeDetailGate({ id }: { id: string }) {
  return (
    <RequirePermission permission={HRM_PERMISSIONS.EMPLOYEES_READ}>
      <div className="mx-auto max-w-3xl">
        <EmployeeViewSheet id={id} />
      </div>
    </RequirePermission>
  );
}
