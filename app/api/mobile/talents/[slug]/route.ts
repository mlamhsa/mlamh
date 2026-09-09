import { NextResponse } from "next/server";

import { getRequestUser } from "@/lib/auth/request-user";
import { toMobilePublicTalent } from "@/lib/mobile/public-talent-contract";
import { getPublishedTalentBySlug } from "@/lib/supabase/public-talents";
import { resolveTalentAccess } from "@/lib/talent/trust-access";

function galleryForTalent(talent: Awaited<ReturnType<typeof getPublishedTalentBySlug>>) {
  if (!talent) return [];
  return [...new Set([
    ...(Array.isArray(talent.gallery_images) ? talent.gallery_images : []),
    ...(Array.isArray(talent.photos) ? talent.photos : []),
    ...(Array.isArray(talent.full_body_photos) ? talent.full_body_photos : []),
  ].filter((value): value is string => typeof value === "string" && Boolean(value.trim())))].slice(0, 12);
}

export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const url = new URL(request.url);
  const locale = url.searchParams.get("locale") === "en" ? "en" : "ar";

  try {
    const [talent, auth] = await Promise.all([
      getPublishedTalentBySlug(slug),
      getRequestUser(request).catch(() => null),
    ]);
    if (!talent) {
      return NextResponse.json({ ok: false, code: "TALENT_NOT_FOUND" }, { status: 404 });
    }

    const userId = auth?.ok ? auth.user.id : null;
    const access = await resolveTalentAccess(userId);
    const photoVisibility = talent.photo_visibility ?? "public";
    const owner = Boolean(userId && talent.user_id && userId === talent.user_id);
    const canViewGallery = owner
      || photoVisibility === "public"
      || (photoVisibility === "verified_publishers" && access.verified);

    return NextResponse.json({
      ok: true,
      item: {
        ...toMobilePublicTalent(talent, locale),
        galleryImages: canViewGallery ? galleryForTalent(talent) : [],
      },
    }, {
      headers: {
        "Cache-Control": userId ? "private, no-store" : "public, max-age=30, stale-while-revalidate=60",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  } catch (error) {
    console.error("[api/mobile/talents/slug]", error);
    return NextResponse.json({ ok: false, code: "TALENT_LOOKUP_FAILED" }, { status: 500 });
  }
}
