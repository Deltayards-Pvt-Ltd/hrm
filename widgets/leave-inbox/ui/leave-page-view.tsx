"use client";

import { useAuth } from "@/features/auth";
import { LeaveInboxView } from "@/widgets/leave-inbox/ui/leave-inbox-view";
import { LeaveSelfServicePanel } from "@/widgets/leave-inbox/ui/leave-self-service-panel";
import { HRM_PERMISSIONS, hasPermission } from "@/shared/permissions";

export function LeavePageView() {
  const { user } = useAuth();
  const isHr = hasPermission(user, HRM_PERMISSIONS.LEAVE_HR);

  return (
    <div className="space-y-8">
      <LeaveSelfServicePanel />
      {isHr ? (
        <section>
          <h2 className="mb-4 text-[18px] font-semibold text-heading">HR leave inbox</h2>
          <LeaveInboxView />
        </section>
      ) : null}
    </div>
  );
}
