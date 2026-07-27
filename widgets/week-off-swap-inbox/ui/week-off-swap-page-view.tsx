"use client";

import { useAuth } from "@/features/auth";
import { HRM_PERMISSIONS, hasPermission } from "@/shared/permissions";
import { WeekOffSwapInboxView } from "@/widgets/week-off-swap-inbox/ui/week-off-swap-inbox-view";
import { WeekOffSelfServicePanel } from "@/widgets/week-off-swap-inbox/ui/week-off-self-service-panel";

export function WeekOffSwapPageView() {
  const { user } = useAuth();
  const isHr = hasPermission(user, HRM_PERMISSIONS.WEEKOFF_HR);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <WeekOffSelfServicePanel />
      {isHr ? <WeekOffSwapInboxView /> : null}
    </div>
  );
}
