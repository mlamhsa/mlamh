import Link from "next/link";
import { notFound } from "next/navigation";
import { EditTalentGalleryManager } from "@/components/admin/EditTalentGalleryManager";
import { updateTalentAction } from "@/lib/actions/update-talent";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { getTalentById } from "@/lib/supabase/talent-by-id";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ updated?: string }>;
};

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  dir,
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  type?: string;
  dir?: "ltr" | "rtl";
}) {
  return (
    <div>
      <label className="mb-2 block text-[10px] uppercase tracking-[0.3em] text-gray-muted">
        {label}
      </label>

      <input
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        dir={dir}
        className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-gold/40"
      />
    </div>
  );
}

function TextArea({
  label,
  name,
  defaultValue,
  dir,
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

export default async function EditTalentPage({
  params,
  searchParams,
}: PageProps) {
  await requireAdminAccess();

  const { id } = await params;
  const { updated } = await searchParams;

  const talentId = Number(id);

  if (!Number.isFinite(talentId) || talentId <= 0) {
    notFound();
  }

  const talent = await getTalentById(talentId);

  if (!talent) {
    notFound();
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-10 text-white">
      <header className="mb-10 flex flex-col gap-6 border-b border-white/[0.08] pb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.4em] text-gold">
            MLAMH ADMIN
          </p>

          <h1
            className="mt-3 text-3xl font-light tracking-tight text-white md:text-5xl"
            style={{ fontFamily: "var(--font-cormorant)" }}
          >
            Edit Talent Profile
          </h1>

          <p className="mt-3 text-sm text-gray-muted">
            Editing profile #{talent.id}
          </p>
        </div>

        <Link
          href="/admin"
          className="rounded-full border border-white/10 px-5 py-3 text-[10px] uppercase tracking-[0.3em] text-white/60 transition hover:border-gold/40 hover:text-gold"
        >
          Back to dashboard
        </Link>
      </header>

      {updated === "1" ? (
        <div className="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-300">
          Profile updated successfully.
        </div>
      ) : null}

      <form
        action={updateTalentAction}
        className="rounded-2xl border border-white/[0.08] bg-gray-elevated/30 p-6"
      >
        <input type="hidden" name="id" value={talent.id} />
        <input
          type="hidden"
          name="current_verified_at"
          value={talent.verified_at ?? ""}
        />

        <section className="mb-10">
          <h2 className="mb-6 text-sm uppercase tracking-[0.3em] text-gold">
            Identity
          </h2>

          <div className="grid gap-6 md:grid-cols-2">
            <Field
              label="Name EN"
              name="name_en"
              defaultValue={talent.name_en}
              dir="ltr"
            />

            <Field
              label="Name AR"
              name="name_ar"
              defaultValue={talent.name_ar}
              dir="rtl"
            />

            <Field
              label="Display Name EN"
              name="display_name_en"
              defaultValue={talent.display_name_en}
              dir="ltr"
            />

            <Field
              label="Display Name AR"
              name="display_name_ar"
              defaultValue={talent.display_name_ar}
              dir="rtl"
            />

            <Field
              label="Category EN"
              name="category_en"
              defaultValue={talent.category_en}
              dir="ltr"
            />

            <Field
              label="Category AR"
              name="category_ar"
              defaultValue={talent.category_ar}
              dir="rtl"
            />
          </div>
        </section>

        <section className="mb-10">
          <h2 className="mb-6 text-sm uppercase tracking-[0.3em] text-gold">
            Details
          </h2>

          <div className="grid gap-6 md:grid-cols-2">
            <Field
              label="City EN"
              name="city_en"
              defaultValue={talent.city_en}
              dir="ltr"
            />

            <Field
              label="City AR"
              name="city_ar"
              defaultValue={talent.city_ar}
              dir="rtl"
            />

            <Field
              label="Age"
              name="age"
              type="number"
              defaultValue={talent.age}
              dir="ltr"
            />

            <Field
              label="Height"
              name="height"
              defaultValue={talent.height}
              dir="ltr"
            />

            <div className="md:col-span-2">
              <TextArea
                label="Bio EN"
                name="bio_en"
                defaultValue={talent.bio_en}
                dir="ltr"
              />
            </div>

            <div className="md:col-span-2">
              <TextArea
                label="Bio AR"
                name="bio_ar"
                defaultValue={talent.bio_ar}
                dir="rtl"
              />
            </div>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="mb-6 text-sm uppercase tracking-[0.3em] text-gold">
            Contact & Social
          </h2>

          <div className="grid gap-6 md:grid-cols-2">
            <Field
              label="WhatsApp"
              name="whatsapp"
              defaultValue={talent.whatsapp}
              dir="ltr"
            />

            <Field
              label="Instagram"
              name="instagram"
              defaultValue={talent.instagram}
              dir="ltr"
            />

            <Field
              label="TikTok"
              name="tiktok"
              defaultValue={talent.tiktok}
              dir="ltr"
            />

            <Field
              label="Snapchat"
              name="snapchat"
              defaultValue={talent.snapchat}
              dir="ltr"
            />

            <div className="md:col-span-2">
              <Field
                label="Portfolio URL"
                name="portfolio_url"
                defaultValue={talent.portfolio_url}
                dir="ltr"
              />
            </div>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="mb-6 text-sm uppercase tracking-[0.3em] text-gold">
            Gallery
          </h2>

          <EditTalentGalleryManager
            talentId={talent.id}
            imageUrl={talent.image_url}
            galleryImages={talent.gallery_images}
            alt={talent.name_en || "Talent image"}
          />
        </section>

        <section className="mb-10">
          <h2 className="mb-6 text-sm uppercase tracking-[0.3em] text-gold">
            Publishing
          </h2>

          <div className="grid gap-6 md:grid-cols-2">
            <Field
              label="Sort Order"
              name="sort_order"
              type="number"
              defaultValue={talent.sort_order}
              dir="ltr"
            />

            <div>
              <label className="mb-2 block text-[10px] uppercase tracking-[0.3em] text-gray-muted">
                Status
              </label>

              <select
                name="status"
                defaultValue={talent.status ?? "pending"}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-gold/40"
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-[10px] uppercase tracking-[0.3em] text-gray-muted">
                Availability
              </label>

              <select
                name="availability_status"
                defaultValue={talent.availability_status ?? "available_now"}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-gold/40"
              >
                <option value="available_now">Available Now</option>
                <option value="available_this_week">
                  Available This Week
                </option>
                <option value="available_next_month">
                  Available Next Month
                </option>
                <option value="unavailable">Unavailable</option>
              </select>
            </div>

            <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/80">
              <input
                type="checkbox"
                name="featured"
                defaultChecked={Boolean(talent.featured)}
                className="h-4 w-4"
              />
              Featured
            </label>

            <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/80">
              <input
                type="checkbox"
                name="published"
                defaultChecked={Boolean(talent.published)}
                className="h-4 w-4"
              />
              Published
            </label>

            <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/80">
              <input
                type="checkbox"
                name="verified"
                defaultChecked={Boolean(talent.verified)}
                className="h-4 w-4"
              />
              Verified
            </label>
          </div>
        </section>

        <div className="flex flex-wrap gap-3 border-t border-white/[0.08] pt-6">
          <button
            type="submit"
            className="rounded-full border border-gold/40 bg-gold/[0.06] px-6 py-3 text-[10px] uppercase tracking-[0.3em] text-gold transition hover:bg-gold/10"
          >
            Save Changes
          </button>

          <Link
            href="/admin"
            className="rounded-full border border-white/10 px-6 py-3 text-[10px] uppercase tracking-[0.3em] text-white/60 transition hover:border-white/30 hover:text-white"
          >
            Cancel
          </Link>
        </div>
      </form>
    </main>
  );
}