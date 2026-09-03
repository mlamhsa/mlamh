import React from "react";
import Link from "next/link";

import OriginalTalentProfilePage, {
  generateMetadata as generateOriginalMetadata,
} from "./TalentProfilePageOriginal";

import { getCurrentAccountType } from "@/lib/auth/get-current-account-type";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPublishedTalentBySlug } from "@/lib/supabase/public-talents";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata(props: PageProps) {
  return generateOriginalMetadata(props);
}

function asArray(children: React.ReactNode): React.ReactNode[] {
  return Array.isArray(children) ? [...children] : [children];
}

function injectBeforeRelatedTalents(
  root: React.ReactElement<{ children?: React.ReactNode }>,
  notice: React.ReactNode,
) {
  const rootChildren = asArray(root.props.children);
  const contentSection = rootChildren[2];

  if (!React.isValidElement<{ children?: React.ReactNode }>(contentSection)) {
    return root;
  }

  const sectionChildren = asArray(contentSection.props.children);
  const container = sectionChildren[1];

  if (!React.isValidElement<{ children?: React.ReactNode }>(container)) {
    return root;
  }

  const containerChildren = asArray(container.props.children);
  containerChildren.splice(Math.min(3, containerChildren.length), 0, notice);

  sectionChildren[1] = React.cloneElement(container, {}, containerChildren);
  rootChildren[2] = React.cloneElement(contentSection, {}, sectionChildren);

  return React.cloneElement(root, {}, rootChildren);
}

async function talentHasProtectedContent(slug: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("talents")
    .select(
      "video_intro, showreel_url, instagram, tiktok, snapchat, whatsapp, portfolio_url, portfolio_links",
    )
    .eq("slug", slug.trim())
    .maybeSingle();

  if (!data) return false;

  return Boolean(
    data.video_intro ||
      data.showreel_url ||
      data.instagram ||
      data.tiktok ||
      data.snapchat ||
      data.whatsapp ||
      data.portfolio_url ||
      (Array.isArray(data.portfolio_links) && data.portfolio_links.length > 0),
  );
}

function LockedTalentContentNotice({
  locale,
  isGuest,
}: {
  locale: Locale;
  isGuest: boolean;
}) {
  const isRtl = locale === "ar";

  return (
    <section
      className="mt-5 overflow-hidden rounded-[1.75rem] border border-gold/20 bg-[linear-gradient(145deg,rgba(201,169,98,0.09),rgba(255,255,255,0.02))] p-5 shadow-2xl shadow-black/20 sm:p-6"
      aria-label={
        isRtl
          ? "المحتوى الخاص للناشرين المعتمدين"
          : "Private content for approved publishers"
      }
    >
      <p
        className={`text-[10px] text-gold ${
          isRtl ? "tracking-normal" : "uppercase tracking-[0.28em]"
        }`}
      >
        {isRtl ? "خصوصية الموهبة" : "Talent privacy"}
      </p>

      <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-3xl">
          <h2 className="text-2xl font-light text-white sm:text-3xl">
            {isRtl
              ? "محتوى خاص للناشرين المعتمدين"
              : "Private content for approved publishers"}
          </h2>
          <p className="mt-3 text-sm leading-7 text-white/55 sm:text-base">
            {isRtl
              ? "الفيديو التعريفي، عرض الأعمال وروابط الموهبة متاحة للناشرين المعتمدين فقط، حفاظًا على خصوصية الموهبة."
              : "Video introductions, showreels and talent links are available only to approved publishers to protect talent privacy."}
          </p>
          {!isGuest ? (
            <p className="mt-2 text-xs leading-6 text-gold/75">
              {isRtl
                ? "سيظهر هذا المحتوى تلقائيًا بعد اعتماد حساب الناشر."
                : "This content will appear automatically once the publisher account is approved."}
            </p>
          ) : null}
        </div>

        {isGuest ? (
          <Link
            href={`/${locale}/login`}
            className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-2xl bg-gold px-6 text-sm font-medium text-black transition duration-300 hover:bg-gold-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/70"
          >
            {isRtl ? "تسجيل الدخول كناشر" : "Sign in as publisher"}
          </Link>
        ) : null}
      </div>
    </section>
  );
}

export default async function TalentProfilePage(props: PageProps) {
  const { locale: localeParam, slug } = await props.params;

  const originalPage = await OriginalTalentProfilePage(props);

  if (!isValidLocale(localeParam) || !React.isValidElement(originalPage)) {
    return originalPage;
  }

  const locale = localeParam as Locale;
  const [talent, accountType, hasProtectedContent] = await Promise.all([
    getPublishedTalentBySlug(slug),
    getCurrentAccountType(),
    talentHasProtectedContent(slug),
  ]);

  if (!talent || talent.private_access_granted || !hasProtectedContent) {
    return originalPage;
  }

  return injectBeforeRelatedTalents(
    originalPage as React.ReactElement<{ children?: React.ReactNode }>,
    <LockedTalentContentNotice
      key="locked-talent-private-content"
      locale={locale}
      isGuest={accountType === null}
    />,
  );
}
