import test from "node:test";
import assert from "node:assert/strict";

import {
  canRequestTalentFromProfile,
  canViewTalentPhotos,
  canViewTalentPrivateContent,
  canViewTalentProfile,
  hideTalentPrivateContent,
} from "./public-profile-access.ts";

const approvedPublisher = {
  userId: "publisher-1",
  accountType: "publisher",
  approvalStatus: "approved",
  profileStatus: "active",
};

const guest = { userId: null, accountType: null };

test("approved publisher can access gated private content", () => {
  assert.equal(canViewTalentPrivateContent(approvedPublisher, "talent-1"), true);
  assert.equal(canRequestTalentFromProfile(approvedPublisher), true);
});

test("guest cannot access private content", () => {
  assert.equal(canViewTalentPrivateContent(guest, "talent-1"), false);
});

test("verified-only profile is hidden from guests and visible to approved publishers", () => {
  const talent = { user_id: "talent-1", profile_visibility: "verified_publishers" as const };
  assert.equal(canViewTalentProfile(guest, talent), false);
  assert.equal(canViewTalentProfile(approvedPublisher, talent), true);
});

test("private profile is not exposed to publisher profile browsing", () => {
  const talent = { user_id: "talent-1", profile_visibility: "private" as const };
  assert.equal(canViewTalentProfile(approvedPublisher, talent), false);
  assert.equal(canViewTalentProfile({ userId: "talent-1", accountType: "talent" }, talent), true);
});

test("verified-only photos stay hidden from public projection", () => {
  const talent = {
    id: 1,
    name_en: "Talent",
    name_ar: "موهبة",
    category_en: "Actor",
    category_ar: "ممثل",
    image_url: "https://example.com/photo.jpg",
    gallery_images: ["https://example.com/photo.jpg"],
    featured: false,
    sort_order: 1,
    published: true,
    photo_visibility: "verified_publishers" as const,
  };
  const projected = hideTalentPrivateContent(talent);
  assert.equal(projected.image_url, "");
  assert.deepEqual(projected.gallery_images, []);
  assert.equal(canViewTalentPhotos(guest, talent), false);
  assert.equal(canViewTalentPhotos(approvedPublisher, talent), true);
});
