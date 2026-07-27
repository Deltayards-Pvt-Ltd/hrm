import { RequirePermission } from "@/features/auth";
import { DirectoryView } from "@/widgets/directory";
import { HRM_PERMISSIONS } from "@/shared/permissions";

export default function DirectoryPage() {
  return (
    <RequirePermission permission={HRM_PERMISSIONS.DIRECTORY}>
      <DirectoryView />
    </RequirePermission>
  );
}
