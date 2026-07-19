import { AdminGrid } from "@/components/admin/ui/AdminGrid";
import { AdminStatCard } from "@/components/admin/ui/AdminStatCard";

type FooterStatsProps = {
  totalLinks: number;
  activeLinks: number;
  sectionsCount: number;
  socialLinksCount: number;
};

export function FooterStats({
  totalLinks,
  activeLinks,
  sectionsCount,
  socialLinksCount,
}: FooterStatsProps) {
  return (
    <AdminGrid className="mb-8 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
      <AdminStatCard label="إجمالي الروابط" value={totalLinks} />

      <AdminStatCard label="الروابط النشطة" value={activeLinks} />

      <AdminStatCard label="أقسام الفوتر" value={sectionsCount} />

      <AdminStatCard label="روابط التواصل" value={socialLinksCount} />
    </AdminGrid>
  );
}