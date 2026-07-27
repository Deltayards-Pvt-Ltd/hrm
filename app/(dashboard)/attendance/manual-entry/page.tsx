import { RequirePermission } from "@/features/auth";
import { ManualEntryView } from "@/features/attendance";
import { HRM_PERMISSIONS } from "@/shared/permissions";

export default function AttendanceManualEntryPage() {
  return (
    <RequirePermission
      anyOf={[HRM_PERMISSIONS.ATTENDANCE_WRITE, "attendance:read"]}
    >
      <ManualEntryView />
    </RequirePermission>
  );
}
