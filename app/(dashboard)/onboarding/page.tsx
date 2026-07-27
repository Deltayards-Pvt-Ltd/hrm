import { RequirePermission } from "@/features/auth";
import { OnboardingView } from "@/widgets/onboarding";
import { HRM_PERMISSIONS } from "@/shared/permissions";

export default function OnboardingPage() {
  return (
    <RequirePermission permission={HRM_PERMISSIONS.ONBOARDING}>
      <OnboardingView />
    </RequirePermission>
  );
}
