import { updateHomepageHeroAction } from "@/app/admin/site-management/homepage/homepage-actions";

import { AdminCard } from "@/components/admin/ui/AdminCard";
import { AdminActionButton } from "@/components/admin/ui/AdminActionButton";

import type { HomepageHero } from "@/lib/types/homepage";

type HomepageHeroCardProps = {
  hero: HomepageHero;
};

export function HomepageHeroCard({
  hero,
}: HomepageHeroCardProps) {
  async function updateHero(formData: FormData) {
    "use server";

    await updateHomepageHeroAction(hero.id, {
      eyebrow_ar: formData.get("eyebrow_ar"),
      eyebrow_en: formData.get("eyebrow_en"),

      title_line_1_ar: formData.get("title_line_1_ar"),
      title_line_1_en: formData.get("title_line_1_en"),

      title_line_2_ar: formData.get("title_line_2_ar"),
      title_line_2_en: formData.get("title_line_2_en"),

      description_ar: formData.get("description_ar"),
      description_en: formData.get("description_en"),

      primary_cta_label_ar: formData.get("primary_cta_label_ar"),
      primary_cta_label_en: formData.get("primary_cta_label_en"),
      primary_cta_href: formData.get("primary_cta_href"),

      secondary_cta_label_ar: formData.get("secondary_cta_label_ar"),
      secondary_cta_label_en: formData.get("secondary_cta_label_en"),
      secondary_cta_href: formData.get("secondary_cta_href"),

      stat_1_value: formData.get("stat_1_value"),
      stat_1_label_ar: formData.get("stat_1_label_ar"),
      stat_1_label_en: formData.get("stat_1_label_en"),

      stat_2_value: formData.get("stat_2_value"),
      stat_2_label_ar: formData.get("stat_2_label_ar"),
      stat_2_label_en: formData.get("stat_2_label_en"),

      stat_3_value: formData.get("stat_3_value"),
      stat_3_label_ar: formData.get("stat_3_label_ar"),
      stat_3_label_en: formData.get("stat_3_label_en"),
    });
  }

  return (
    <AdminCard className="p-8">
      <div className="mb-8">
        <h2
          className="text-3xl font-light text-white"
          style={{
            fontFamily: "var(--font-cormorant)",
          }}
        >
          Homepage Hero
        </h2>

        <p className="mt-2 text-sm text-gray-400">
          Manage the homepage hero content.
        </p>
      </div>

      <form action={updateHero} className="grid gap-8">

        <Section title="Eyebrow">
          <TextField
            label="Arabic"
            name="eyebrow_ar"
            defaultValue={hero.eyebrow_ar}
          />

          <TextField
            label="English"
            name="eyebrow_en"
            defaultValue={hero.eyebrow_en}
          />
        </Section>

        <Section title="Title">
          <TextField
            label="Arabic Line 1"
            name="title_line_1_ar"
            defaultValue={hero.title_line_1_ar}
          />

          <TextField
            label="English Line 1"
            name="title_line_1_en"
            defaultValue={hero.title_line_1_en}
          />

          <TextField
            label="Arabic Line 2"
            name="title_line_2_ar"
            defaultValue={hero.title_line_2_ar}
          />

          <TextField
            label="English Line 2"
            name="title_line_2_en"
            defaultValue={hero.title_line_2_en}
          />
        </Section>

        <Section title="Description">
          <TextareaField
            label="Arabic"
            name="description_ar"
            defaultValue={hero.description_ar}
          />

          <TextareaField
            label="English"
            name="description_en"
            defaultValue={hero.description_en}
          />
        </Section>

        <Section title="Primary CTA">
          <TextField
            label="Arabic"
            name="primary_cta_label_ar"
            defaultValue={hero.primary_cta_label_ar}
          />

          <TextField
            label="English"
            name="primary_cta_label_en"
            defaultValue={hero.primary_cta_label_en}
          />

          <TextField
            label="URL"
            name="primary_cta_href"
            defaultValue={hero.primary_cta_href}
          />
        </Section>

        <Section title="Secondary CTA">
          <TextField
            label="Arabic"
            name="secondary_cta_label_ar"
            defaultValue={hero.secondary_cta_label_ar}
          />

          <TextField
            label="English"
            name="secondary_cta_label_en"
            defaultValue={hero.secondary_cta_label_en}
          />

          <TextField
            label="URL"
            name="secondary_cta_href"
            defaultValue={hero.secondary_cta_href}
          />
        </Section>

        <div>
          <AdminActionButton
            type="submit"
            variant="gold"
          >
            Save Hero
          </AdminActionButton>
        </div>

      </form>
    </AdminCard>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="mb-4 text-lg font-light text-white">
        {title}
      </h3>

      <div className="grid gap-5 md:grid-cols-2">
        {children}
      </div>
    </section>
  );
}

function TextField({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue: string | null;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs uppercase tracking-wider text-gray-400">
        {label}
      </span>

      <input
        name={name}
        defaultValue={defaultValue ?? ""}
        className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
      />
    </label>
  );
}

function TextareaField({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue: string | null;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs uppercase tracking-wider text-gray-400">
        {label}
      </span>

      <textarea
        rows={5}
        name={name}
        defaultValue={defaultValue ?? ""}
        className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
      />
    </label>
  );
}