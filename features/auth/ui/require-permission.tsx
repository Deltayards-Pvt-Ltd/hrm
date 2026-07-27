"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/features/auth/model/auth-provider";
import { hasAnyPermission, hasPermission } from "@/shared/permissions";

type Props = {
  permission?: string;
  anyOf?: string[];
  children: ReactNode;
  fallbackHref?: string;
};

/**
 * Page-level permission gate. Redirects to dashboard (or fallback) when denied.
 */
export function RequirePermission({
  permission,
  anyOf,
  children,
  fallbackHref = "/",
}: Props) {
  const { user, isBootstrapping, isAuthenticated } = useAuth();
  const router = useRouter();

  const ok =
    (anyOf?.length ? hasAnyPermission(user, anyOf) : true) &&
    (permission ? hasPermission(user, permission) : true);

  useEffect(() => {
    if (isBootstrapping || !isAuthenticated) return;
    if (!ok) router.replace(fallbackHref);
  }, [isBootstrapping, isAuthenticated, ok, router, fallbackHref]);

  if (isBootstrapping || !isAuthenticated || !ok) {
    return (
      <div className="flex min-h-[30vh] flex-col items-center justify-center gap-3 text-fg-muted">
        <Loader2 className="h-7 w-7 animate-spin text-primary" aria-hidden />
        <p className="text-sm font-medium">Checking access…</p>
      </div>
    );
  }

  return <>{children}</>;
}
