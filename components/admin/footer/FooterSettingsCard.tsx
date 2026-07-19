import { updateFooterSettingsAction } from "@/app/admin/footer/footer-actions";

import { FooterSectionCard } from "./FooterSectionCard";

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

type FooterSettingsCardProps = {
  settings: FooterSettings;
};

export function FooterSettingsCard({
  settings,
}: FooterSettingsCardProps) {
  async function handleUpdateSettings(formData: FormData) {
    "use server";

    await updateFooterSettingsAction({
      description_ar: formData.get("description_ar"),
      description_en: formData.get("description_en"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      address_ar: formData.get("address_ar"),
      address_en: formData.get("address_en"),
      copyright_ar: formData.get("copyright_ar"),
      copyright_en: formData.get("copyright_en"),
      show_contact_info:
        formData.get("show_contact_info") === "on",
      show_social_links:
        formData.get("show_social_links") === "on",
    });
  }

  return (
    <FooterSectionCard
      title="Footer Settings"
      description="Manage the main footer information displayed across the platform."
    >
      <form action={handleUpdateSettings} className="grid gap-5">
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="description_ar"
              className="text-xs text-white/50"
            >
              Description Arabic
            </label>

            <textarea
              id="description_ar"
              name="description_ar"
              dir="rtl"
              defaultValue={settings.description_ar ?? ""}
              className="mt-2 min-h-32 w-full rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white outline-none transition focus:border-gold/40"
            />
          </div>

          <div>
            <label
              htmlFor="description_en"
              className="text-xs text-white/50"
            >
              Description English
            </label>

            <textarea
              id="description_en"
              name="description_en"
              defaultValue={settings.description_en ?? ""}
              className="mt-2 min-h-32 w-full rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white outline-none transition focus:border-gold/40"
            />
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <InputField
            label="Email"
            name="email"
            type="email"
            value={settings.email}
          />

          <InputField
            label="Phone"
            name="phone"
            type="tel"
            value={settings.phone}
          />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <InputField
            label="Address Arabic"
            name="address_ar"
            value={settings.address_ar}
            dir="rtl"
          />

          <InputField
            label="Address English"
            name="address_en"
            value={settings.address_en}
          />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <InputField
            label="Copyright Arabic"
            name="copyright_ar"
            value={settings.copyright_ar}
            dir="rtl"
          />

          <InputField
            label="Copyright English"
            name="copyright_en"
            value={settings.copyright_en}
          />
        </div>

        <div className="flex flex-wrap gap-6 rounded-2xl border border-white/10 bg-black/20 p-4">
          <label className="flex items-center gap-3 text-sm text-white/60">
            <input
              type="checkbox"
              name="show_contact_info"
              defaultChecked={settings.show_contact_info}
            />

            Show Contact Info
          </label>

          <label className="flex items-center gap-3 text-sm text-white/60">
            <input
              type="checkbox"
              name="show_social_links"
              defaultChecked={settings.show_social_links}
            />

            Show Social Links
          </label>
        </div>

        <button
          type="submit"
          className="w-fit rounded-full border border-gold/40 px-6 py-3 text-xs uppercase tracking-[0.2em] text-gold transition hover:bg-gold hover:text-black"
        >
          Save Settings
        </button>
      </form>
    </FooterSectionCard>
  );
}

function InputField({
  label,
  name,
  value,
  type = "text",
  dir,
}: {
  label: string;
  name: string;
  value: string | null;
  type?: string;
  dir?: "rtl" | "ltr";
}) {
  return (
    <div>
      <label htmlFor={name} className="text-xs text-white/50">
        {label}
      </label>

      <input
        id={name}
        type={type}
        name={name}
        dir={dir}
        defaultValue={value ?? ""}
        className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-gold/40"
      />
    </div>
  );
}