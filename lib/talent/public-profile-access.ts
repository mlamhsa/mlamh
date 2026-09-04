import type { Talent } from "@/lib/types/talent";

const INACTIVE_PROFILE_STATUSES = new Set([
  "suspended",
  "blocked",
  "banned",
  "disabled",
]);

export type TalentProfileViewer = {
  userId: string | null;
  accountType: string | null;
  approvalStatus?: string | null;
  profileStatus?: string | null;
};

export function canViewTalentPrivateContent(
  viewer: TalentProfileViewer,
  talentUserId?: string | null,
) {
  if (!viewer.userId) return false;

  if (talentUserId && viewer.userId === talentUserId) {
    return true;
  }

  if (viewer.accountType === "admin") {
    return true;
  }

  if (viewer.accountType !== "publisher") {
    return false;
  }

  if (viewer.approvalStatus !== "approved") {
    return false;
  }

  return !INACTIVE_PROFILE_STATUSES.has(
    viewer.profileStatus?.trim().toLowerCase() ?? "",
  );
}

export function canRequestTalentFromProfile(
  viewer: TalentProfileViewer,
) {
  return (
    viewer.accountType === "publisher" &&
    viewer.approvalStatus === "approved" &&
    !INACTIVE_PROFILE_STATUSES.has(
      viewer.profileStatus?.trim().toLowerCase() ?? "",
    )
  );
}

export function hideTalentPrivateContent(talent: Talent): Talent {
  return {
    ...talent,
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
  return {
    ...talent,
    private_access_granted: true,
  };
}
