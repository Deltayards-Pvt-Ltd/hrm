import { RequirePermission } from "@/features/auth";
import { PayListView } from "@/widgets/payroll";
import { HRM_PERMISSIONS } from "@/shared/permissions";

export default function PayListPage() {
  return (
    <RequirePermission
      anyOf={[HRM_PERMISSIONS.PAYROLL_READ, HRM_PERMISSIONS.PAYROLL_RUN]}
    >
      <PayListView />
    </RequirePermission>
  );
}
