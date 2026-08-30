import { notFound } from "next/navigation";

import {
  AdminCard,
  AdminPageContainer,
  AdminPageHeader,
} from "@/components/admin/ui";
import { getAdminLanguage } from "@/lib/admin/i18n";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { marketingHubNavigation } from "@/lib/marketing/navigation";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ section: string }>;
  searchParams: Promise<{ lang?: string }>;
};

export default async function MarketingHubSectionPage({
  params,
  searchParams,
}: PageProps) {
  await requireAdminAccess();

  const [{ section }, { lang }] = await Promise.all([params, searchParams]);
  const language = getAdminLanguage(lang);
  const isArabic = language === "ar";
  const item = marketingHubNavigation.find(
    (entry) => entry.href === `/admin/marketing/${section}`,
  );

  if (!item) {
    notFound();
  }

  return (
    <AdminPageContainer>
      <AdminPageHeader
        title={isArabic ? item.labelAr : item.labelEn}
        description={
          isArabic
            ? "الوحدة جزء من بنية Marketing Hub المعتمدة. تم تجهيز المسار والحوكمة الأساسية، وسيتم تفعيل البيانات والإجراءات الحقيقية ضمن مراحل التنفيذ دون Mock Data."
            : "This module is part of the approved Marketing Hub architecture. Its route and governance foundation are in place; real data and actions will be activated incrementally without mock data."
        }
      />

      <AdminCard>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-gold/70">
              {isArabic ? "حالة الوحدة" : "Module status"}
            </p>
            <p className="mt-2 text-lg font-light text-white">
              {isArabic ? "Foundation جاهزة — غير مفعلة تشغيليًا بعد" : "Foundation ready — operational activation pending"}
            </p>
          </div>
          <span className="inline-flex w-fit rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/45">
            {isArabic ? "لا توجد بيانات افتراضية" : "No mock data"}
          </span>
        </div>
      </AdminCard>
    </AdminPageContainer>
  );
}
