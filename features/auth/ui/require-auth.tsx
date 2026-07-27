"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/features/auth/model/auth-provider";
import { hasAnyHrmAccess } from "@/shared/permissions";

/**
 * Protects dashboard routes: must be authenticated and have HRM access.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, isBootstrapping, user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const allowed = hasAnyHrmAccess(user);

  useEffect(() => {
    if (isBootstrapping) return;
    if (!isAuthenticated) {
      const next = pathname ? `?next=${encodeURIComponent(pathname)}` : "";
      router.replace(`/login${next}`);
      return;
    }
    if (!allowed) {
      void (async () => {
        await logout();
        router.replace("/login?error=no_hrm_access");
      })();
    }
  }, [isBootstrapping, isAuthenticated, allowed, router, pathname, logout]);

  if (isBootstrapping || !isAuthenticated || !allowed) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-fg-muted">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
        <p className="text-sm font-medium">Checking session…</p>
      </div>
    );
  }

  return <>{children}</>;
}
