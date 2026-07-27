import { RequirePermission } from "@/features/auth";
import { DepartmentsView } from "@/widgets/departments";
import { HRM_PERMISSIONS } from "@/shared/permissions";

export default function DepartmentsPage() {
  return (
    <RequirePermission permission={HRM_PERMISSIONS.DEPARTMENTS}>
      <DepartmentsView />
    </RequirePermission>
  );
}
