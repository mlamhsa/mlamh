import { FooterSectionCard } from "./FooterSectionCard";

type FooterSettings = {
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

type FooterPreviewProps = {
  settings: FooterSettings;
  links: FooterLink[];
};

const sectionLabels: Record<string, string> = {
  platform: "Platform",
  talent: "Talent",
  publisher: "Publisher",
  legal: "Legal",
  social: "Social",
};

export function FooterPreview({
  settings,
  links,
}: FooterPreviewProps) {
  const activeLinks = links
    .filter((link) => link.is_active)
    .sort((a, b) => a.sort_order - b.sort_order);

  const groupedLinks = activeLinks.reduce<Record<string, FooterLink[]>>(
    (groups, link) => {
      if (!groups[link.section]) {
        groups[link.section] = [];
      }

      groups[link.section].push(link);

      return groups;
    },
    {},
  );

  return (
    <FooterSectionCard
      title="Footer Preview"
      description="Preview the active footer content before publishing it on the public website."
    >
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/40">
        <div className="grid gap-10 px-6 py-10 lg:grid-cols-[1.2fr_2fr] lg:px-10">
          <div>
            <p
              className="text-3xl font-light text-white"
              style={{ fontFamily: "var(--font-cormorant)" }}
            >
              MLAMH
            </p>

            {settings.description_en ? (
              <p className="mt-4 max-w-md text-sm leading-6 text-white/50">
                {settings.description_en}
              </p>
            ) : null}

            {settings.description_ar ? (
              <p
                dir="rtl"
                className="mt-3 max-w-md text-sm leading-6 text-white/50"
              >
                {settings.description_ar}
              </p>
            ) : null}

            {settings.show_contact_info ? (
              <div className="mt-6 grid gap-2 text-sm text-white/50">
                {settings.email ? <p>{settings.email}</p> : null}
                {settings.phone ? <p>{settings.phone}</p> : null}

                {settings.address_en ? (
                  <p>{settings.address_en}</p>
                ) : null}

                {settings.address_ar ? (
                  <p dir="rtl">{settings.address_ar}</p>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
            {Object.entries(groupedLinks).map(
              ([section, sectionLinks]) => (
                <div key={section}>
                  <p className="text-xs uppercase tracking-[0.25em] text-gold">
                    {sectionLabels[section] ?? section}
                  </p>

                  <div className="mt-4 grid gap-3">
                    {sectionLinks.map((link) => (
                      <a
                        key={link.id}
                        href={link.href}
                        target={
                          link.open_in_new_tab ? "_blank" : undefined
                        }
                        rel={
                          link.open_in_new_tab
                            ? "noreferrer"
                            : undefined
                        }
                        className="text-sm text-white/55 transition hover:text-white"
                      >
                        {link.label_en}
                      </a>
                    ))}
                  </div>
                </div>
              ),
            )}
          </div>
        </div>

        <div className="border-t border-white/10 px-6 py-5 lg:px-10">
          <div className="flex flex-col gap-2 text-xs text-white/35 md:flex-row md:items-center md:justify-between">
            <p>
              {settings.copyright_en ??
                "© MLAMH. All rights reserved."}
            </p>

            {settings.copyright_ar ? (
              <p dir="rtl">{settings.copyright_ar}</p>
            ) : null}
          </div>
        </div>
      </div>
    </FooterSectionCard>
  );
}