import { requirePermission } from "@/lib/rbac/guards";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import { FooterService } from "@/lib/services/FooterService";

import { AdminPageContainer } from "@/components/admin/ui/AdminPageContainer";
import { AdminPageHeader } from "@/components/admin/ui/AdminPageHeader";

import { FooterLinksCard } from "@/components/admin/footer/FooterLinksCard";
import { FooterPreview } from "@/components/admin/footer/FooterPreview";
import { FooterSettingsCard } from "@/components/admin/footer/FooterSettingsCard";
import { FooterStats } from "@/components/admin/footer/FooterStats";

type FooterSettings = {
  id: number;
  description_ar: string | null;
  description_en: string | null;
  email: string | null;
  phone: string | null;
  address_ar: string | null;
  address_en: string | null;
  copyright_ar: string | null;
  copyright_en: string | null;
  show_contact_info: boolean;
  show_social_links: boolean;
};

type FooterLink = {
  id: number;
  section: string;
  label_ar: string;
  label_en: string;
  href: string;
  sort_order: number;
  is_active: boolean;
  open_in_new_tab: boolean;
};

export default async function AdminFooterPage() {
  await requirePermission(PERMISSIONS.CMS_FOOTER_VIEW);

  const [settingsResult, linksResult] = await Promise.all([
    FooterService.getSettings(),
    FooterService.getLinks(),
  ]);

  if (settingsResult.error) {
    throw new Error(settingsResult.error.message);
  }

  if (linksResult.error) {
    throw new Error(linksResult.error.message);
  }

  const settings = settingsResult.data as FooterSettings;
  const links = (linksResult.data ?? []) as FooterLink[];

  const activeLinks = links.filter((link) => link.is_active);
  const sectionsCount = new Set(links.map((link) => link.section)).size;
  const socialLinksCount = links.filter(
    (link) => link.section === "social",
  ).length;

  return (
    <AdminPageContainer>
      <AdminPageHeader
        eyebrow="SITE MANAGEMENT"
        title="Footer Management"
        description="Manage footer content, navigation links, contact information, and preview how it appears across the platform."
      />

      <FooterStats
        totalLinks={links.length}
        activeLinks={activeLinks.length}
        sectionsCount={sectionsCount}
        socialLinksCount={socialLinksCount}
      />

      <div className="grid gap-8">
        <FooterSettingsCard settings={settings} />

        <FooterLinksCard links={links} />

        <FooterPreview settings={settings} links={links} />
      </div>
    </AdminPageContainer>
  );
}