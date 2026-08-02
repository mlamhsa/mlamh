import Link from "next/link";
import { redirect } from "next/navigation";
import { CategoryCombobox } from "@/components/talent-dashboard/CategoryCombobox";
import { CityCombobox } from "@/components/talent-dashboard/CityCombobox";
import { GalleryUploadField } from "@/components/talent-dashboard/GalleryUploadField";
import { ImageUploadField } from "@/components/talent-dashboard/ImageUploadField";
import { MultiSelectField } from "@/components/talent-dashboard/MultiSelectField";
import { NationalityCombobox } from "@/components/talent-dashboard/NationalityCombobox";
import {
  createOwnTalentProfileAction,
  updateOwnTalentProfileAction,
} from "@/lib/actions/update-own-talent-profile";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata = {
  title: "My Profile — MLAMH",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    updated?: string;
    created?: string;
  }>;
};

const LANGUAGE_OPTIONS = [
  { value: "arabic", label: "Arabic" },
  { value: "english", label: "English" },
  { value: "french", label: "French" },
  { value: "urdu", label: "Urdu" },
  { value: "turkish", label: "Turkish" },
];

const DIALECT_OPTIONS = [
  { value: "najdi", label: "Najdi" },
  { value: "hejazi", label: "Hejazi" },
  { value: "southern", label: "Southern" },
  { value: "northern", label: "Northern" },
  { value: "gulf", label: "Gulf" },
  { value: "egyptian", label: "Egyptian" },
  { value: "levantine", label: "Levantine" },
];

const SKILL_OPTIONS = [
  { value: "acting", label: "Acting" },
  { value: "modeling", label: "Modeling" },
  { value: "voice_over", label: "Voice Over" },
  { value: "presenting", label: "Presenting" },
  { value: "singing", label: "Singing" },
  { value: "dancing", label: "Dancing" },
  { value: "sports", label: "Sports" },
];

const EYE_COLOR_OPTIONS = [
  { value: "brown", label: "Brown" },
  { value: "black", label: "Black" },
  { value: "blue", label: "Blue" },
  { value: "green", label: "Green" },
  { value: "hazel", label: "Hazel" },
  { value: "gray", label: "Gray" },
];

const HAIR_COLOR_OPTIONS = [
  { value: "black", label: "Black" },
  { value: "brown", label: "Brown" },
  { value: "blonde", label: "Blonde" },
  { value: "red", label: "Red" },
  { value: "gray", label: "Gray" },
  { value: "white", label: "White" },
  { value: "dyed", label: "Dyed" },
  { value: "bald", label: "Bald" },
];

const HAIR_TYPE_OPTIONS = [
  { value: "straight", label: "Straight" },
  { value: "wavy", label: "Wavy" },
  { value: "curly", label: "Curly" },
  { value: "coily", label: "Coily" },
  { value: "bald", label: "Bald" },
  { value: "covered", label: "Covered" },
];

const SKIN_COLOR_OPTIONS = [
  { value: "fair", label: "Fair" },
  { value: "light", label: "Light" },
  { value: "medium", label: "Medium" },
  { value: "olive", label: "Olive" },
  { value: "tan", label: "Tan" },
  { value: "brown", label: "Brown" },
  { value: "dark", label: "Dark" },
];

const CLOTHING_SIZE_OPTIONS = [
  { value: "XS", label: "XS" },
  { value: "S", label: "S" },
  { value: "M", label: "M" },
  { value: "L", label: "L" },
  { value: "XL", label: "XL" },
  { value: "XXL", label: "XXL" },
];

function calculateAge(dateOfBirth?: string | null) {
  if (!dateOfBirth) return null;

  const birthDate = new Date(dateOfBirth);
  const today = new Date();

  if (Number.isNaN(birthDate.getTime())) return null;

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }

  return age;
}

type CompletionTalent = Record<
  string,
  string | number | boolean | string[] | null | undefined
>;

