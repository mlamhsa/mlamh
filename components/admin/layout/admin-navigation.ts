import { PERMISSIONS, type Permission } from "@/lib/rbac/permissions";

import {
  BarChart3,
  BrainCircuit,
  BriefcaseBusiness,
  Building2,
  CircleDollarSign,
  ClipboardCheck,
  FileClock,
  FileSearch,
  Globe2,
  Headphones,
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  MonitorCog,
  ReceiptText,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

export type AdminBadgeKey =
  | "pendingActions"
  | "pendingPublishers"
  | "pendingOpportunities"
  | "reportedMessages"
  | "notifications";

export type AdminNavigationItem = {
  labelAr: string;
  labelEn: string;
  href: string;
  icon: typeof LayoutDashboard;
  badgeKey?: AdminBadgeKey;
  requiredPermission?: Permission;
};

export type AdminNavigationGroup = {
  id: string;
  titleAr: string;
  titleEn: string;
  defaultOpen?: boolean;
  items: AdminNavigationItem[];
};

export const adminNavigation: AdminNavigationGroup[] = [
  {
    id: "workspace",
    titleAr: "مساحة العمل",
    titleEn: "Workspace",
    defaultOpen: true,
    items: [
      {
        labelAr: "نظرة عامة",
        labelEn: "Overview",
        href: "/admin",
        icon: LayoutDashboard,
      },
      {
        labelAr: "مركز الإجراءات",
        labelEn: "Action Center",
        href: "/admin/action-center",
        icon: ClipboardCheck,
        badgeKey: "pendingActions",
      },
    ],
  },
  {
    id: "operations",
    titleAr: "التشغيل",
    titleEn: "Operations",
    defaultOpen: true,
    items: [
      {
        labelAr: "المواهب",
        labelEn: "Talents",
        href: "/admin/talents",
        icon: Users,
      },
      {
        labelAr: "الناشرون",
        labelEn: "Publishers",
        href: "/admin/publishers",
        icon: Building2,
        badgeKey: "pendingPublishers",
      },
      {
        labelAr: "الفرص",
        labelEn: "Opportunities",
        href: "/admin/opportunities",
        icon: BriefcaseBusiness,
        badgeKey: "pendingOpportunities",
      },
      {
        labelAr: "طلبات التقديم",
        labelEn: "Applications",
        href: "/admin/opportunity-applications",
        icon: FileSearch,
      },
      {
        labelAr: "MLAMH Casting",
        labelEn: "MLAMH Casting",
        href: "/admin/casting",
        icon: Sparkles,
      },
    ],
  },
  {
    id: "communications",
    titleAr: "التواصل",
    titleEn: "Communications",
    items: [
      {
        labelAr: "المحادثات والبلاغات",
        labelEn: "Conversations & Reports",
        href: "/admin/messages",
        icon: MessageSquare,
        badgeKey: "reportedMessages",
      },
      {
        labelAr: "الدعم",
        labelEn: "Support",
        href: "/admin/support",
        icon: Headphones,
      },
    ],
  },
  {
    id: "growth",
    titleAr: "النمو والذكاء",
    titleEn: "Growth & Intelligence",
    items: [
      {
        labelAr: "مركز ذكاء ملامح",
        labelEn: "MLAMH Intelligence",
        href: "/admin/intelligence",
        icon: BrainCircuit,
      },
      {
        labelAr: "مركز التسويق",
        labelEn: "Marketing Hub",
        href: "/admin/marketing",
        icon: Megaphone,
      },
      {
        labelAr: "مشهد ملامح",
        labelEn: "MLAMH Scene",
        href: "/admin/scene",
        icon: Sparkles,
      },
      {
        labelAr: "التحليلات",
        labelEn: "Analytics",
        href: "/admin/analytics",
        icon: BarChart3,
      },
    ],
  },
  {
    id: "commerce",
    titleAr: "الإيرادات",
    titleEn: "Revenue",
    items: [
      {
        labelAr: "المدفوعات",
        labelEn: "Payments",
        href: "/admin/payments",
        icon: CircleDollarSign,
      },
      {
        labelAr: "الاشتراكات والمزايا",
        labelEn: "Subscriptions & Benefits",
        href: "/admin/entitlements",
        icon: ReceiptText,
      },
    ],
  },
  {
    id: "platform",
    titleAr: "إدارة المنصة",
    titleEn: "Platform",
    items: [
      {
        labelAr: "الأسواق",
        labelEn: "Markets",
        href: "/admin/markets",
        icon: Globe2,
      },
      {
        labelAr: "إدارة الموقع",
        labelEn: "Site Management",
        href: "/admin/site-management",
        icon: MonitorCog,
        requiredPermission: PERMISSIONS.ADMIN_SITE_MANAGEMENT_VIEW,
      },
      {
        labelAr: "الإعدادات",
        labelEn: "Settings",
        href: "/admin/settings",
        icon: Settings,
      },
    ],
  },
  {
    id: "security",
    titleAr: "الأمان والحوكمة",
    titleEn: "Security & Governance",
    items: [
      {
        labelAr: "المشرفون والصلاحيات",
        labelEn: "Admins & Access",
        href: "/admin/admins",
        icon: ShieldCheck,
        requiredPermission: PERMISSIONS.ADMINS_VIEW,
      },
      {
        labelAr: "سجل العمليات",
        labelEn: "Audit Log",
        href: "/admin/audit-log",
        icon: FileClock,
        requiredPermission: PERMISSIONS.ADMINS_VIEW,
      },
    ],
  },
];

export function isAdminRouteActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function getActiveAdminNavigation(pathname: string) {
  for (const group of adminNavigation) {
    const item = group.items.find((candidate) =>
      isAdminRouteActive(pathname, candidate.href),
    );

    if (item) {
      return { group, item };
    }
  }

  return null;
}
