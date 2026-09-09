import type { Talent } from "@/lib/types/talent";

const INACTIVE_PROFILE_STATUSES = new Set(["suspended", "blocked", "banned", "disabled"]);
const INACTIVE_PUBLISHER_STATUSES = new Set(["suspended", "blocked", "banned", "disabled", "rejected"]);

export type TalentProfileViewer = {
  userId: string | null;
  accountType: string | null;
  approvalStatus?: string | null;
  profileStatus?: string | null;
  publisherVerified?: boolean | null;
  publisherVerificationStatus?: string | null;
  publisherStatus?: string | null;
};

function isActiveVerifiedPublisher(viewer: TalentProfileViewer) {
  const profileApproved = viewer.approvalStatus === "approved";
  const publisherVerified = viewer.publisherVerified === true || viewer.publisherVerificationStatus === "verified";
  const profileActive = !INACTIVE_PROFILE_STATUSES.has(viewer.profileStatus?.trim().toLowerCase() ?? "");
  const publisherActive = !INACTIVE_PUBLISHER_STATUSES.has(viewer.publisherStatus?.trim().toLowerCase() ?? "");
  return viewer.accountType === "publisher" && profileApproved && publisherVerified && profileActive && publisherActive;
}

export function canViewTalentProfile(viewer: TalentProfileViewer, talent: Pick<Talent, "user_id" | "profile_visibility">) {
  if (viewer.userId && talent.user_id && viewer.userId === talent.user_id) return true;
  if (viewer.accountType === "admin") return true;

  const visibility = talent.profile_visibility ?? "public";
  if (visibility === "public") return true;
  if (visibility === "verified_publishers") return isActiveVerifiedPublisher(viewer);
  return false;
}

/**
 * Private/contact content is intentionally stricter than profile visibility.
 * Verification may unlock a gated profile, but it must never expose direct
 * contact channels merely because a publisher is verified. Those details stay
 * protected inside the accepted selection/conversation workflow.
 */
export function canViewTalentPrivateContent(viewer: TalentProfileViewer, talentUserId?: string | null) {
  if (!viewer.userId) return false;
  if (talentUserId && viewer.userId === talentUserId) return true;
  if (viewer.accountType === "admin") return true;
  return false;
}

export function canViewTalentPhotos(viewer: TalentProfileViewer, talent: Pick<Talent, "user_id" | "photo_visibility">) {
  if (viewer.userId && talent.user_id && viewer.userId === talent.user_id) return true;
  if (viewer.accountType === "admin") return true;
  const visibility = talent.photo_visibility ?? "public";
  if (visibility === "public") return true;
  if (visibility === "verified_publishers") return isActiveVerifiedPublisher(viewer);
  return false;
}

export function canRequestTalentFromProfile(viewer: TalentProfileViewer) {
  return isActiveVerifiedPublisher(viewer);
}

export function hideTalentPrivateContent(talent: Talent): Talent {
  const hidePhotos = (talent.photo_visibility ?? "public") !== "public";
  return {
    ...talent,
    ...(hidePhotos ? { image_url: "", gallery_images: [], photos: [], full_body_photos: [] } : {}),
    whatsapp: null,
    instagram: null,
    tiktok: null,
    snapchat: null,
    portfolio_url: null,
    portfolio_links: null,
    video_intro: null,
    showreel_url: null,
    private_access_granted: false,
  };
}

export function grantTalentPrivateContent(talent: Talent): Talent {
  return { ...talent, private_access_granted: true };
}
