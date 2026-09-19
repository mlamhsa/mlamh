import type { Talent } from "@/lib/types/talent";

const INACTIVE_PROFILE_STATUSES = new Set(["suspended", "blocked", "banned", "disabled"]);
const INACTIVE_PUBLISHER_STATUSES = new Set(["suspended", "blocked", "banned", "disabled", "rejected"]);
const INDIVIDUAL_PUBLISHER_TYPES = new Set(["individual", "salon", "store", "photographer", "marketer"]);

export type TalentProfileViewer = {
  userId: string | null;
  accountType: string | null;
  approvalStatus?: string | null;
  profileStatus?: string | null;
  publisherVerified?: boolean | null;
  publisherVerificationStatus?: string | null;
  publisherStatus?: string | null;
  publisherType?: string | null;
  hasActiveQuickOpportunity?: boolean | null;
};

function isActiveApprovedPublisher(viewer: TalentProfileViewer) {
  const profileApproved = viewer.approvalStatus === "approved";
  const profileActive = !INACTIVE_PROFILE_STATUSES.has(
    viewer.profileStatus?.trim().toLowerCase() ?? "",
  );
  const publisherActive = !INACTIVE_PUBLISHER_STATUSES.has(
    viewer.publisherStatus?.trim().toLowerCase() ?? "",
  );

  return (
    viewer.accountType === "publisher" &&
    profileApproved &&
    profileActive &&
    publisherActive
  );
}

function isActiveVerifiedPublisher(viewer: TalentProfileViewer) {
  const publisherVerified =
    viewer.publisherVerified === true ||
    viewer.publisherVerificationStatus === "verified";

  return isActiveApprovedPublisher(viewer) && publisherVerified;
}

function canViewRestrictedPublisherProfile(viewer: TalentProfileViewer) {
  if (isActiveVerifiedPublisher(viewer)) return true;

  const publisherType = viewer.publisherType?.trim().toLowerCase() ?? "";
  return (
    isActiveApprovedPublisher(viewer) &&
    INDIVIDUAL_PUBLISHER_TYPES.has(publisherType) &&
    viewer.hasActiveQuickOpportunity === true
  );
}

export function canViewTalentProfile(
  viewer: TalentProfileViewer,
  talent: Pick<Talent, "user_id" | "profile_visibility">,
) {
  if (viewer.userId && talent.user_id && viewer.userId === talent.user_id) return true;
  if (viewer.accountType === "admin") return true;

  const visibility = talent.profile_visibility ?? "public";
  if (visibility === "public") return true;
  if (visibility === "verified_publishers") return canViewRestrictedPublisherProfile(viewer);
  return false;
}

export function canViewTalentPrivateContent(
  viewer: TalentProfileViewer,
  talentUserId?: string | null,
) {
  if (!viewer.userId) return false;
  if (talentUserId && viewer.userId === talentUserId) return true;
  if (viewer.accountType === "admin") return true;
  return isActiveVerifiedPublisher(viewer);
}

export function canViewTalentPhotos(
  viewer: TalentProfileViewer,
  talent: Pick<Talent, "user_id" | "photo_visibility">,
) {
  if (viewer.userId && talent.user_id && viewer.userId === talent.user_id) return true;
  if (viewer.accountType === "admin") return true;
  const visibility = talent.photo_visibility ?? "public";
  if (visibility === "public") return true;
  if (visibility === "verified_publishers") return isActiveVerifiedPublisher(viewer);
  return false;
}

export function canRequestTalentFromProfile(viewer: TalentProfileViewer) {
  // Requesting a talent is not the same permission as viewing private talent
  // content. An approved, active publisher may send an opportunity-linked
  // invitation; protected media/contact details still require real publisher
  // verification through canViewTalentPrivateContent/canViewTalentPhotos.
  return isActiveApprovedPublisher(viewer);
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
