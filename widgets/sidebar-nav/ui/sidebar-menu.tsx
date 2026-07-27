"use client";

import { useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/features/auth";
import {
  canAccessNavItem,
  hasAnyHrmAccess,
  hasPermission,
} from "@/shared/permissions";
import {
  hrmNavItems,
  isNavGroup,
  type NavGroupConfig,
  type NavItemConfig,
  type NavLinkConfig,
} from "@/widgets/sidebar-nav/config/hrm-nav";
import { isNavHrefActive } from "@/widgets/sidebar-nav/lib/is-nav-active";
import { NavCollapse } from "@/widgets/sidebar-nav/ui/nav-collapse";
import { NavLinkItem } from "@/widgets/sidebar-nav/ui/nav-link-item";

type Props = { pendingLeaveCount: number };

function LeaveBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}

function TopNavLink({
  item,
  active,
  pendingLeaveCount,
}: {
  item: NavLinkConfig;
  active: boolean;
  pendingLeaveCount: number;
}) {
  const badge =
    item.showLeaveBadge && pendingLeaveCount > 0 ? (
      <LeaveBadge count={pendingLeaveCount} />
    ) : undefined;
  return (
    <NavLinkItem href={item.href} label={item.label} active={active} Icon={item.Icon} trailing={badge} />
  );
}

function itemAllowed(
  user: Parameters<typeof hasPermission>[0],
  gate: { permission?: string; anyOf?: string[]; selfService?: boolean },
): boolean {
  if (gate.selfService && hasAnyHrmAccess(user)) return true;
  return canAccessNavItem(user, gate);
}

function filterNav(user: Parameters<typeof hasPermission>[0], items: NavItemConfig[]): NavItemConfig[] {
  const out: NavItemConfig[] = [];
  for (const item of items) {
    if (isNavGroup(item)) {
      const children = item.children.filter((c) => itemAllowed(user, c));
      if (!children.length) continue;
      if (!itemAllowed(user, item) && !children.length) continue;
      out.push({ ...item, children } as NavGroupConfig);
      continue;
    }
    if (itemAllowed(user, item)) out.push(item);
  }
  return out;
}

export function SidebarMenu({ pendingLeaveCount }: Props) {
  const { user } = useAuth();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const search = searchParams?.toString() ? `?${searchParams.toString()}` : "";

  const items = useMemo(() => filterNav(user, hrmNavItems), [user]);

  return (
    <nav
      className="sidebar-nav-scroll flex min-h-0 flex-1 flex-col gap-0.5 overflow-x-hidden overflow-y-auto overscroll-contain p-3 pt-4"
      aria-label="Main"
    >
      {items.map((item) => {
        if (isNavGroup(item)) {
          return (
            <NavCollapse
              key={item.id}
              label={item.label}
              Icon={item.Icon}
              children={item.children}
            />
          );
        }
        return (
          <TopNavLink
            key={item.id}
            item={item}
            active={isNavHrefActive(pathname, search, item.href)}
            pendingLeaveCount={pendingLeaveCount}
          />
        );
      })}
    </nav>
  );
}
