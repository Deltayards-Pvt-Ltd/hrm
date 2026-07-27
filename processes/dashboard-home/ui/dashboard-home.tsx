import { isApiConfigured } from "@/shared/config";
import { DashboardPageView } from "@/widgets/hrm-dashboard";

export function DashboardHome() {
  return <DashboardPageView apiConfigured={isApiConfigured()} />;
}
