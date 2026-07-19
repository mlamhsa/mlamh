import Link from "next/link";

import { requirePermission } from "@/lib/rbac/guards";
import { PERMISSIONS } from "@/lib/rbac/permissions";

import { AdminPageContainer } from "@/components/admin/ui/AdminPageContainer";
import { AdminPageHeader } from "@/components/admin/ui/AdminPageHeader";
import { AdminGrid } from "@/components/admin/ui/AdminGrid";
import { AdminCard } from "@/components/admin/ui/AdminCard";

const modules = [
  {
    title: "Homepage",
    description:
      "Manage homepage sections, headlines, featured content, and calls to action.",
    href: "/admin/site-management/homepage",
    status: "Coming Next",
  },
  {
    title: "Navigation",
    description:
      "Manage public navigation links, ordering, visibility, and localized labels.",
    href: "/admin/site-management/navigation",
    status: "Planned",
  },
  {
    title: "Footer",
    description:
      "Manage footer content, contact information, legal links, and social links.",
    href: "/admin/footer",
    status: "Active",
  },
  {
    title: "Contact",
    description:
      "Manage contact details and public contact-page content.",
    href: "/admin/site-management/contact",
    status: "Planned",
  },
  {
    title: "SEO",
    description:
      "Manage titles, descriptions, social previews, and indexing settings.",
    href: "/admin/site-management/seo",
    status: "Planned",
  },
  {
    title: "Legal",
    description:
      "Manage privacy policy, terms and conditions, and other legal content.",
    href: "/admin/site-management/legal",
    status: "Planned",
  },
];

export default async function SiteManagementPage() {
  await requirePermission(
    PERMISSIONS.ADMIN_SITE_MANAGEMENT_VIEW,
  );

  return (
    <AdminPageContainer>
      <AdminPageHeader
        eyebrow="MLAMH ADMIN"
        title="Site Management"
        description="Manage the public website content and configuration from one central area."
      />

      <AdminGrid className="grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {modules.map((module) => (
          <Link key={module.href} href={module.href}>
            <AdminCard className="h-full p-6 transition hover:border-gold/30 hover:bg-gold/[0.03]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2
                    className="text-2xl font-light text-white"
                    style={{ fontFamily: "var(--font-cormorant)" }}
                  >
                    {module.title}
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-gray-muted">
                    {module.description}
                  </p>
                </div>

                <span
                  className={`shrink-0 rounded-full border px-3 py-1 text-[9px] uppercase tracking-[0.2em] ${
                    module.status === "Active"
                      ? "border-emerald-500/30 bg-emerald-500/[0.06] text-emerald-300"
                      : module.status === "Coming Next"
                        ? "border-gold/30 bg-gold/[0.05] text-gold"
                        : "border-white/10 text-white/40"
                  }`}
                >
                  {module.status}
                </span>
              </div>
            </AdminCard>
          </Link>
        ))}
      </AdminGrid>
    </AdminPageContainer>
  );
}