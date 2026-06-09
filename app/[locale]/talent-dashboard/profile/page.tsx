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
  searchParams: Promise<{ updated?: string }>;
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
  defaultValue?: string | null;
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
      availability_status
      `
    )
    .eq("user_id", user.id)
    .maybeSingle();

  const isCreateMode = !talent;
  const calculatedAge = calculateAge(talent?.date_of_birth);

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <header className="mb-10 flex flex-col gap-6 border-b border-white/[0.08] pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-gold">
              MLAMH TALENT
            </p>

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
          action={
            isCreateMode
              ? createOwnTalentProfileAction
              : updateOwnTalentProfileAction
          }
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