function calculateSmartCompletion(
  talent: CompletionTalent | null | undefined,
) {
  const sections = [
    {
      weight: 25,
      fields: [
        "name_en",
        "image_url",
        "category_slug",
        "gender",
        "city_slug",
      ],
    },
    {
      weight: 25,
      fields: [
        "height_cm",
        "weight_kg",
        "eye_color",
        "hair_color",
        "hair_type",
        "skin_color",
        "clothing_size",
        "shoe_size",
      ],
    },
    {
      weight: 20,
      fields: [
        "experience_years",
        "ready_to_travel",
        "has_passport",
        "has_car",
        "work_outside_city",
        "work_outside_country",
      ],
    },
    {
      weight: 30,
      fields: [
        "video_intro",
        "showreel_url",
        "portfolio_url",
      ],
    },
  ];

  let total = 0;

  for (const section of sections) {
    let filled = 0;

    for (const field of section.fields) {
      const value = talent?.[field];

      if (Array.isArray(value)) {
        if (value.length > 0) filled++;
      } else if (typeof value === "boolean") {
        filled++; // boolean valid state
      } else if (value !== null && value !== undefined && value !== "") {
        filled++;
      }
    }

    total += (filled / section.fields.length) * section.weight;
  }

  return Math.round(total);
}

function Field({
  label,
  name,
  defaultValue,
  dir = "ltr",
  required = false,
  type = "text",
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  dir?: "ltr" | "rtl";
  required?: boolean;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-[10px] uppercase tracking-[0.3em] text-gray-muted">
        {label}
      </label>

      <input
        type={type}
        name={name}
        required={required}
        defaultValue={defaultValue ?? ""}
        dir={dir}
        className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-gold/40"
      />
    </div>
  );
}

