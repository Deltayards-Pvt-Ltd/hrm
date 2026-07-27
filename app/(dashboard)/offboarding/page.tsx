import { RequirePermission } from "@/features/auth";
import { OffboardingView } from "@/widgets/offboarding";
import { HRM_PERMISSIONS } from "@/shared/permissions";

export default function OffboardingPage() {
  return (
    <RequirePermission permission={HRM_PERMISSIONS.OFFBOARDING}>
      <OffboardingView />
    </RequirePermission>
  );
}
