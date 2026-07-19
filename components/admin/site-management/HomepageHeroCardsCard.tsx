import { updateHomepageHeroCardAction } from "@/app/admin/site-management/homepage/homepage-actions";

import { AdminActionButton } from "@/components/admin/ui/AdminActionButton";
import { AdminCard } from "@/components/admin/ui/AdminCard";

import type { HomepageHeroCard } from "@/lib/types/homepage";

type Props = {
  cards: HomepageHeroCard[];
};

export function HomepageHeroCardsCard({
  cards,
}: Props) {
  return (
    <AdminCard className="p-8">
      <div className="mb-8">
        <h2
          className="text-3xl font-light text-white"
          style={{
            fontFamily: "var(--font-cormorant)",
          }}
        >
          Hero Cards
        </h2>

        <p className="mt-2 text-sm text-gray-400">
          Manage the three feature cards displayed beside the hero.
        </p>
      </div>

      <div className="space-y-8">
        {cards.map((card, index) => (
          <HeroCardForm
            key={card.id}
            card={card}
            index={index + 1}
          />
        ))}
      </div>
    </AdminCard>
  );
}

function HeroCardForm({
  card,
  index,
}: {
  card: HomepageHeroCard;
  index: number;
}) {
  async function update(formData: FormData) {
    "use server";

    await updateHomepageHeroCardAction(card.id, {
      icon_key: formData.get("icon_key"),
      title_ar: formData.get("title_ar"),
      title_en: formData.get("title_en"),
      description_ar: formData.get("description_ar"),
      description_en: formData.get("description_en"),
      sort_order: Number(formData.get("sort_order")),
      is_active: formData.get("is_active") === "on",
    });
  }

  return (
    <form
      action={update}
      className="rounded-2xl border border-white/10 p-6"
    >
      <div className="mb-6">
        <h3 className="text-xl font-light text-white">
          Card {index}
        </h3>
      </div>

      <div className="grid gap-5 md:grid-cols-2">

        <Field
          label="Icon"
          name="icon_key"
          defaultValue={card.icon_key}
        />

        <Field
          label="Sort Order"
          name="sort_order"
          defaultValue={String(card.sort_order)}
        />

        <Field
          label="Arabic Title"
          name="title_ar"
          defaultValue={card.title_ar}
        />

        <Field
          label="English Title"
          name="title_en"
          defaultValue={card.title_en}
        />

      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-2">

        <Textarea
          label="Arabic Description"
          name="description_ar"
          defaultValue={card.description_ar}
        />

        <Textarea
          label="English Description"
          name="description_en"
          defaultValue={card.description_en}
        />

      </div>

      <label className="mt-6 flex items-center gap-3 text-white">
        <input
          type="checkbox"
          name="is_active"
          defaultChecked={card.is_active}
        />

        Active
      </label>

      <div className="mt-6">
        <AdminActionButton
          type="submit"
          variant="gold"
        >
          Save Card
        </AdminActionButton>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs uppercase tracking-wider text-gray-400">
        {label}
      </span>

      <input
        name={name}
        defaultValue={defaultValue}
        className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
      />
    </label>
  );
}

function Textarea({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs uppercase tracking-wider text-gray-400">
        {label}
      </span>

      <textarea
        rows={4}
        name={name}
        defaultValue={defaultValue}
        className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
      />
    </label>
  );
}