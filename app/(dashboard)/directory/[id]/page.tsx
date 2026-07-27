import { RequirePermission } from "@/features/auth";
import { DirectoryDetailView } from "@/widgets/directory";
import { HRM_PERMISSIONS } from "@/shared/permissions";

type Props = { params: Promise<{ id: string }> };

export default async function DirectoryDetailPage({ params }: Props) {
  const { id } = await params;
  return (
    <RequirePermission permission={HRM_PERMISSIONS.DIRECTORY}>
      <DirectoryDetailView id={id} />
    </RequirePermission>
  );
}
