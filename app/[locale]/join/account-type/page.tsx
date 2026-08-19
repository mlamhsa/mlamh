import {
  BriefcaseBusiness,
  Camera,
  Megaphone,
  Scissors,
  ShoppingBag,
  Sparkles,
  Store,
  UserRound,
  Video,
} from "lucide-react";

import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  isValidLocale,
  type Locale,
} from "@/lib/i18n";

import {
  notFound,
  redirect,
} from "next/navigation";

type PageProps = {
  params: Promise<{
    locale: string;
  }>;
};

const publisherTypes = [
  {
    value: "individual",
    ar: "فرد",
    en: "Individual",
    icon: UserRound,
  },
  {
    value: "agency",
    ar: "وكالة",
    en: "Agency",
    icon: BriefcaseBusiness,
  },
  {
    value: "production_company",
    ar: "شركة إنتاج",
    en: "Production Company",
    icon: Video,
  },
  {
    value: "brand",
    ar: "علامة تجارية",
    en: "Brand",
    icon: Sparkles,
  },
  {
    value: "photographer",
    ar: "مصور",
    en: "Photographer",
    icon: Camera,
  },
  {
    value: "marketer",
    ar: "مسوق",
    en: "Marketer",
    icon: Megaphone,
  },
  {
    value: "salon",
    ar: "صالون",
    en: "Salon",
    icon: Scissors,
  },
  {
    value: "store",
    ar: "متجر",
    en: "Store",
    icon: ShoppingBag,
  },
  {
    value: "other",
    ar: "أخرى",
    en: "Other",
    icon: Store,
  },
] as const;

const allowedPublisherTypes =
  new Set(
    publisherTypes.map(
      (type) => type.value,
    ),
  );

