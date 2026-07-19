import { updateHomepageHeroAction } from "@/app/admin/site-management/homepage/homepage-actions";

import { AdminActionButton } from "@/components/admin/ui/AdminActionButton";
import { AdminCard } from "@/components/admin/ui/AdminCard";

import type { HomepageHero } from "@/lib/types/homepage";

type Props = {
  hero: HomepageHero;
};

export function HomepageStatsCard({ hero }: Props) {
  async function update(formData: FormData) {
    "use server";

    await updateHomepageHeroAction(hero.id, {
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
          style={{ fontFamily: "var(--font-cormorant)" }}
        >
          Hero Statistics
        </h2>

        <p className="mt-2 text-sm text-gray-400">
          Edit the three statistics shown below the hero.
        </p>
      </div>

      <form action={update} className="space-y-8">
        <StatSection
          title="Statistic 1"
          valueName="stat_1_value"
          value={hero.stat_1_value}
          arName="stat_1_label_ar"
          arValue={hero.stat_1_label_ar}
          enName="stat_1_label_en"
          enValue={hero.stat_1_label_en}
        />

        <StatSection
          title="Statistic 2"
          valueName="stat_2_value"
          value={hero.stat_2_value}
          arName="stat_2_label_ar"
          arValue={hero.stat_2_label_ar}
          enName="stat_2_label_en"
          enValue={hero.stat_2_label_en}
        />

        <StatSection
          title="Statistic 3"
          valueName="stat_3_value"
          value={hero.stat_3_value}
          arName="stat_3_label_ar"
          arValue={hero.stat_3_label_ar}
          enName="stat_3_label_en"
          enValue={hero.stat_3_label_en}
        />

        <AdminActionButton
          type="submit"
          variant="gold"
        >
          Save Statistics
        </AdminActionButton>
      </form>
    </AdminCard>
  );
}

function StatSection({
  title,
  valueName,
  value,
  arName,
  arValue,
  enName,
  enValue,
}: {
  title: string;
  valueName: string;
  value: string | null;
  arName: string;
  arValue: string | null;
  enName: string;
  enValue: string | null;
}) {
  return (
    <div className="rounded-2xl border border-white/10 p-6">
      <h3 className="mb-5 text-xl font-light text-white">
        {title}
      </h3>

      <div className="grid gap-5 md:grid-cols-3">
        <Field
          label="Value"
          name={valueName}
          defaultValue={value}
        />

        <Field
          label="Arabic Label"
          name={arName}
          defaultValue={arValue}
        />

        <Field
          label="English Label"
          name={enName}
          defaultValue={enValue}
        />
      </div>
    </div>
  );
}

function Field({
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