import { isFeatureEnabled } from "@/config/features";

export const adminNavigation = [
  {
    label: "Dashboard",
    href: "/admin",
  },
  {
    label: "Talents",
    href: "/admin",
  },
  {
    label: "Publishers",
    href: "/admin/publishers",
  },
  {
    label: "Opportunities",
    href: "/admin/opportunities",
  },
  {
    label: "Applications",
    href: "/admin/opportunity-applications",
  },
  {
    label: "Talent Requests",
    href: "/admin/requests",
  },
  {
    label: "Claim Requests",
    href: "/admin/claim-requests",
  },

  ...(isFeatureEnabled("notifications")
    ? [
        {
          label: "Notifications",
          href: "/admin/notifications",
        },
      ]
    : []),

  ...(isFeatureEnabled("analytics")
    ? [
        {
          label: "Analytics",
          href: "/admin/analytics",
        },
      ]
    : []),

  {
    label: "Settings",
    href: "/admin/settings",
  },
];