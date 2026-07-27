import { EmployeeDetailGate } from "./employee-detail-gate";

type EmployeeDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EmployeeDetailPage({
  params,
}: EmployeeDetailPageProps) {
  const { id } = await params;
  return <EmployeeDetailGate id={id} />;
}