async function selectAccountTypeAction(
  formData: FormData,
) {
  "use server";

  const localeValue = String(
    formData.get("locale") ?? "ar",
  );

  const locale: Locale =
    localeValue === "en"
      ? "en"
      : "ar";

  const accountType = String(
    formData.get("account_type") ?? "",
  );

  if (
    accountType !== "talent" &&
    accountType !== "publisher"
  ) {
    redirect(
      `/${locale}/join/account-type?error=invalid`,
    );
  }

  const authClient =
    await createServerSupabaseClient();

  const adminClient =
    createAdminClient();

  const {
    data: { user },
    error: userError,
  } =
    await authClient.auth.getUser();

  if (userError || !user) {
    redirect(`/${locale}/join`);
  }

  const {
    data: existingProfile,
    error: profileLookupError,
  } = await adminClient
    .from("profiles")
    .select(
      `
        id,
        account_type,
        display_name,
        phone
      `,
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileLookupError) {
    console.error(
      "[selectAccountTypeAction] Profile lookup error:",
      profileLookupError,
    );

    redirect(
      `/${locale}/join/account-type?error=profile`,
    );
  }

  /*
   * حساب مكتمل مسبقًا:
   * لا نعيد إنشاء النوع من جديد.
   */
  if (
    existingProfile?.account_type ===
    "admin"
  ) {
    redirect("/admin");
  }

  if (
    existingProfile?.account_type ===
    "talent"
  ) {
    redirect(
      `/${locale}/talent-dashboard`,
    );
  }

  if (
    existingProfile?.account_type ===
    "publisher"
  ) {
    const {
      data: existingPublisher,
      error: publisherLookupError,
    } = await adminClient
      .from("publishers")
      .select("id")
      .eq(
        "profile_id",
        existingProfile.id,
      )
      .maybeSingle();

    if (publisherLookupError) {
      console.error(
        "[selectAccountTypeAction] Publisher lookup error:",
        publisherLookupError,
      );
    }

    if (existingPublisher) {
      redirect(
        `/${locale}/publisher-dashboard`,
      );
    }
  }

  let profileId =
    existingProfile?.id;

  /*
   * إنشاء أو تحديث Profile.
   */
  if (existingProfile) {
    const { error: updateError } =
      await adminClient
        .from("profiles")
        .update({
          account_type: accountType,
        })
        .eq(
          "id",
          existingProfile.id,
        )
        .eq(
          "user_id",
          user.id,
        );

    if (updateError) {
      console.error(
        "[selectAccountTypeAction] Profile update error:",
        updateError,
      );

      redirect(
        `/${locale}/join/account-type?error=profile`,
      );
    }
  } else {
    const {
      data: insertedProfile,
      error: insertError,
    } = await adminClient
      .from("profiles")
      .insert({
        user_id: user.id,
        account_type: accountType,
        display_name:
          user.user_metadata
            ?.display_name ??
          user.user_metadata
            ?.name ??
          user.email ??
          null,
      })
      .select("id")
      .single();

    if (
      insertError ||
      !insertedProfile
    ) {
      console.error(
        "[selectAccountTypeAction] Profile insert error:",
        insertError,
      );

      redirect(
        `/${locale}/join/account-type?error=profile`,
      );
    }

    profileId =
      insertedProfile.id;
  }

  /*
   * رحلة الموهبة الحالية تبقى كما هي.
   */
  if (accountType === "talent") {
    redirect(
      `/${locale}/join/talent`,
    );
  }

  /*
   * الناشر:
   * نحتاج publisher_type لأن الحقل NOT NULL.
   */
  const publisherType = String(
    formData.get("publisher_type") ??
      "",
  );

  if (
    !allowedPublisherTypes.has(
      publisherType as
        | "individual"
        | "agency"
        | "production_company"
        | "brand"
        | "photographer"
        | "marketer"
        | "salon"
        | "store"
        | "other",
    )
  ) {
    redirect(
      `/${locale}/join/account-type?error=publisher_type`,
    );
  }

  if (!profileId) {
    redirect(
      `/${locale}/join/account-type?error=profile`,
    );
  }

  /*
   * contact_name مطلوب في قاعدة البيانات.
   * نستخدم الاسم الموجود أصلًا في Profile/Auth.
   */
  const contactName =
    existingProfile?.display_name?.trim() ||
    String(
      user.user_metadata
        ?.display_name ??
        user.user_metadata?.name ??
        user.email ??
        "",
    ).trim() ||
    (locale === "ar"
      ? "مستخدم ملامح"
      : "MLAMH User");

  const {
    data: existingPublisher,
    error: existingPublisherError,
  } = await adminClient
    .from("publishers")
    .select("id")
    .eq("profile_id", profileId)
    .maybeSingle();

  if (existingPublisherError) {
    console.error(
      "[selectAccountTypeAction] Existing publisher lookup error:",
      existingPublisherError,
    );

    redirect(
      `/${locale}/join/account-type?error=publisher`,
    );
  }

  if (!existingPublisher) {
    const {
      error: publisherInsertError,
    } = await adminClient
      .from("publishers")
      .insert({
        profile_id: profileId,
        publisher_type:
          publisherType,
        contact_name:
          contactName,
      });

    if (publisherInsertError) {
      console.error(
        "[selectAccountTypeAction] Publisher insert error:",
        publisherInsertError,
      );

      redirect(
        `/${locale}/join/account-type?error=publisher`,
      );
    }
  }

  redirect(
    `/${locale}/publisher-dashboard`,
  );
}

