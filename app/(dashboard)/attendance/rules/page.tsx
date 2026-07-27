import { RequirePermission } from "@/features/auth";
import { AttendanceRulesView } from "@/widgets/attendance-rules";
import { HRM_PERMISSIONS } from "@/shared/permissions";

export default function AttendanceRulesPage() {
  return (
    <RequirePermission permission={HRM_PERMISSIONS.ATTENDANCE_WRITE}>
      <AttendanceRulesView />
    </RequirePermission>
  );
}
