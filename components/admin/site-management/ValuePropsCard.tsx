import { updateValuePropAction } from "@/app/admin/site-management/value-props/value-props-actions";

import { AdminActionButton } from "@/components/admin/ui/AdminActionButton";
import { AdminCard } from "@/components/admin/ui/AdminCard";

import type {
  HomepageValueProp,
  HomepageValuePropIcon,
} from "@/lib/types/value-props";

type ValuePropsCardProps = {
  items: HomepageValueProp[];
};

const iconOptions: Array<{
  value: HomepageValuePropIcon;
  label: string;
}> = [
  {
    value: "shield",
    label: "Shield",
  },
  {
    value: "globe",
    label: "Globe",
  },
  {
    value: "zap",
    label: "Zap",
  },
];

export function ValuePropsCard({
  items,
}: ValuePropsCardProps) {
  return (
    <AdminCard className="p-8">
      <div className="mb-8">
        <h2
          className="text-3xl font-light text-white"
          style={{
            fontFamily: "var(--font-cormorant)",
          }}
        >
          Value Props
        </h2>

        <p className="mt-2 text-sm text-gray-400">
          Manage the value proposition cards displayed on the homepage.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-black/20 p-6">
          <p className="text-sm text-white/50">
            No value proposition records were found.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {items.map((item, index) => (
            <ValuePropForm
              key={item.id}
              item={item}
              index={index + 1}
            />
          ))}
        </div>
      )}
    </AdminCard>
  );
}

function ValuePropForm({
  item,
  index,
}: {
  item: HomepageValueProp;
  index: number;
}) {
  async function updateValueProp(formData: FormData) {
    "use server";

    const iconKey = String(
      formData.get("icon_key") ?? "shield",
    ) as HomepageValuePropIcon;

    await updateValuePropAction(item.id, {
      icon_key: iconKey,

      title_ar: String(
        formData.get("title_ar") ?? "",
      ).trim(),

      title_en: String(
        formData.get("title_en") ?? "",
      ).trim(),

      description_ar: String(
        formData.get("description_ar") ?? "",
      ).trim(),

      description_en: String(
        formData.get("description_en") ?? "",
      ).trim(),

      sort_order: Number(
        formData.get("sort_order") ?? 0,
      ),

      is_active:
        formData.get("is_active") === "on",
    });
  }

  return (
    <form
      action={updateValueProp}
      className="rounded-2xl border border-white/10 bg-black/10 p-6"
    >
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xl font-light text-white">
            Value Prop {index}
          </h3>

          <p className="mt-1 text-xs text-white/35">
            Record ID: {item.id}
          </p>
        </div>

        <label className="flex items-center gap-3 text-sm text-white/70">
          <input
            type="checkbox"
            name="is_active"
            defaultChecked={item.is_active}
            className="h-4 w-4 accent-[#c8a96a]"
          />

          Active
        </label>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <SelectField
          label="Icon"
          name="icon_key"
          defaultValue={item.icon_key}
          options={iconOptions}
        />

        <NumberField
          label="Sort Order"
          name="sort_order"
          defaultValue={item.sort_order}
        />

        <TextField
          label="Arabic Title"
          name="title_ar"
          defaultValue={item.title_ar}
          dir="rtl"
        />

        <TextField
          label="English Title"
          name="title_en"
          defaultValue={item.title_en}
          dir="ltr"
        />
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <TextareaField
          label="Arabic Description"
          name="description_ar"
          defaultValue={item.description_ar}
          dir="rtl"
        />

        <TextareaField
          label="English Description"
          name="description_en"
          defaultValue={item.description_en}
          dir="ltr"
        />
      </div>

      <div className="mt-6">
        <AdminActionButton
          type="submit"
          variant="gold"
        >
          Save Value Prop
        </AdminActionButton>
      </div>
    </form>
  );
}

function TextField({
  label,
  name,
  defaultValue,
  dir,
}: {
  label: string;
  name: string;
  defaultValue: string | null;
  dir: "rtl" | "ltr";
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs uppercase tracking-wider text-gray-400">
        {label}
      </span>

      <input
        type="text"
        name={name}
        dir={dir}
        defaultValue={defaultValue ?? ""}
        required
        className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition placeholder:text-white/20 focus:border-gold/40"
      />
    </label>
  );
}

function NumberField({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue: number;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs uppercase tracking-wider text-gray-400">
        {label}
      </span>

      <input
        type="number"
        name={name}
        min={0}
        step={1}
        defaultValue={defaultValue}
        required
        className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-gold/40"
      />
    </label>
  );
}

function TextareaField({
  label,
  name,
  defaultValue,
  dir,
}: {
  label: string;
  name: string;
  defaultValue: string | null;
  dir: "rtl" | "ltr";
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs uppercase tracking-wider text-gray-400">
        {label}
      </span>

      <textarea
        name={name}
        dir={dir}
        rows={5}
        defaultValue={defaultValue ?? ""}
        required
        className="resize-y rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition placeholder:text-white/20 focus:border-gold/40"
      />
    </label>
  );
}

function SelectField({
  label,
  name,
  defaultValue,
  options,
}: {
  label: string;
  name: string;
  defaultValue: HomepageValuePropIcon;
  options: Array<{
    value: HomepageValuePropIcon;
    label: string;
  }>;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs uppercase tracking-wider text-gray-400">
        {label}
      </span>

      <select
        name={name}
        defaultValue={defaultValue}
        className="rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none transition focus:border-gold/40"
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}