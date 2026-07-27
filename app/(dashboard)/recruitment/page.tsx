import { RequirePermission } from "@/features/auth";
import { RecruitmentView } from "@/widgets/recruitment";
import { HRM_PERMISSIONS } from "@/shared/permissions";

export default function RecruitmentPage() {
  return (
    <RequirePermission permission={HRM_PERMISSIONS.RECRUITMENT}>
      <RecruitmentView />
    </RequirePermission>
  );
}
