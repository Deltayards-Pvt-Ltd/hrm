"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchHrLeaveApprovals } from "@/entities/leave";
import { useAuth } from "@/features/auth";
import { HRM_PERMISSIONS, hasPermission } from "@/shared/permissions";

let sharedCount = 0;
let fetchInFlight: Promise<void> | null = null;
const listeners = new Set<() => void>();

function notifyListeners() {
  for (const fn of listeners) fn();
}

async function loadPendingCount() {
  if (fetchInFlight) return fetchInFlight;
  fetchInFlight = (async () => {
    try {
      const res = await fetchHrLeaveApprovals();
      sharedCount = res.data?.length ?? 0;
      notifyListeners();
    } catch {
      sharedCount = 0;
      notifyListeners();
    } finally {
      fetchInFlight = null;
    }
  })();
  return fetchInFlight;
}

/**
 * HR leave approval badge count — only loads when user has `hrm:leave:hr`.
 */
export function useLeavePendingCount() {
  const { user } = useAuth();
  const canHr = hasPermission(user, HRM_PERMISSIONS.LEAVE_HR);
  const [count, setCount] = useState(canHr ? sharedCount : 0);

  const refresh = useCallback(async () => {
    if (!canHr) {
      sharedCount = 0;
      notifyListeners();
      return;
    }
    await loadPendingCount();
  }, [canHr]);

  useEffect(() => {
    const sync = () => setCount(canHr ? sharedCount : 0);
    listeners.add(sync);
    sync();
    if (canHr) void loadPendingCount();
    return () => {
      listeners.delete(sync);
    };
  }, [canHr]);

  return { count: canHr ? count : 0, refresh };
}