export default async function AccountTypePage({
  params,
}: PageProps) {
  const {
    locale: localeParam,
  } = await params;

  if (
    !isValidLocale(localeParam)
  ) {
    notFound();
  }

  const locale =
    localeParam as Locale;

  const isRtl =
    locale === "ar";

  const authClient =
    await createServerSupabaseClient();

  const {
    data: { user },
  } =
    await authClient.auth.getUser();

  if (!user) {
    redirect(`/${locale}/join`);
  }
  const adminClient =
  createAdminClient();

const {
  data: currentProfile,
  error: currentProfileError,
} = await adminClient
  .from("profiles")
  .select(`
    id,
    account_type
  `)
  .eq("user_id", user.id)
  .maybeSingle();

if (currentProfileError) {
  console.error(
    "[AccountTypePage profile lookup]",
    currentProfileError,
  );
}

if (
  currentProfile?.account_type ===
  "admin"
) {
  redirect("/admin");
}

if (
  currentProfile?.account_type ===
  "talent"
) {
  redirect(
    `/${locale}/talent-dashboard`,
  );
}

if (
  currentProfile?.account_type ===
  "publisher"
) {
  const {
    data: currentPublisher,
    error: currentPublisherError,
  } = await adminClient
    .from("publishers")
    .select("id")
    .eq(
      "profile_id",
      currentProfile.id,
    )
    .maybeSingle();

  if (currentPublisherError) {
    console.error(
      "[AccountTypePage publisher lookup]",
      currentPublisherError,
    );
  }

  if (currentPublisher) {
    redirect(
      `/${locale}/publisher-dashboard`,
    );
  }

  redirect(
    `/${locale}/join/publisher`,
  );
}
  return (
    <main
      dir={
        isRtl ? "rtl" : "ltr"
      }
      className="min-h-screen bg-black px-6 py-20 text-white"
    >
      <div className="mx-auto flex min-h-[calc(100vh-10rem)] max-w-5xl items-center justify-center">
        <div className="w-full">
          <div className="mb-12 text-center">
            <p className="text-xs uppercase tracking-[0.35em] text-gold">
              {isRtl
                ? "اختر نوع الحساب"
                : "Choose Account Type"}
            </p>

            <h1 className="mt-4 text-4xl font-light md:text-6xl">
              {isRtl
                ? "كيف تريد استخدام ملامح؟"
                : "How will you use MLAMH?"}
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/45">
              {isRtl
                ? "اختر المسار المناسب لك. يمكنك استكمال بقية بياناتك لاحقًا من لوحة التحكم."
                : "Choose the right path. You can complete the rest of your information later from your dashboard."}
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <form
              action={
                selectAccountTypeAction
              }
            >
              <input
                type="hidden"
                name="locale"
                value={locale}
              />

              <input
                type="hidden"
                name="account_type"
                value="talent"
              />

              <button
                type="submit"
                className="group h-full min-h-[280px] w-full rounded-[2rem] border border-white/10 bg-white/[0.035] p-8 text-start transition hover:border-gold/40 hover:bg-gold/[0.05]"
              >
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-gold/20 bg-gold/[0.06] text-gold">
                  <Sparkles
                    size={24}
                  />
                </div>

                <h2 className="text-3xl font-light text-white">
                  {isRtl
                    ? "أنا موهبة"
                    : "I am Talent"}
                </h2>

                <p className="mt-4 text-sm leading-7 text-white/45">
                  {isRtl
                    ? "أنشئ ملفك المهني، اعرض أعمالك، وتقدم على الفرص المناسبة."
                    : "Create your professional profile, showcase your work, and apply to opportunities."}
                </p>

                <p className="mt-8 text-xs uppercase tracking-[0.22em] text-gold">
                  {isRtl
                    ? "إكمال كموهبة"
                    : "Continue as Talent"}
                </p>
              </button>
            </form>

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-8">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-gold/20 bg-gold/[0.06] text-gold">
                <BriefcaseBusiness
                  size={24}
                />
              </div>

              <h2 className="text-3xl font-light text-white">
                {isRtl
                  ? "أنا ناشر"
                  : "I am Publisher"}
              </h2>

              <p className="mt-4 text-sm leading-7 text-white/45">
                {isRtl
                  ? "انشر الفرص وابحث عن المواهب المناسبة لمشاريعك."
                  : "Publish opportunities and discover the right talent for your projects."}
              </p>

              <p className="mt-7 text-xs uppercase tracking-[0.2em] text-gold">
                {isRtl
                  ? "اختر نوع الناشر"
                  : "Select publisher type"}
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {publisherTypes.map(
                  (type) => {
                    const Icon =
                      type.icon;

                    return (
                      <form
                        key={
                          type.value
                        }
                        action={
                          selectAccountTypeAction
                        }
                      >
                        <input
                          type="hidden"
                          name="locale"
                          value={
                            locale
                          }
                        />

                        <input
                          type="hidden"
                          name="account_type"
                          value="publisher"
                        />

                        <input
                          type="hidden"
                          name="publisher_type"
                          value={
                            type.value
                          }
                        />

                        <button
                          type="submit"
                          className="flex min-h-16 w-full items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-start transition hover:border-gold/40 hover:bg-gold/[0.06]"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gold/20 bg-gold/[0.05] text-gold">
                            <Icon
                              size={
                                17
                              }
                            />
                          </span>

                          <span className="text-sm text-white/75">
                            {isRtl
                              ? type.ar
                              : type.en}
                          </span>
                        </button>
                      </form>
                    );
                  },
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}