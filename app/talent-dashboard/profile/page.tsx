import { redirect } from "next/navigation";

export const metadata = {
  title: "My Profile — MLAMH",
  robots: { index: false, follow: false },
};

/**
 * Canonicalize the legacy non-localized profile route.
 *
 * The maintained talent editor lives under /[locale]/talent-dashboard/profile.
 * Keeping a second editor here risks showing stale fields or validation rules to
 * existing users. Redirect all legacy traffic to the current Saudi/Arabic
 * workspace so both existing and future talents use the same profile experience.
 */
export default function LegacyTalentProfileRedirect() {
  redirect("/ar/talent-dashboard/profile");
}
