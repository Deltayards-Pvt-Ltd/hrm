import { RequirePermission } from "@/features/auth";
import { EmployeeListTable } from "@/features/employees/list/ui/employee-list-table";
import { HRM_PERMISSIONS } from "@/shared/permissions";

export default function EmployeesPage() {
  return (
    <RequirePermission permission={HRM_PERMISSIONS.EMPLOYEES_READ}>
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Employees</h1>
        <EmployeeListTable />
      </div>
    </RequirePermission>
  );
}
