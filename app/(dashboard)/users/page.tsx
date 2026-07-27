import { RequirePermission } from "@/features/auth";
import { UsersView } from "@/widgets/users";
import { HRM_PERMISSIONS } from "@/shared/permissions";

export default function UsersPage() {
  return (
    <RequirePermission permission={HRM_PERMISSIONS.USERS}>
      <UsersView />
    </RequirePermission>
  );
}