function SelectField({
  label,
  name,
  defaultValue,
  options,
  required = false,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  required?: boolean;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="mb-2 block text-[10px] uppercase tracking-[0.3em] text-gray-muted">
        {label}
      </label>

      <select
        name={name}
        required={required}
        defaultValue={defaultValue ?? ""}
        className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-gold/40"
      >
        <option value="">Select</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function TextArea({
  label,
  name,
  defaultValue,
  dir = "ltr",
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  dir?: "ltr" | "rtl";
}) {
  return (
    <div>
      <label className="mb-2 block text-[10px] uppercase tracking-[0.3em] text-gray-muted">
        {label}
      </label>

      <textarea
        name={name}
        defaultValue={defaultValue ?? ""}
        dir={dir}
        rows={5}
        className="w-full resize-y rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-gold/40"
      />
    </div>
  );
}

export default async function TalentProfileEditorPage({
  params,
  searchParams,
}: PageProps) {
  const { locale } = await params;
  const { updated, created } = await searchParams;

  const authClient = await createServerSupabaseClient();

  const {
    data: { user },
    error,
  } = await authClient.auth.getUser();

  if (error || !user) {
    redirect("/ar/talent-login");
  }

  const adminClient = createAdminClient();

  const { data: talent } = await adminClient
    .from("talents")
    .select(
      `
      id,
      slug,
      name_en,
      name_ar,
      display_name_en,
      display_name_ar,
      category_slug,
      category_en,
      category_ar,
      city_en,
      city_ar,
      city_slug,
      image_url,
      gallery_images,
      gender,
      date_of_birth,
      nationality,
      nationality_slug,
      languages,
      dialects,
      skills,
      bio_en,
      bio_ar,
      instagram,
      tiktok,
      snapchat,
      portfolio_url,
      height_cm,
      weight_kg,
      eye_color,
      hair_color,
      hair_type,
      skin_color,
      clothing_size,
      shoe_size,
      chest_size,
      waist_size,
      hip_size,
      experience_years,
      video_intro,
      showreel_url,
      ready_to_travel,
      has_passport,
      has_car,
      work_outside_city,
      work_outside_country,
      availability_status
      `
    )
    .eq("user_id", user.id)
    .maybeSingle();

  const isCreateMode = !talent;
  const calculatedAge = calculateAge(talent?.date_of_birth);
  const profileCompletion = calculateSmartCompletion(talent);

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <header className="mb-10 flex flex-col gap-6 border-b border-white/[0.08] pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-gold">
              MLAMH TALENT
            </p>

            <div className="mt-6 w-full rounded-xl border border-white/10 bg-black/30 p-4">
  <div className="flex items-center justify-between">
    <span className="text-[10px] uppercase tracking-[0.3em] text-gray-muted">
      Profile Completion
    </span>
    <span className="text-gold text-sm">{profileCompletion}%</span>
  </div>

  <div className="mt-3 h-2 w-full rounded-full bg-white/10">
    <div
      className="h-2 rounded-full bg-gold transition-all"
      style={{ width: `${profileCompletion}%` }}
    />
  </div>
</div>

            <h1
              className="mt-3 text-4xl font-light tracking-tight text-white md:text-6xl"
              style={{ fontFamily: "var(--font-cormorant)" }}
            >
              {isCreateMode ? "Create Your Profile" : "Edit My Profile"}
            </h1>

            <p className="mt-3 text-sm text-gray-muted">
              {isCreateMode
                ? "Create your talent profile and submit it for MLAMH review."
                : "Update profile details, availability, biography, and links."}
            </p>
          </div>

          <Link
            href={`/${locale}/talent-dashboard`}
            className="rounded-full border border-white/10 px-5 py-3 text-[10px] uppercase tracking-[0.3em] text-white/60 transition hover:border-gold/40 hover:text-gold"
          >
            Back to Dashboard
          </Link>
        </header>

        {created === "1" ? (
          <div className="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-300">
            Profile created successfully. It is now pending admin review.
          </div>
        ) : null}

        {updated === "1" ? (
          <div className="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-300">
            Profile updated successfully.
          </div>
        ) : null}

        <form
          action={async (formData: FormData) => {
            "use server";

            if (isCreateMode) {
              await createOwnTalentProfileAction(formData);
            } else {
              await updateOwnTalentProfileAction(formData);
            }
          }}
          className="rounded-3xl border border-white/[0.08] bg-gray-elevated/30 p-6"
        >
          <section className="mb-10">
            <h2 className="mb-6 text-sm uppercase tracking-[0.3em] text-gold">
              Identity
            </h2>

            <div className="grid gap-6 md:grid-cols-2">
              {isCreateMode ? (
                <>
                  <Field label="Full Name EN" name="name_en" required />
                  <Field
                    label="Full Name AR"
                    name="name_ar"
                    dir="rtl"
                    required
                  />
                </>
              ) : (
                <>
                  <Field
                    label="Public Name EN"
                    name="readonly_display_name_en"
                    defaultValue={talent.display_name_en || talent.name_en}
                  />

                  <Field
                    label="Public Name AR"
                    name="readonly_display_name_ar"
                    defaultValue={talent.display_name_ar || talent.name_ar}
                    dir="rtl"
                  />
                </>
              )}

              <CategoryCombobox defaultValue={talent?.category_slug} />

              <SelectField
                label="Gender"
                name="gender"
                defaultValue={talent?.gender}
                options={[
                  { value: "male", label: "Male" },
                  { value: "female", label: "Female" },
                ]}
              />

              <Field
                label="Date of Birth"
                name="date_of_birth"
                type="date"
                defaultValue={talent?.date_of_birth}
              />

              {!isCreateMode && calculatedAge !== null ? (
                <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-3">
                  <p className="mb-2 text-[10px] uppercase tracking-[0.3em] text-gray-muted">
                    Age
                  </p>
                  <p className="text-white">{calculatedAge} years</p>
                </div>
              ) : null}

              <NationalityCombobox
                defaultValue={talent?.nationality_slug ?? talent?.nationality}
              />

              <CityCombobox defaultValue={talent?.city_slug} />

              <ImageUploadField
                name="image_url"
                label="Main Image"
                defaultValue={talent?.image_url}
                required
              />

              <GalleryUploadField
                name="gallery_images"
                label="Gallery Images"
                defaultValue={talent?.gallery_images}
              />

              <MultiSelectField
                name="languages"
                label="Languages"
                options={LANGUAGE_OPTIONS}
                defaultValue={talent?.languages}
              />

              <MultiSelectField
                name="dialects"
                label="Dialects"
                options={DIALECT_OPTIONS}
                defaultValue={talent?.dialects}
              />

              <MultiSelectField
                name="skills"
                label="Skills"
                options={SKILL_OPTIONS}
                defaultValue={talent?.skills}
              />
            </div>
          </section>

          <section className="mb-10">
            <h2 className="mb-6 text-sm uppercase tracking-[0.3em] text-gold">
              Physical Details
            </h2>

            <div className="grid gap-6 md:grid-cols-2">
              <Field
                label="Height CM"
                name="height_cm"
                type="number"
                defaultValue={talent?.height_cm}
              />

              <Field
                label="Weight KG"
                name="weight_kg"
                type="number"
                defaultValue={talent?.weight_kg}
              />

              <SelectField
                label="Eye Color"
                name="eye_color"
                defaultValue={talent?.eye_color}
                options={EYE_COLOR_OPTIONS}
              />

              <SelectField
                label="Hair Color"
                name="hair_color"
                defaultValue={talent?.hair_color}
                options={HAIR_COLOR_OPTIONS}
              />

              <SelectField
                label="Hair Type"
                name="hair_type"
                defaultValue={talent?.hair_type}
                options={HAIR_TYPE_OPTIONS}
              />

              <SelectField
                label="Skin Color"
                name="skin_color"
                defaultValue={talent?.skin_color}
                options={SKIN_COLOR_OPTIONS}
              />

              <SelectField
                label="Clothing Size"
                name="clothing_size"
                defaultValue={talent?.clothing_size}
                options={CLOTHING_SIZE_OPTIONS}
              />

              <Field
                label="Shoe Size"
                name="shoe_size"
                type="number"
                defaultValue={talent?.shoe_size}
              />

              <Field
                label="Chest Size"
                name="chest_size"
                type="number"
                defaultValue={talent?.chest_size}
              />

              <Field
                label="Waist Size"
                name="waist_size"
                type="number"
                defaultValue={talent?.waist_size}
              />

              <Field
                label="Hip Size"
                name="hip_size"
                type="number"
                defaultValue={talent?.hip_size}
              />
            </div>
          </section>

          <section className="mb-10">
            <h2 className="mb-6 text-sm uppercase tracking-[0.3em] text-gold">
              Experience & Mobility
            </h2>

            <div className="grid gap-6 md:grid-cols-2">
              <Field
                label="Experience Years"
                name="experience_years"
                type="number"
                defaultValue={talent?.experience_years}
              />

              <Field
                label="Video Intro URL"
                name="video_intro"
                defaultValue={talent?.video_intro}
              />

              <Field
                label="Showreel URL"
                name="showreel_url"
                defaultValue={talent?.showreel_url}
              />

              <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/70">
                <input
                  type="checkbox"
                  name="ready_to_travel"
                  defaultChecked={Boolean(talent?.ready_to_travel)}
                />
                Ready to Travel
              </label>

              <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/70">
                <input
                  type="checkbox"
                  name="has_passport"
                  defaultChecked={Boolean(talent?.has_passport)}
                />
                Has Passport
              </label>

              <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/70">
                <input
                  type="checkbox"
                  name="has_car"
                  defaultChecked={Boolean(talent?.has_car)}
                />
                Has Car
              </label>

              <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/70">
                <input
                  type="checkbox"
                  name="work_outside_city"
                  defaultChecked={Boolean(talent?.work_outside_city)}
                />
                Work Outside City
              </label>

              <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/70">
                <input
                  type="checkbox"
                  name="work_outside_country"
                  defaultChecked={Boolean(talent?.work_outside_country)}
                />
                Work Outside Country
              </label>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="mb-6 text-sm uppercase tracking-[0.3em] text-gold">
              Availability
            </h2>

            <select
              name="availability_status"
              defaultValue={talent?.availability_status ?? "available_now"}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-gold/40"
            >
              <option value="available_now">Available Now</option>
              <option value="available_this_week">Available This Week</option>
              <option value="available_next_month">Available Next Month</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </section>

          <section className="mb-10">
            <h2 className="mb-6 text-sm uppercase tracking-[0.3em] text-gold">
              Details
            </h2>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="md:col-span-2">
                <TextArea
                  label="Bio EN"
                  name="bio_en"
                  defaultValue={talent?.bio_en}
                />
              </div>

              <div className="md:col-span-2">
                <TextArea
                  label="Bio AR"
                  name="bio_ar"
                  defaultValue={talent?.bio_ar}
                  dir="rtl"
                />
              </div>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="mb-6 text-sm uppercase tracking-[0.3em] text-gold">
              Links
            </h2>

            <div className="grid gap-6 md:grid-cols-2">
              <Field
                label="Instagram"
                name="instagram"
                defaultValue={talent?.instagram}
              />

              <Field
                label="TikTok"
                name="tiktok"
                defaultValue={talent?.tiktok}
              />

              <Field
                label="Snapchat"
                name="snapchat"
                defaultValue={talent?.snapchat}
              />

              <Field
                label="Portfolio URL"
                name="portfolio_url"
                defaultValue={talent?.portfolio_url}
              />
            </div>
          </section>

          <div className="flex flex-wrap gap-3 border-t border-white/[0.08] pt-6">
            <button
              type="submit"
              className="rounded-full border border-gold/40 bg-gold/[0.06] px-6 py-3 text-[10px] uppercase tracking-[0.3em] text-gold transition hover:bg-gold/10"
            >
              {isCreateMode ? "Submit For Review" : "Save Changes"}
            </button>

            <Link
              href="/talent-dashboard"
              className="rounded-full border border-white/10 px-6 py-3 text-[10px] uppercase tracking-[0.3em] text-white/60 transition hover:border-white/30 hover:text-white"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
