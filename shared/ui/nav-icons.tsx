/**
 * Navigation/chrome icons — Lucide for HRM shell.
 */
import type { ComponentProps } from "react";
import {
  Bell,
  Briefcase,
  Building2,
  CalendarDays,
  Clock,
  FileText,
  FolderKanban,
  GitBranch,
  IndianRupee,
  LayoutDashboard,
  Megaphone,
  Menu,
  Network,
  Receipt,
  Search,
  Target,
  UserPlus,
  UserRound,
  UserRoundMinus,
  Users,
  X,
} from "lucide-react";

const stroke = 1.65;

type LucideIconProps = ComponentProps<typeof LayoutDashboard>;

export function IconHome(props: LucideIconProps) {
  return <LayoutDashboard size={22} strokeWidth={stroke} absoluteStrokeWidth {...props} />;
}
export function IconUsers(props: LucideIconProps) {
  return <Users size={22} strokeWidth={stroke} absoluteStrokeWidth {...props} />;
}
export function IconUser(props: LucideIconProps) {
  return <UserRound size={22} strokeWidth={stroke} absoluteStrokeWidth {...props} />;
}
export function IconClock(props: LucideIconProps) {
  return <Clock size={22} strokeWidth={stroke} absoluteStrokeWidth {...props} />;
}
export function IconCalendar(props: LucideIconProps) {
  return <CalendarDays size={22} strokeWidth={stroke} absoluteStrokeWidth {...props} />;
}
export function IconPayroll(props: LucideIconProps) {
  return <IndianRupee size={22} strokeWidth={stroke} absoluteStrokeWidth {...props} />;
}
export function IconBell(props: LucideIconProps) {
  return <Bell size={22} strokeWidth={stroke} absoluteStrokeWidth {...props} />;
}
export function IconMenu(props: LucideIconProps) {
  return <Menu size={22} strokeWidth={stroke} absoluteStrokeWidth {...props} />;
}
export function IconClose(props: LucideIconProps) {
  return <X size={22} strokeWidth={stroke} absoluteStrokeWidth {...props} />;
}
export function IconSearch(props: LucideIconProps) {
  const { className, ...rest } = props;
  return (
    <Search
      size={20}
      strokeWidth={stroke}
      absoluteStrokeWidth
      className={["opacity-60", className].filter(Boolean).join(" ")}
      {...rest}
    />
  );
}
export function IconOrg(props: LucideIconProps) {
  return <Network size={22} strokeWidth={stroke} absoluteStrokeWidth {...props} />;
}
export function IconBuilding(props: LucideIconProps) {
  return <Building2 size={22} strokeWidth={stroke} absoluteStrokeWidth {...props} />;
}
export function IconDirectory(props: LucideIconProps) {
  return <FolderKanban size={22} strokeWidth={stroke} absoluteStrokeWidth {...props} />;
}
export function IconOnboarding(props: LucideIconProps) {
  return <UserPlus size={22} strokeWidth={stroke} absoluteStrokeWidth {...props} />;
}
export function IconOffboarding(props: LucideIconProps) {
  return <UserRoundMinus size={22} strokeWidth={stroke} absoluteStrokeWidth {...props} />;
}
export function IconReimbursement(props: LucideIconProps) {
  return <Receipt size={22} strokeWidth={stroke} absoluteStrokeWidth {...props} />;
}
export function IconRecruitment(props: LucideIconProps) {
  return <Briefcase size={22} strokeWidth={stroke} absoluteStrokeWidth {...props} />;
}
export function IconPerformance(props: LucideIconProps) {
  return <Target size={22} strokeWidth={stroke} absoluteStrokeWidth {...props} />;
}
export function IconAnnouncements(props: LucideIconProps) {
  return <Megaphone size={22} strokeWidth={stroke} absoluteStrokeWidth {...props} />;
}
export function IconDocuments(props: LucideIconProps) {
  return <FileText size={22} strokeWidth={stroke} absoluteStrokeWidth {...props} />;
}
export function IconBranch(props: LucideIconProps) {
  return <GitBranch size={22} strokeWidth={stroke} absoluteStrokeWidth {...props} />;
}
