import {
  BarChart3,
  Bell,
  BrainCircuit,
  BriefcaseBusiness,
  Building2,
  ClipboardList,
  CreditCard,
  FileClock,
  Globe2,
  Headphones,
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  ReceiptText,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
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
};

export type AdminNavigationGroup = {
  titleAr: string;
  titleEn: string;
  items: AdminNavigationItem[];
};

export const adminNavigation: AdminNavigationGroup[] = [
  {
    titleAr: "نظرة عامة",
    titleEn: "Overview",
    items: [
      {
        labelAr: "لوحة التحكم",
        labelEn: "Dashboard",
        href: "/admin",
        icon: LayoutDashboard,
      },
      {
        labelAr: "يتطلب إجراء",
        labelEn: "Action Center",
        href: "/admin/action-center",
        icon: FileClock,
        badgeKey: "pendingActions",
      },
    ],
  },
  {
    titleAr: "ذكاء ملامح",
    titleEn: "Intelligence",
    items: [
      {
        labelAr: "AI Command Center",
        labelEn: "AI Command Center",
        href: "/admin/intelligence",
        icon: BrainCircuit,
      },
    ],
  },
  {
    titleAr: "النمو والتسويق",
    titleEn: "Growth & Marketing",
    items: [
      {
        labelAr: "Marketing Hub",
        labelEn: "Marketing Hub",
        href: "/admin/marketing",
        icon: Megaphone,
      },
    ],
  },
  {
    titleAr: "إدارة الحسابات",
    titleEn: "Account Management",
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
    ],
  },
  {
    titleAr: "التشغيل",
    titleEn: "Operations",
    items: [
      {
        labelAr: "الفرص",
        labelEn: "Opportunities",
        href: "/admin/opportunities",
        icon: BriefcaseBusiness,
        badgeKey: "pendingOpportunities",
      },
      {
        labelAr: "MLAMH Casting",
        labelEn: "MLAMH Casting",
        href: "/admin/casting",
        icon: Sparkles,
      },
      {
        labelAr: "الفرص المميزة",
        labelEn: "Featured Opportunities",
        href: "/admin/opportunities/featured",
        icon: Star,
      },
      {
        labelAr: "الطلبات",
        labelEn: "Applications",
        href: "/admin/opportunity-applications",
        icon: ClipboardList,
      },
      {
        labelAr: "مراقبة المحادثات",
        labelEn: "Conversation Monitoring",
        href: "/admin/messages",
        icon: MessageSquare,
        badgeKey: "reportedMessages",
      },
      {
        labelAr: "الدعم والتواصل",
        labelEn: "Support & Contact",
        href: "/admin/support",
        icon: Headphones,
      },
    ],
  },
  {
    titleAr: "الرقابة والتحليلات",
    titleEn: "Monitoring",
    items: [
      {
        labelAr: "التحليلات",
        labelEn: "Analytics",
        href: "/admin/analytics",
        icon: BarChart3,
      },
      {
        labelAr: "المدفوعات",
        labelEn: "Payments",
        href: "/admin/payments",
        icon: CreditCard,
      },
      {
        labelAr: "الاشتراكات والمزايا",
        labelEn: "Subscriptions & Benefits",
        href: "/admin/entitlements",
        icon: ReceiptText,
      },
      {
        labelAr: "الإشعارات",
        labelEn: "Notifications",
        href: "/admin/notifications",
        icon: Bell,
        badgeKey: "notifications",
      },
      {
        labelAr: "سجل العمليات",
        labelEn: "Audit Log",
        href: "/admin/audit-log",
        icon: FileClock,
      },
    ],
  },
  {
    titleAr: "النظام",
    titleEn: "System",
    items: [
      {
        labelAr: "الأسواق",
        labelEn: "Markets",
        href: "/admin/markets",
        icon: Globe2,
      },
      {
        labelAr: "المشرفون والصلاحيات",
        labelEn: "Admins & Roles",
        href: "/admin/admins",
        icon: ShieldCheck,
      },
      {
        labelAr: "الإعدادات",
        labelEn: "Settings",
        href: "/admin/settings",
        icon: Settings,
      },
    ],
  },
];
