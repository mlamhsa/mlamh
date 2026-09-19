import Link from "next/link";

import { AdminCard, AdminGrid, AdminPageContainer, AdminPageHeader } from "@/components/admin/ui";
import { getAdminLanguage, withAdminLanguage } from "@/lib/admin/i18n";
import { requirePermission } from "@/lib/rbac/guards";
import { PERMISSIONS } from "@/lib/rbac/permissions";

type PageProps = {
  searchParams: Promise<{ lang?: string }>;
};

const modules = [
  {
    titleAr: "الصفحة الرئيسية",
    titleEn: "Homepage",
    descriptionAr: "إدارة أقسام الصفحة الرئيسية والعناوين والمحتوى المميز والدعوات للإجراء.",
    descriptionEn: "Manage homepage sections, headlines, featured content, and calls to action.",
    href: "/admin/site-management/homepage",
    status: "coming",
  },
  {
    titleAr: "التنقل",
    titleEn: "Navigation",
    descriptionAr: "إدارة روابط التنقل العامة وترتيبها وظهورها والعناوين المترجمة.",
    descriptionEn: "Manage public navigation links, ordering, visibility, and localized labels.",
    href: "/admin/site-management/navigation",
    status: "planned",
  },
  {
    titleAr: "الفوتر",
    titleEn: "Footer",
    descriptionAr: "إدارة محتوى الفوتر وبيانات التواصل والروابط القانونية والاجتماعية.",
    descriptionEn: "Manage footer content, contact information, legal links, and social links.",
    href: "/admin/footer",
    status: "active",
  },
  {
    titleAr: "التواصل",
    titleEn: "Contact",
    descriptionAr: "إدارة بيانات التواصل ومحتوى صفحة الاتصال العامة.",
    descriptionEn: "Manage contact details and public contact-page content.",
    href: "/admin/site-management/contact",
    status: "planned",
  },
  {
    titleAr: "SEO",
    titleEn: "SEO",
    descriptionAr: "إدارة العناوين والوصف ومعاينات المشاركة وإعدادات الفهرسة.",
    descriptionEn: "Manage titles, descriptions, social previews, and indexing settings.",
    href: "/admin/site-management/seo",
    status: "planned",
  },
  {
    titleAr: "القانوني",
    titleEn: "Legal",
    descriptionAr: "إدارة سياسة الخصوصية والشروط والأحكام والمحتوى القانوني.",
    descriptionEn: "Manage privacy policy, terms and conditions, and other legal content.",
    href: "/admin/site-management/legal",
    status: "planned",
  },
] as const;

export default async function SiteManagementPage({ searchParams }: PageProps) {
  await requirePermission(PERMISSIONS.ADMIN_SITE_MANAGEMENT_VIEW);
  const params = await searchParams;
  const language = getAdminLanguage(params.lang);
  const isArabic = language === "ar";

  const statusLabel = (status: (typeof modules)[number]["status"]) => {
    if (status === "active") return isArabic ? "متاح" : "Active";
    if (status === "coming") return isArabic ? "قريبًا" : "Coming Next";
    return isArabic ? "مخطط" : "Planned";
  };

  return (
    <div dir={isArabic ? "rtl" : "ltr"}>
      <AdminPageContainer>
        <AdminPageHeader
          eyebrow={isArabic ? "إدارة المنصة" : "PLATFORM"}
          title={isArabic ? "إدارة الموقع" : "Site Management"}
          description={
            isArabic
              ? "إدارة محتوى الموقع العام وإعداداته من مساحة مركزية واحدة."
              : "Manage public website content and configuration from one central workspace."
          }
        />

        <AdminGrid className="grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {modules.map((module) => {
            const badgeClass =
              module.status === "active"
                ? "border-emerald-500/25 bg-emerald-500/[0.06] text-emerald-300"
                : module.status === "coming"
                  ? "border-gold/25 bg-gold/[0.05] text-gold"
                  : "border-white/[0.08] text-white/35";

            return (
              <Link key={module.href} href={withAdminLanguage(module.href, language)}>
                <AdminCard className="h-full p-5 transition hover:border-gold/20 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h2 className="text-base font-semibold text-white/85">
                        {isArabic ? module.titleAr : module.titleEn}
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-white/38">
                        {isArabic ? module.descriptionAr : module.descriptionEn}
                      </p>
                    </div>

                    <span className={["shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-medium", badgeClass].join(" ")}>
                      {statusLabel(module.status)}
                    </span>
                  </div>
                </AdminCard>
              </Link>
            );
          })}
        </AdminGrid>
      </AdminPageContainer>
    </div>
  );
}
