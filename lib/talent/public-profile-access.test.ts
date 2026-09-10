import test from "node:test";
import assert from "node:assert/strict";

import {
  canRequestTalentFromProfile,
  canViewTalentPrivateContent,
  canViewTalentProfile,
  hideTalentPrivateContent,
} from "./public-profile-access.ts";
import type { Talent } from "../types/talent.ts";

const talent: Talent = {
  id: 1,
  user_id: "talent-user",
  name_en: "Talent",
  name_ar: "موهبة",
  category_en: "Model",
  category_ar: "عارض",
  image_url: "https://cdn.example.com/profile.jpg",
  featured: false,
  sort_order: null,
  published: true,
  status: "approved",
  profile_visibility: "public",
  instagram: "https://instagram.com/example",
  tiktok: "example",
  snapchat: "example",
  whatsapp: "+966500000000",
  portfolio_url: "https://portfolio.example.com",
  portfolio_links: ["https://portfolio.example.com/work"],
  video_intro: "https://video.example.com/intro",
  showreel_url: "https://video.example.com/showreel",
};

const verifiedPublisher = {
  userId: "publisher-user",
  accountType: "publisher",
  approvalStatus: "approved",
  profileStatus: "active",
  publisherVerified: true,
  publisherStatus: "active",
};

test("public projection removes private media and external talent links", () => {
  const projected = hideTalentPrivateContent(talent);

  assert.equal(projected.instagram, null);
  assert.equal(projected.tiktok, null);
  assert.equal(projected.snapchat, null);
  assert.equal(projected.whatsapp, null);
  assert.equal(projected.portfolio_url, null);
  assert.equal(projected.portfolio_links, null);
  assert.equal(projected.video_intro, null);
  assert.equal(projected.showreel_url, null);
  assert.equal(projected.private_access_granted, false);
});

test("public profile is viewable while private profile is not exposed through public profile access", () => {
  assert.equal(
    canViewTalentProfile({ userId: null, accountType: null }, talent),
    true,
  );

  assert.equal(
    canViewTalentProfile(
      verifiedPublisher,
      { ...talent, profile_visibility: "private" },
    ),
    false,
  );
});

test("verified approved active publisher can view protected content only on an accessible talent surface", () => {
  assert.equal(
    canViewTalentPrivateContent(verifiedPublisher, talent.user_id),
    true,
  );
});

test("unverified, pending, or inactive publisher cannot view private talent content", () => {
  assert.equal(
    canViewTalentPrivateContent(
      { ...verifiedPublisher, publisherVerified: false },
      talent.user_id,
    ),
    false,
  );

  assert.equal(
    canViewTalentPrivateContent(
      { ...verifiedPublisher, approvalStatus: "pending" },
      talent.user_id,
    ),
    false,
  );

  assert.equal(
    canViewTalentPrivateContent(
      { ...verifiedPublisher, profileStatus: "suspended" },
      talent.user_id,
    ),
    false,
  );
});

test("talent owner and admin can view private talent content and private profile", () => {
  const privateTalent = { ...talent, profile_visibility: "private" as const };

  assert.equal(
    canViewTalentPrivateContent(
      {
        userId: "talent-user",
        accountType: "talent",
      },
      talent.user_id,
    ),
    true,
  );

  assert.equal(
    canViewTalentProfile(
      { userId: "talent-user", accountType: "talent" },
      privateTalent,
    ),
    true,
  );

  assert.equal(
    canViewTalentProfile(
      { userId: "admin-user", accountType: "admin" },
      privateTalent,
    ),
    true,
  );
});

test("only verified approved active publisher can request talent from profile", () => {
  assert.equal(canRequestTalentFromProfile(verifiedPublisher), true);

  assert.equal(
    canRequestTalentFromProfile({
      ...verifiedPublisher,
      publisherVerified: false,
    }),
    false,
  );

  assert.equal(
    canRequestTalentFromProfile({
      ...verifiedPublisher,
      approvalStatus: "pending",
    }),
    false,
  );
});
